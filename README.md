# @chriscdn/fastify-sse-manager

An experimental client and wrapper around [fastify-sse-v2](https://github.com/nodefactoryio/fastify-sse-v2) for sending Server-Sent Events with fastify.

## Usage - Server

```js
fastify.register(require('@chriscdn/fastify-sse-manager'), {
  prefix: '/sse',
})
```

## Usage - Client

### UMD Build

Include the client library `<script src="/lib/client.umd.js"></script>`.

```js
const Client = window.SSEClient
const channel = new Client('/sse', 'cbc')

channel.addEventListener('breaking-news', (event) => {
  console.log(event.data)
})

// ...

channel.removeEventListener('breaking-news')
```

## ES6

```js
import Client from '@chriscdn/fastify-sse-manager/client'

// the rest is the same as above
```
