import { EventEmitter, on } from 'events';
import FastifySSEPlugin from 'fastify-sse-v2';

class ChannelManager {
  constructor() {
    this.channels = void 0;
    this.channels = new Map();
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
      this.channels.set(channel, new Set());
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
}
class MessageHistory {
  constructor(messageHistory = [], lastId = 0) {
    this.messageHistory = void 0;
    this.lastId = void 0;
    this.messageHistory = messageHistory;
    this.lastId = lastId;
  }
  messageHistoryForChannel(channelName, lastEventId) {
    return lastEventId !== undefined ? this.messageHistory.filter(item => item.channelName === channelName).filter(item => item.id > lastEventId).map(item => item.message) : [];
  }
  push(channelName, message) {
    this.messageHistory.push({
      channelName,
      id: message.id,
      message
    });
    // keep last 10000 messages.. TODO: make configurable
    this.messageHistory = this.messageHistory.slice(-10000);
  }
  nextId() {
    this.lastId += 1;
    return this.lastId;
  }
}

const channelManager = new ChannelManager();
const messageHistory = new MessageHistory();
const eventEmitter = new EventEmitter();
// https://seg.phault.net/blog/2018/03/async-iterators-cancellation/
/**
 * A downside to this implementation is that `/route/a/<channel>` and
 * `/route/b/<channel>` receive the same events when `<channel>` are the same.
 *
 * The best usage of this is to have a single connection per client, and
 * differnet event listners attached to that one connection.
 */
const fastifyPlugin = (fastifyInstance, opts, done) => {
  var _opts$schema, _opts$preHandler;
  const server = fastifyInstance.withTypeProvider();
  // This might be a problem if imported multiple times?
  server.register(FastifySSEPlugin);
  server.get("/:channel", {
    schema: {
      ...((_opts$schema = opts.schema) != null ? _opts$schema : {}),
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
    preHandler: (_opts$preHandler = opts.preHandler) != null ? _opts$preHandler : [],
    async handler(request, reply) {
      var _opts$didRegisterToCh, _opts$canRegisterToCh;
      const channel = request.params.channel;
      const lastEventId = request.headers["last-event-id"];
      const didRegisterToChannel = (_opts$didRegisterToCh = opts == null ? void 0 : opts.didRegisterToChannel) != null ? _opts$didRegisterToCh : () => null;
      const canRegisterToChannel = (_opts$canRegisterToCh = opts == null ? void 0 : opts.canRegisterToChannel) != null ? _opts$canRegisterToCh : () => true;
      if (await canRegisterToChannel(request, channel)) {
        const missedMessages = messageHistory.messageHistoryForChannel(channel, lastEventId);
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
        });
        /**
         * This needs to be called after the response is made.  Placing it after
         * reply.sse(), however, makes it inaccessible.
         *
         * We use a `setTimeout` to get around that.
         */
        setTimeout(() => didRegisterToChannel(channel));
        reply.sse(async function* () {
          // yield all missed messages based on lastEventId
          for (const missedMessage of missedMessages) {
            yield missedMessage;
          }
          // nodejs.org/api/events.html#eventsonemitter-eventname-options
          try {
            for await (const events of on(eventEmitter, channel, {
              signal: abortController.signal
            })) {
              for (let event of events) {
                yield event;
              }
            }
          } catch {
            // console.log("boooooo");
          }
        }());
      } else {
        return reply.code(400).send({
          error: "Bad Request"
        });
      }
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
  // create a message
  const message = {
    event: eventName,
    data: JSON.stringify(payload),
    id: messageHistory.nextId()
  };
  // push it onto the history stack
  messageHistory.push(channel, message);
  // fire it off
  eventEmitter.emit(channel, message);
  return message;
};
const getConnectionCount = channel => channelManager.getConnectionCount(channel);

export { fastifyPlugin, getConnectionCount, sendSSEMessage };
//# sourceMappingURL=server.esm.js.map
