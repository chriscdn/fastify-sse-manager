var events = require('events');
var FastifySSEPlugin = require('fastify-sse-v2');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var FastifySSEPlugin__default = /*#__PURE__*/_interopDefaultLegacy(FastifySSEPlugin);

const eventEmitter = new events.EventEmitter();
// https://seg.phault.net/blog/2018/03/async-iterators-cancellation/
const fastifyPlugin = (fastifyInstance, opts, done) => {
  var _opts$schema, _opts$preHandler;
  const server = fastifyInstance.withTypeProvider();
  // This might be a problem if imported multiple times?
  // @ts-ignore
  server.register(FastifySSEPlugin__default["default"]);
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
    handler(request, reply) {
      const channel = request.params.channel;
      const lastEventId = request.headers["last-event-id"];
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
      if (opts != null && opts.didRegisterToChannel) {
        setTimeout(() => {
          opts.didRegisterToChannel(channel);
        });
      }
      reply.sse(async function* () {
        // yield all missed messages based on lastEventId
        for (const missedMessage of missedMessages) {
          yield missedMessage;
        }
        // nodejs.org/api/events.html#eventsonemitter-eventname-options
        try {
          for await (const events$1 of events.on(eventEmitter, channel, {
            signal: abortController.signal
          })) {
            for (let event of events$1) {
              yield event;
            }
          }
        } catch {
          // console.log("boooooo");
        }
      }());
      // here we want to somehow broadcast or notify that a connection was made
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
// order matters here
const sendSSEMessage = (channelName, eventName, data = null) => {
  // create a message
  const message = {
    event: eventName,
    data: JSON.stringify(data),
    id: messageHistory.nextId()
  };
  // push it onto the history stack
  messageHistory.push(channelName, message);
  // fire it off
  eventEmitter.emit(channelName, message);
  return message;
};

exports.fastifyPlugin = fastifyPlugin;
exports.sendSSEMessage = sendSSEMessage;
//# sourceMappingURL=server.cjs.map
