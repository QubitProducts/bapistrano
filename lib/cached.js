var cloneDeep = require('lodash/cloneDeep')

var CACHE = {}
var SEPARATOR = ':'

module.exports = function cached (namespace, producer, timeout) {
  CACHE[namespace] = {}
  var cache = CACHE[namespace]

  return async function () {
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
      cache[key].fetch = await produce()
    }

    async function produce () {
      try {
        var val = await producer.apply(null, args)
        // after producing the value, store it
        cache[key].val = val
        // and cleanup the fetch promise
        delete cache[key].fetch
        // update the time
        cache[key].time = Date.now()
      } catch (e) {
        delete cache[key]
        throw e
      }
    }

    return cloneDeep(cache[key].val) || cache[key].fetch
  }
}
