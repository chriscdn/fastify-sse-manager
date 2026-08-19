import { EventEmitter, on } from "events";
import FastifySSEPlugin from "fastify-sse-v2";
//#region src/utils/server-utils.ts
var ChannelManager = class {
	channels;
	constructor() {
		this.channels = /* @__PURE__ */ new Map();
	}
	addClient(channel, client) {
		this.getClients(channel).add(client);
	}
	removeClient(channel, client) {
		const clients = this.getClients(channel);
		clients.delete(client);
		if (clients.size === 0) this.channels.delete(channel);
	}
	getClients(channel) {
		if (!this.channels.has(channel)) this.channels.set(channel, /* @__PURE__ */ new Set());
		return this.channels.get(channel);
	}
	getConnectionCounts() {
		const result = {};
		for (const [channel, clients] of this.channels.entries()) result[channel] = clients.size;
		return result;
	}
	getConnectionCount(channel) {
		const clients = this.channels.get(channel);
		return clients ? clients.size : 0;
	}
	getActiveChannels() {
		return this.channels.keys();
	}
};
var MessageHistory = class {
	messageHistory;
	lastId;
	maxHistory;
	constructor(messageHistory = [], lastId = 0, maxHistory) {
		this.messageHistory = messageHistory;
		this.lastId = lastId;
		this.maxHistory = maxHistory;
	}
	messageHistoryForChannel(channelName, lastEventId) {
		return lastEventId !== void 0 ? this.messageHistory.filter((item) => item.channelName === channelName).filter((item) => item.id > lastEventId).map((item) => item.message) : [];
	}
	push(channelName, message) {
		this.messageHistory.push({
			channelName,
			id: message.id,
			message
		});
		this.messageHistory = this.messageHistory.slice(-this.maxHistory);
	}
	nextId() {
		this.lastId += 1;
		return this.lastId;
	}
};
//#endregion
//#region src/server.ts
const MAX_HISTORY = 5e3;
const channelManager = new ChannelManager();
const messageHistory = new MessageHistory([], 0, MAX_HISTORY);
const eventEmitter = new EventEmitter();
/**
* A downside to this implementation is that `/route/a/<channel>` and
* `/route/b/<channel>` receive the same events when `<channel>` are the same.
*
* The best usage of this is to have a single connection per client, and
* differnet event listners attached to that one connection.
*/
const fastifyPlugin = (fastifyInstance, opts, done) => {
	const server = fastifyInstance.withTypeProvider();
	server.register(FastifySSEPlugin);
	server.get("/:channel", {
		schema: {
			...opts.schema ?? {},
			params: {
				type: "object",
				properties: { channel: { type: "string" } },
				required: ["channel"]
			},
			headers: {
				type: "object",
				properties: { "last-event-id": { type: "integer" } }
			}
		},
		preHandler: opts.preHandler ?? [],
		async handler(request, reply) {
			const channel = request.params.channel;
			const lastEventId = request.headers["last-event-id"];
			const didRegisterToChannel = opts?.didRegisterToChannel ?? (() => null);
			const didUnregisterFromChannel = opts?.didUnregisterFromChannel ?? (() => null);
			if (await (opts?.canRegisterToChannel ?? (() => true))(request, channel)) {
				const missedMessages = messageHistory.messageHistoryForChannel(channel, lastEventId);
				const ua = request.headers["user-agent"];
				const raw = reply.raw;
				const abortController = new AbortController();
				channelManager.addClient(channel, raw);
				console.log("*************");
				console.log("SSE Request MADE");
				console.log("UA: ", ua);
				console.log("*************");
				const heartbeat = setInterval(() => {
					try {
						raw.write(": ping\n\n");
					} catch {
						clearInterval(heartbeat);
						channelManager.removeClient(channel, raw);
						abortController.abort();
					}
				}, 3e4);
				request.socket.on("close", () => {
					console.log("*************");
					console.log("SSE Request Closed");
					console.log("UA: ", ua);
					console.log("*************");
					clearInterval(heartbeat);
					channelManager.removeClient(channel, raw);
					abortController.abort();
					didUnregisterFromChannel(channel);
				});
				/**
				* This needs to be called after the response is made.  Placing it after
				* reply.sse(), however, makes it inaccessible.
				*
				* We use a `setTimeout` to get around that.
				*/
				setTimeout(() => didRegisterToChannel(channel));
				reply.sse((async function* () {
					for (const missedMessage of missedMessages) yield missedMessage;
					try {
						for await (const events of on(eventEmitter, channel, { signal: abortController.signal })) for (let event of events) yield event;
					} catch {}
				})());
			} else return reply.code(403).send("Forbidden");
		}
	});
	done();
};
/**
* I struggled to make the eventName define the payload, but seems I need to
* explicity set it.
*
* @param channel
* @param eventName
* @param payload
* @returns
*/
const sendSSEMessage = (channel, eventName, payload) => {
	const message = {
		event: eventName,
		data: JSON.stringify(payload),
		id: messageHistory.nextId()
	};
	messageHistory.push(channel, message);
	eventEmitter.emit(channel, message);
	return message;
};
const getConnectionCount = (channel) => channelManager.getConnectionCount(channel);
const getActiveChannels = () => channelManager.getActiveChannels();
//#endregion
export { fastifyPlugin, getActiveChannels, getConnectionCount, sendSSEMessage };

//# sourceMappingURL=server.mjs.map