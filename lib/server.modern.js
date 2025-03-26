import { EventEmitter, on } from 'events';
import FastifySSEPlugin from 'fastify-sse-v2';

function _OverloadYield(e, d) {
  this.v = e, this.k = d;
}
function _asyncIterator(r) {
  var n,
    t,
    o,
    e = 2;
  for ("undefined" != typeof Symbol && (t = Symbol.asyncIterator, o = Symbol.iterator); e--;) {
    if (t && null != (n = r[t])) return n.call(r);
    if (o && null != (n = r[o])) return new AsyncFromSyncIterator(n.call(r));
    t = "@@asyncIterator", o = "@@iterator";
  }
  throw new TypeError("Object is not async iterable");
}
function AsyncFromSyncIterator(r) {
  function AsyncFromSyncIteratorContinuation(r) {
    if (Object(r) !== r) return Promise.reject(new TypeError(r + " is not an object."));
    var n = r.done;
    return Promise.resolve(r.value).then(function (r) {
      return {
        value: r,
        done: n
      };
    });
  }
  return AsyncFromSyncIterator = function (r) {
    this.s = r, this.n = r.next;
  }, AsyncFromSyncIterator.prototype = {
    s: null,
    n: null,
    next: function () {
      return AsyncFromSyncIteratorContinuation(this.n.apply(this.s, arguments));
    },
    return: function (r) {
      var n = this.s.return;
      return void 0 === n ? Promise.resolve({
        value: r,
        done: !0
      }) : AsyncFromSyncIteratorContinuation(n.apply(this.s, arguments));
    },
    throw: function (r) {
      var n = this.s.return;
      return void 0 === n ? Promise.reject(r) : AsyncFromSyncIteratorContinuation(n.apply(this.s, arguments));
    }
  }, new AsyncFromSyncIterator(r);
}
function _awaitAsyncGenerator(e) {
  return new _OverloadYield(e, 0);
}
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}
function _wrapAsyncGenerator(e) {
  return function () {
    return new AsyncGenerator(e.apply(this, arguments));
  };
}
function AsyncGenerator(e) {
  var r, t;
  function resume(r, t) {
    try {
      var n = e[r](t),
        o = n.value,
        u = o instanceof _OverloadYield;
      Promise.resolve(u ? o.v : o).then(function (t) {
        if (u) {
          var i = "return" === r ? "return" : "next";
          if (!o.k || t.done) return resume(i, t);
          t = e[i](t).value;
        }
        settle(n.done ? "return" : "normal", t);
      }, function (e) {
        resume("throw", e);
      });
    } catch (e) {
      settle("throw", e);
    }
  }
  function settle(e, n) {
    switch (e) {
      case "return":
        r.resolve({
          value: n,
          done: !0
        });
        break;
      case "throw":
        r.reject(n);
        break;
      default:
        r.resolve({
          value: n,
          done: !1
        });
    }
    (r = r.next) ? resume(r.key, r.arg) : t = null;
  }
  this._invoke = function (e, n) {
    return new Promise(function (o, u) {
      var i = {
        key: e,
        arg: n,
        resolve: o,
        reject: u,
        next: null
      };
      t ? t = t.next = i : (r = t = i, resume(e, n));
    });
  }, "function" != typeof e.return && (this.return = void 0);
}
AsyncGenerator.prototype["function" == typeof Symbol && Symbol.asyncIterator || "@@asyncIterator"] = function () {
  return this;
}, AsyncGenerator.prototype.next = function (e) {
  return this._invoke("next", e);
}, AsyncGenerator.prototype.throw = function (e) {
  return this._invoke("throw", e);
}, AsyncGenerator.prototype.return = function (e) {
  return this._invoke("return", e);
};

