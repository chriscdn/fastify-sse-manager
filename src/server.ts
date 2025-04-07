import { EventEmitter, on } from "events";

import {
  type FastifyBaseLogger,
  type FastifyPluginCallback,
  type FastifyPluginOptions,
  type FastifyRequest,
  type FastifyTypeProvider,
  type RawServerDefault,
} from "fastify";

import { type JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";
import FastifySSEPlugin from "fastify-sse-v2";

import {
  ChannelManager,
  MessageHistory,
  type TMessage,
} from "./utils/server-utils";

const channelManager = new ChannelManager();
const messageHistory = new MessageHistory();

const eventEmitter: EventEmitter = new EventEmitter();

type TOptions = FastifyPluginOptions & {
  schema?: Record<string, any>;
  preHandler?: any;

  didRegisterToChannel?: (channel: string) => void;
  // This was added since preHandler doesn't have the correct augemented types
  // on request.
  canRegisterToChannel?: (
    request: FastifyRequest,
    channel: string,
  ) => Promise<boolean> | boolean;
};

// https://seg.phault.net/blog/2018/03/async-iterators-cancellation/

/**
 * A downside to this implementation is that `/route/a/<channel>` and
 * `/route/b/<channel>` receive the same events when `<channel>` are the same.
 *
 * The best usage of this is to have a single connection per client, and
 * differnet event listners attached to that one connection.
 */
const fastifyPlugin: FastifyPluginCallback<
  TOptions,
  RawServerDefault,
  FastifyTypeProvider,
  FastifyBaseLogger
> = (fastifyInstance, opts, done) => {
  const server = fastifyInstance.withTypeProvider<JsonSchemaToTsProvider>();

  // This might be a problem if imported multiple times?

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

    async handler(request, reply) {
      const channel = request.params.channel;
      const lastEventId: number | undefined = request.headers["last-event-id"];
      const didRegisterToChannel = opts?.didRegisterToChannel ?? (() => null);
      const canRegisterToChannel = opts?.canRegisterToChannel ?? (() => true);

      if (await canRegisterToChannel(request, channel)) {
        const missedMessages = messageHistory.messageHistoryForChannel(
          channel,
          lastEventId,
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
        });

        /**
         * This needs to be called after the response is made.  Placing it after
         * reply.sse(), however, makes it inaccessible.
         *
         * We use a `setTimeout` to get around that.
         */

        setTimeout(() => didRegisterToChannel(channel));

        reply.sse(
          (async function* () {
            // yield all missed messages based on lastEventId
            for (const missedMessage of missedMessages) {
              yield missedMessage;
            }

            // nodejs.org/api/events.html#eventsonemitter-eventname-options

            try {
              for await (
                const events of on(eventEmitter, channel, {
                  signal: abortController.signal,
                })
              ) {
                for (let event of events) {
                  yield event;
                }
              }
            } catch {
              // console.log("boooooo");
            }
          })(),
        );
      } else {
        return reply.code(400).send({ error: "Bad Request" });
      }
    },
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
const sendSSEMessage = <
  EMap extends Record<string, any>,
  T extends keyof EMap & string,
>(
  channel: string,
  eventName: T,
  payload: EMap[T],
) => {
  // create a message
  const message: TMessage = {
    event: eventName,
    data: JSON.stringify(payload),
    id: messageHistory.nextId(),
  };

  // push it onto the history stack
  messageHistory.push(channel, message);

  // fire it off
  eventEmitter.emit(channel, message);

  return message;
};

const getConnectionCount = (channel: string) =>
  channelManager.getConnectionCount(channel);

export { fastifyPlugin, getConnectionCount, sendSSEMessage };
