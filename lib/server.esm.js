import { EventEmitter, on } from 'events';
import FastifySSEPlugin from 'fastify-sse-v2';

const eventEmitter = new EventEmitter();
// https://seg.phault.net/blog/2018/03/async-iterators-cancellation/
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
        const abortController = new AbortController();
        // https://github.com/NodeFactoryIo/fastify-sse-v2
        //
        // This doesn't get called when running Vue in dev mode.  Production is
        // fine.
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
    // keep last 1000 messages.. make configurable
    this.messageHistory = this.messageHistory.slice(-1000);
  }
  nextId() {
    this.lastId += 1;
    return this.lastId;
  }
}
const messageHistory = new MessageHistory();
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

export { fastifyPlugin, sendSSEMessage };
//# sourceMappingURL=server.esm.js.map
