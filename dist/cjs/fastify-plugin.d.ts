import type { FastifyPluginCallback, FastifyPluginOptions } from "fastify";
type TOptions = FastifyPluginOptions & {
    schema?: Record<string, any>;
    preHandler?: any;
    didRegisterToChannel?: (channel: string) => void;
};
declare const fastifyPlugin: FastifyPluginCallback<TOptions>;
declare function sendSSEMessage(channelName: string, eventName: string, data?: {}): void;
export { fastifyPlugin, sendSSEMessage };
