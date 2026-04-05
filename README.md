# @chriscdn/fastify-sse-manager

An experimental client and wrapper around [fastify-sse-v2](https://github.com/nodefactoryio/fastify-sse-v2) for sending Server-Sent Events with fastify.

## Usage - Server

```ts
fastify.register(require("@chriscdn/fastify-sse-manager"), {
  prefix: "/sse",
});
```

## Usage - Client

```ts
import { Client } from "@chriscdn/fastify-sse-manager/client";
```
