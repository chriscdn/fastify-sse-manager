"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSSEMessage = exports.fastifyPlugin = exports.Client = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "Client", { enumerable: true, get: function () { return client_1.Client; } });
var fastify_plugin_1 = require("./fastify-plugin");
Object.defineProperty(exports, "fastifyPlugin", { enumerable: true, get: function () { return fastify_plugin_1.fastifyPlugin; } });
Object.defineProperty(exports, "sendSSEMessage", { enumerable: true, get: function () { return fastify_plugin_1.sendSSEMessage; } });
//# sourceMappingURL=index.js.map