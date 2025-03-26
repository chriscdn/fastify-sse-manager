import { type FastifyBaseLogger, type FastifyPluginCallback, type FastifyPluginOptions, type FastifyTypeProvider, type RawServerDefault } from "fastify";
type TOptions = FastifyPluginOptions & {
    schema?: Record<string, any>;
    preHandler?: any;
    didRegisterToChannel?: (channel: string) => void;
    canRegisterToChannel?: (channel: string) => Promise<boolean> | boolean;
};
declare const fastifyPlugin: FastifyPluginCallback<TOptions, RawServerDefault, FastifyTypeProvider, FastifyBaseLogger>;
type TMessage = {
    event: string;
    data: string;
    id: number;
};
declare const sendSSEMessage: <T = unknown>(channelName: string, eventName: string, data?: T) => TMessage;
export { fastifyPlugin, sendSSEMessage };
