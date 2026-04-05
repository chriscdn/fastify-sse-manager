// src/server.ts
import { EventEmitter, on } from "events";
import FastifySSEPlugin from "fastify-sse-v2";

// src/utils/server-utils.ts
var ChannelManager = class {
  channels;
  constructor() {
    this.channels = /* @__PURE__ */ new Map();
  }
  addClient(channel, client) {
    const clients = this.getClients(channel);
    clients.add(client);
  }
  removeClient(channel, client) {
    const clients = this.getClients(channel);
    clients.delete(client);
    if (clients.size === 0) {
      this.channels.delete(channel);
    }
  }
  getClients(channel) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, /* @__PURE__ */ new Set());
    }
    return this.channels.get(channel);
  }
  getConnectionCounts() {
    const result = {};
    for (const [channel, clients] of this.channels.entries()) {
      result[channel] = clients.size;
    }
    return result;
  }
  getConnectionCount(channel) {
    const clients = this.channels.get(channel);
    return clients ? clients.size : 0;
  }
};
var MessageHistory = class {
  constructor(messageHistory2 = [], lastId = 0) {
    this.messageHistory = messageHistory2;
    this.lastId = lastId;
  }
  messageHistory;
  lastId;
  messageHistoryForChannel(channelName, lastEventId) {
    return lastEventId !== void 0 ? this.messageHistory.filter((item) => item.channelName === channelName).filter((item) => item.id > lastEventId).map((item) => item.message) : [];
  }
  push(channelName, message) {
    this.messageHistory.push({ channelName, id: message.id, message });
    this.messageHistory = this.messageHistory.slice(-1e4);
  }
  nextId() {
    this.lastId += 1;
    return this.lastId;
  }
};

// src/server.ts
var channelManager = new ChannelManager();
var messageHistory = new MessageHistory();
var eventEmitter = new EventEmitter();
var fastifyPlugin = (fastifyInstance, opts, done) => {
  const server = fastifyInstance.withTypeProvider();
  server.register(FastifySSEPlugin);
  server.get("/:channel", {
    schema: {
      ...opts.schema ?? {},
      params: {
        type: "object",
        properties: {
          channel: {
            type: "string"
          }
        },
        required: ["channel"]
      },
      headers: {
        type: "object",
        properties: {
          "last-event-id": {
            type: "integer"
          }
        }
      }
      // response: {
      //   200: {},
      // },
    },
    preHandler: opts.preHandler ?? [],
    async handler(request, reply) {
      const channel = request.params.channel;
      const lastEventId = request.headers["last-event-id"];
      const didRegisterToChannel = opts?.didRegisterToChannel ?? (() => null);
      const didUnregisterFromChannel = opts?.didUnregisterFromChannel ?? (() => null);
      const canRegisterToChannel = opts?.canRegisterToChannel ?? (() => true);
      if (await canRegisterToChannel(request, channel)) {
        const missedMessages = messageHistory.messageHistoryForChannel(
          channel,
          lastEventId
        );
        const ua = request.headers["user-agent"];
        const raw = reply.raw;
        const abortController = new AbortController();
        channelManager.addClient(channel, raw);
        console.log("*************");
        console.log("SSE Request MADE");
        console.log("UA: ", ua);
        console.log("*************");
        request.socket.on("close", () => {
          console.log("*************");
          console.log("SSE Request Closed");
          console.log("UA: ", ua);
          console.log("*************");
          channelManager.removeClient(channel, raw);
          abortController.abort();
          didUnregisterFromChannel(channel);
        });
        setTimeout(() => didRegisterToChannel(channel));
        reply.sse(
          (async function* () {
            for (const missedMessage of missedMessages) {
              yield missedMessage;
            }
            try {
              for await (const events of on(eventEmitter, channel, {
                signal: abortController.signal
              })) {
                for (let event of events) {
                  yield event;
                }
              }
            } catch {
            }
          })()
        );
      } else {
        return reply.code(400).send({ error: "Bad Request" });
      }
    }
  });
  done();
};
var sendSSEMessage = (channel, eventName, payload) => {
  const message = {
    event: eventName,
    data: JSON.stringify(payload),
    id: messageHistory.nextId()
  };
  messageHistory.push(channel, message);
  eventEmitter.emit(channel, message);
  return message;
};
var getConnectionCount = (channel) => channelManager.getConnectionCount(channel);
export {
  fastifyPlugin,
  getConnectionCount,
  sendSSEMessage
};
//# sourceMappingURL=server.js.map