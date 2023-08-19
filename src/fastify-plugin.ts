import { EventEmitter, on } from "events";

import type {
  FastifyBaseLogger,
  FastifyPluginCallback,
  FastifyPluginOptions,
  FastifyTypeProvider,
  RawServerDefault,
} from "fastify";
import { type JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";
import FastifySSEPlugin from "fastify-sse-v2";

const eventEmitter: EventEmitter = new EventEmitter();

type TOptions = FastifyPluginOptions & {
  schema?: Record<string, any>;
  preHandler?: any;
  didRegisterToChannel?: (channel: string) => void;
};

// https://seg.phault.net/blog/2018/03/async-iterators-cancellation/
const fastifyPlugin: FastifyPluginCallback<
  TOptions,
  RawServerDefault,
  FastifyTypeProvider,
  FastifyBaseLogger
> = (fastifyInstance, opts, done) => {
  const server = fastifyInstance.withTypeProvider<JsonSchemaToTsProvider>();

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
    } as const,

    preHandler: opts.preHandler ?? [],

    handler(request, reply) {
      const channel: string = request.params.channel;
      const lastEventId: number | undefined = request.headers["last-event-id"];

      const missedMessages = messageHistory.messageHistoryForChannel(
        channel,
        lastEventId
      );

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
      if (opts?.didRegisterToChannel) {
        setTimeout(() => {
          opts.didRegisterToChannel!(channel);
        });
      }

      reply.sse(
        (async function* () {
          // yield all missed messages based on lastEventId
          for (const missedMessage of missedMessages) {
            yield missedMessage;
          }

          // nodejs.org/api/events.html#eventsonemitter-eventname-options

          try {
            for await (const events of on(eventEmitter, channel, {
              signal: abortController.signal,
            })) {
              for (let event of events) {
                yield event;
              }
            }
          } catch {
            // console.log("boooooo");
          }

          // for await (const [event] of on(eventEmitter, "update")) {
          //   yield {
          //     event: event.name,
          //     data: JSON.stringify(event),
          //   };
          // }
        })()
      );

      // here we want to somehow broadcast or notify that a connection was made
    },
  });

  done();
};

type TMessage = {
  event: string;
  data: string;
  id: number;
};

type TMessageHistoryItem = {
  channelName: string;
  id: number;
  message: TMessage;
};

class MessageHistory {
  constructor(
    private messageHistory: Array<TMessageHistoryItem> = [],
    private lastId: number = 0
  ) {}

  messageHistoryForChannel(
    channelName: string,
    lastEventId: number | undefined
  ) {
    return lastEventId !== undefined
      ? this.messageHistory
          .filter((item) => item.channelName === channelName)
          .filter((item) => item.id > lastEventId)
          .map((item) => item.message)
      : [];
  }

  push(channelName: string, message: TMessage) {
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
function sendSSEMessage(channelName: string, eventName: string, data = {}) {
  // create a message
  const message: TMessage = {
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
