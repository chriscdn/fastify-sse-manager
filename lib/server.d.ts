import { type FastifyBaseLogger, type FastifyPluginCallback, type FastifyPluginOptions, FastifyRequest, type FastifyTypeProvider, type RawServerDefault } from "fastify";
type TOptions = FastifyPluginOptions & {
    schema?: Record<string, any>;
    preHandler?: any;
    didRegisterToChannel?: (channel: string) => void;
    canRegisterToChannel?: (request: FastifyRequest, channel: string) => Promise<boolean> | boolean;
};
declare const fastifyPlugin: FastifyPluginCallback<TOptions, RawServerDefault, FastifyTypeProvider, FastifyBaseLogger>;
type TMessage = {
    event: string;
    data: string;
    id: number;
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
declare const sendSSEMessage: <EMap extends Record<string, any>, T extends keyof EMap & string>(channel: string, eventName: T, payload: EMap[T]) => TMessage;
export { fastifyPlugin, sendSSEMessage };
