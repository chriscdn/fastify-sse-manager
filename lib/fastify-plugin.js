import { EventEmitter, on } from "events";
import FastifySSEPlugin from "fastify-sse-v2";
const eventEmitter = new EventEmitter();
// https://seg.phault.net/blog/2018/03/async-iterators-cancellation/
const fastifyPlugin = (fastifyInstance, opts, done) => {
    const server = fastifyInstance.withTypeProvider();
    // This might be a problem if imported multiple times?
    // @ts-ignore
    server.register(FastifySSEPlugin);
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
            const aIter = on(eventEmitter, channel, {
                signal: abortController.signal,
            });
            reply.sse((async function* () {
                // yield all missed messages based on lastEventId
                for (const missedMessage of missedMessages) {
                    yield missedMessage;
                }
                // https://nodejs.org/api/events.html#eventsonemitter-eventname-options
                for await (const events of aIter) {
                    for (let event of events) {
                        yield event;
                    }
                }
            })());
            // here we want to somehow broadcast or notify that a connection was made
            if (opts?.didRegisterToChannel) {
                opts.didRegisterToChannel(channel);
            }
            // reply.raw.on("close", () => ac.abort());
            // https://github.com/NodeFactoryIo/fastify-sse-v2
            request.socket.on("close", () => {
                console.log("on close");
                abortController.abort();
            });
        },
    });
    done();
};
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
// export default fastifyPlugin;
export { fastifyPlugin, sendSSEMessage };
//# sourceMappingURL=fastify-plugin.js.map