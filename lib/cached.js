var co = require('creed').coroutine
var cloneDeep = require('lodash/cloneDeep')

var CACHE = {}
var SEPARATOR = ':'

module.exports = function cached (namespace, producer, timeout) {
  CACHE[namespace] = {}
  var cache = CACHE[namespace]

  return co(function * () {
    var args = Array.prototype.slice.call(arguments)
    var key = args.join(SEPARATOR)

    // not cached, fetch it
    if (!cache[key]) {
      cache[key] = {
        val: null,
        fetch: produce(),
        time: Date.now()
      }
    }

    // out of date, refetch in the background
    if (Date.now() - cache[key].time > timeout && !cache[key].fetch) {
      cache[key].fetch = produce()
    }

    function produce () {
      return producer.apply(null, args)
        .then(function (val) {
          // after producing the value, store it
          cache[key].val = val
          // and cleanup the fetch promise
          delete cache[key].fetch
          // update the time
          cache[key].time = Date.now()
          return cloneDeep(val)
        })
        .catch(function (err) {
          // in case of error, delete the cache
          // allow next request to retry
          delete cache[key]
          throw err
        })
    }

    return cloneDeep(cache[key].val) || cache[key].fetch
  })
}
