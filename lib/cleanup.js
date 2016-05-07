var path = require('path')
var color = require('cli-color')
var co = require('creed').coroutine
var log = require('./log')

module.exports = co(function * cleanup (s3branch, uploadType, keepAmount) {
  if (keepAmount > 0) {
    var dirs = yield s3branch.readdir(uploadType)
    if (dirs.length > keepAmount) {
      var releasesToRemove = dirs.sort().slice(0, dirs.length - keepAmount)
      log('Removing old', uploadType, color.cyanBright(releasesToRemove.map(r => r.slice(0, -1)).join(', ')))
      yield Promise.all(releasesToRemove.map(r => s3branch.rmdirp(path.join(uploadType, r))))
    }
  }
})
