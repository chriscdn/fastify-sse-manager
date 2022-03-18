const Fastify = require('fastify')
const port = 5700

const fastify = Fastify({
  logger: true,
})

const path = require('path')
// const sse = require('../express/')

const sseManager = require('../fastify/manager')

const { sendSSEMessage } = require('../fastify/routes')

// setInterval(() => {
//   sendSSEMessage('cbc', 'breaking-news', { hello: 'world' })
// }, 3000)

fastify.register(require('../fastify/routes'), { prefix: 'sse' })

fastify.register(require('fastify-static'), {
  root: path.resolve(__dirname, '../lib/'),
  prefix: '/lib/',
  decorateReply: false,
})

fastify.register(require('fastify-static'), {
  root: path.resolve(__dirname, 'public/'),
  decorateReply: false,
})

// app.use('/lib', express.static(path.resolve(__dirname, '../lib/')))

// app.use('/sse', sse.routes())

// setInterval(() => {
//   sseManager.broadcast('cbc', 'breaking-news', { name: 'bob' })
// }, 3000)

const start = async () => {
  try {
    // https://www.fastify.io/docs/latest/Reference/Server/#after
    // all plugins are loaded, let's go...
    await fastify.after()

    await fastify.listen(port)

    console.log(`Listening on ${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
