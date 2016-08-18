var co = require('creed').coroutine

module.exports = co(function * getCurrent (s3, branch) {
  var current = yield s3.tryReadingFile(`/${branch}/current`)
  return current ? current.Body.toString() : null
})
