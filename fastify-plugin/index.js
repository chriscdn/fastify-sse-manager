const { on, EventEmitter } = require('events')
const { FastifySSEPlugin } = require('fastify-sse-v2')
const eventEmitter = new EventEmitter()

// https://seg.phault.net/blog/2018/03/async-iterators-cancellation/
module.exports = (fastify, opts, done) => {
  // This might be a problem if imported multiple times?
  fastify.register(FastifySSEPlugin)

  fastify.get('/:channel', {
    schema: {
      ...(opts.schema || {}),
      params: {
        channel: {
          type: 'string',
        },
      },
      required: 'channel',
    },
    preHandler: opts.preHandler || [],
    // don't make this async.. see logs if you do
    handler(req, res) {
      const channel = req.params.channel
      const aIter = on(eventEmitter, channel)
      res.sse(
        (async function* () {
          // https://nodejs.org/api/events.html#eventsonemitter-eventname-options
          for await (const events of aIter) {
            for (let event of events) {
              yield event
            }
          }
        })()
      )

      // here we want to somehow broadcast or notify that a connection was made
      if (typeof opts?.didRegisterToChannel == 'function') {
        opts.didRegisterToChannel(channel)
      }

      req.raw.on('close', () => aIter.return())
    },
  })

  done()
}

// order matters here
module.exports.sendSSEMessage = (channelName, eventName, data = {}) => {
  eventEmitter.emit(channelName, {
    event: eventName,
    data: JSON.stringify(data),
  })
}