const eventEmitter = new EventEmitter();
// https://seg.phault.net/blog/2018/03/async-iterators-cancellation/
const fastifyPlugin = (fastifyInstance, opts, done) => {
  var _opts$schema, _opts$preHandler;
  const server = fastifyInstance.withTypeProvider();
  // This might be a problem if imported multiple times?
  server.register(FastifySSEPlugin);
  server.get("/:channel", {
    schema: _extends({}, (_opts$schema = opts.schema) != null ? _opts$schema : {}, {
      params: {
        type: "object",
        properties: {
          channel: {
            type: "string"
          }
        },
        required: ["channel"]
      },
      headers: {
        type: "object",
        properties: {
          "last-event-id": {
            type: "integer"
          }
        }
      }
      // response: {
      //   200: {},
      // },
    }),
    preHandler: (_opts$preHandler = opts.preHandler) != null ? _opts$preHandler : [],
    async handler(request, reply) {
      var _opts$didRegisterToCh, _opts$canRegisterToCh;
      const channel = request.params.channel;
      const lastEventId = request.headers["last-event-id"];
      const didRegisterToChannel = (_opts$didRegisterToCh = opts == null ? void 0 : opts.didRegisterToChannel) != null ? _opts$didRegisterToCh : () => null;
      const canRegisterToChannel = (_opts$canRegisterToCh = opts == null ? void 0 : opts.canRegisterToChannel) != null ? _opts$canRegisterToCh : () => true;
      if (await canRegisterToChannel(request, channel)) {
        const missedMessages = messageHistory.messageHistoryForChannel(channel, lastEventId);
        const abortController = new AbortController();
        // https://github.com/NodeFactoryIo/fastify-sse-v2
        //
        // This doesn't get called when running Vue in dev mode.  Production is
        // fine.
        request.socket.on("close", () => {
          console.log("*************");
          console.log("SSE Request Closed");
          console.log("*************");
          abortController.abort();
        });
        /**
         * This needs to be called after the response is made.  Placing it after
         * reply.sse(), however, makes it inaccessible.
         *
         * We use a `setTimeout` to get around that.
         */
        setTimeout(() => didRegisterToChannel(channel));
        reply.sse(_wrapAsyncGenerator(function* () {
          // yield all missed messages based on lastEventId
          for (const missedMessage of missedMessages) {
            yield missedMessage;
          }
          // nodejs.org/api/events.html#eventsonemitter-eventname-options
          try {
            var _iteratorAbruptCompletion = false;
            var _didIteratorError = false;
            var _iteratorError;
            try {
              for (var _iterator = _asyncIterator(on(eventEmitter, channel, {
                  signal: abortController.signal
                })), _step; _iteratorAbruptCompletion = !(_step = yield _awaitAsyncGenerator(_iterator.next())).done; _iteratorAbruptCompletion = false) {
                const events = _step.value;
                {
                  for (let event of events) {
                    yield event;
                  }
                }
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (_iteratorAbruptCompletion && _iterator.return != null) {
                  yield _awaitAsyncGenerator(_iterator.return());
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }
          } catch (_unused) {
            // console.log("boooooo");
          }
        })());
      } else {
        return reply.code(400).send({
          error: "Bad Request"
        });
      }
    }
  });
  done();
};
class MessageHistory {
  constructor(messageHistory = [], lastId = 0) {
    this.messageHistory = void 0;
    this.lastId = void 0;
    this.messageHistory = messageHistory;
    this.lastId = lastId;
  }
  messageHistoryForChannel(channelName, lastEventId) {
    return lastEventId !== undefined ? this.messageHistory.filter(item => item.channelName === channelName).filter(item => item.id > lastEventId).map(item => item.message) : [];
  }
  push(channelName, message) {
    this.messageHistory.push({
      channelName,
      id: message.id,
      message
    });
    // keep last 1000 messages.. make configurable
    this.messageHistory = this.messageHistory.slice(-1000);
  }
  nextId() {
    this.lastId += 1;
    return this.lastId;
  }
}
const messageHistory = new MessageHistory();
// order matters here
const sendSSEMessage = (channelName, eventName, data = null) => {
  // create a message
  const message = {
    event: eventName,
    data: JSON.stringify(data),
    id: messageHistory.nextId()
  };
  // push it onto the history stack
  messageHistory.push(channelName, message);
  // fire it off
  eventEmitter.emit(channelName, message);
  return message;
};

export { fastifyPlugin, sendSSEMessage };
//# sourceMappingURL=server.modern.js.map
