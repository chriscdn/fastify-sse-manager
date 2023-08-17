"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSSEMessage = exports.fastifyPlugin = void 0;
const events_1 = require("events");
const fastify_sse_v2_1 = __importDefault(require("fastify-sse-v2"));
const eventEmitter = new events_1.EventEmitter();
// https://seg.phault.net/blog/2018/03/async-iterators-cancellation/
const fastifyPlugin = (fastifyInstance, opts, done) => {
    const server = fastifyInstance.withTypeProvider();
    // This might be a problem if imported multiple times?
    // @ts-ignore
    server.register(fastify_sse_v2_1.default);
    server.get("/:channel", {
        schema: {
            ...(opts.schema ?? {}),
            params: {
                type: "object",
                properties: {
                    channel: {
                        type: "string",
                    },
                },
                required: ["channel"],
            },
            headers: {
                type: "object",
                properties: {
                    "last-event-id": {
                        type: "integer",
                    },
                },
            },
            // response: {
            //   200: {},
            // },
        },
        preHandler: opts.preHandler ?? [],
        handler(request, reply) {
            const channel = request.params.channel;
            const lastEventId = request.headers["last-event-id"];
            const missedMessages = messageHistory.messageHistoryForChannel(channel, lastEventId);
            const abortController = new AbortController();
            // https://github.com/NodeFactoryIo/fastify-sse-v2
            request.socket.on("close", () => {
                console.log("*************");
                console.log("SSE Request Closed");
                console.log("*************");
                abortController.abort();
            });
            /**
             * This needs to be called after the response is made.  Placing it after
             * reply.sse(), however, makes it inaccessible.
             *
             * We use a `setTimeout` to get around that.
             */
            setTimeout(() => {
                if (opts?.didRegisterToChannel) {
                    opts.didRegisterToChannel(channel);
                }
            });
            reply.sse((async function* () {
                // yield all missed messages based on lastEventId
                for (const missedMessage of missedMessages) {
                    yield missedMessage;
                }
                // nodejs.org/api/events.html#eventsonemitter-eventname-options
                try {
                    for await (const events of (0, events_1.on)(eventEmitter, channel, {
                        signal: abortController.signal,
                    })) {
                        for (let event of events) {
                            yield event;
                        }
                    }
                }
                catch {
                    // console.log("boooooo");
                }
                // for await (const [event] of on(eventEmitter, "update")) {
                //   yield {
                //     event: event.name,
                //     data: JSON.stringify(event),
                //   };
                // }
            })());
            // here we want to somehow broadcast or notify that a connection was made
        },
    });
    done();
};
exports.fastifyPlugin = fastifyPlugin;
class MessageHistory {
    messageHistory;
    lastId;
    constructor(messageHistory = [], lastId = 0) {
        this.messageHistory = messageHistory;
        this.lastId = lastId;
    }
    messageHistoryForChannel(channelName, lastEventId) {
        return lastEventId !== undefined
            ? this.messageHistory
                .filter((item) => item.channelName === channelName)
                .filter((item) => item.id > lastEventId)
                .map((item) => item.message)
            : [];
    }
    push(channelName, message) {
        this.messageHistory.push({ channelName, id: message.id, message });
        // keep last 1000 messages.. make configurable
        this.messageHistory = this.messageHistory.slice(-1000);
    }
    nextId() {
        this.lastId += 1;
        return this.lastId;
    }
}
const messageHistory = new MessageHistory();
// order matters here
function sendSSEMessage(channelName, eventName, data = {}) {
    // create a message
    const message = {
        event: eventName,
        data: JSON.stringify(data),
        id: messageHistory.nextId(),
    };
    // push it onto the history stack
    messageHistory.push(channelName, message);
    // fire it off
    eventEmitter.emit(channelName, message);
}
exports.sendSSEMessage = sendSSEMessage;
//# sourceMappingURL=fastify-plugin.js.map