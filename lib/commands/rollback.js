var path = require('path')
var co = require('creed').coroutine
var color = require('cli-color')
var gitMeta = require('../gitMeta')
var list = require('./list')
var s3 = require('../s3')
var log = require('../log')

module.exports = co(function * (releaseId, options, bapConfig) {
  var meta = yield gitMeta(options.asBranch)
  var branch = meta.branch

  var branchDir = path.join(bapConfig.uploadTo, branch)
  var s3branch = s3(bapConfig).clone(branchDir)

  var releases = yield s3branch.readdir('releases')
  releases = releases.sort()

  if (!releaseId) {
    var current = yield s3branch.readFile('current')
    if (!current) return log.error('Could not find the current pointer')
    current = current.Body.toString()
    var currentIndex = releases.indexOf(current)
    if (options.forward) {
      if (currentIndex >= releases.length - 1) log.warn('There is no release to roll forward to')
      releaseId = releases[currentIndex + 1]
    } else {
      if (currentIndex < 1) log.warn('There is no release to rollback to')
      releaseId = releases[currentIndex - 1]
    }
  } else {
    if (releases.indexOf(releaseId) === -1) return log.error('Invalid release name -', releaseId)
  }

  if (releaseId) {
    log('Updating the current pointer of branch', color.blue(branch), 'to', color.blue(releaseId))
    yield s3branch.writeFile('current', releaseId)
  }

  yield list(branch, options, bapConfig)
})
