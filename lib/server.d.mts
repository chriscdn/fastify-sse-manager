import { FastifyBaseLogger, FastifyPluginCallback, FastifyPluginOptions, FastifyRequest, FastifyTypeProvider, RawServerDefault } from "fastify";
//#region src/utils/server-utils.d.ts
type Message = {
  event: string;
  data: string;
  id: number;
};
//#endregion
//#region src/server.d.ts
type Options = FastifyPluginOptions & {
  schema?: Record<string, any>;
  preHandler?: any;
  didRegisterToChannel?: (channel: string) => void;
  didUnregisterFromChannel?: (channel: string) => void;
  canRegisterToChannel?: (request: FastifyRequest, channel: string) => Promise<boolean> | boolean;
};
/**
 * A downside to this implementation is that `/route/a/<channel>` and
 * `/route/b/<channel>` receive the same events when `<channel>` are the same.
 *
 * The best usage of this is to have a single connection per client, and
 * differnet event listners attached to that one connection.
 */
declare const fastifyPlugin: FastifyPluginCallback<Options, RawServerDefault, FastifyTypeProvider, FastifyBaseLogger>;
/**
 * I struggled to make the eventName define the payload, but seems I need to
 * explicity set it.
 *
 * @param channel
 * @param eventName
 * @param payload
 * @returns
 */
declare const sendSSEMessage: <EMap extends Record<string, any>, T extends keyof EMap & string>(channel: string, eventName: T, payload: EMap[T]) => Message;
declare const getConnectionCount: (channel: string) => number;
declare const getActiveChannels: () => MapIterator<string>;
//#endregion
export { fastifyPlugin, getActiveChannels, getConnectionCount, sendSSEMessage };
//# sourceMappingURL=server.d.mts.map