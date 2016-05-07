var path = require('path')
var co = require('creed').coroutine
var color = require('cli-color')
var gitMeta = require('../gitMeta')
var bapConfig = require('../bapConfig')
var list = require('./list')
var s3 = require('../s3')
var log = require('../log')

module.exports = function * (releaseName, options) {
  var { branch } = yield gitMeta(options.asBranch)

  var branchDir = path.join(bapConfig.uploadTo, branch)
  var s3branch = s3.clone(branchDir)

  var releases = yield s3branch.readdir('releases')
  releases = releases.sort()

  if (!releaseName) {
    var current = yield s3branch.readFile('current')
    if (!current) return log.error('Could not find the current pointer')
    current = current.Body.toString()
    var currentIndex = releases.indexOf(current)
    if (options.forward) {
      if (currentIndex >= releases.length - 1) log.warn('There is no release to roll forward to')
      releaseName = releases[currentIndex + 1]
    } else {
      if (currentIndex < 1) log.warn('There is no release to rollback to')
      releaseName = releases[currentIndex - 1]
    }
  } else {
    if (releases.indexOf(releaseName) === -1) return log.error('Invalid release name -', releaseName)
  }

  if (releaseName) {
    log('Updating the current pointer of branch', color.blue(branch), 'to', color.blue(releaseName))
    yield s3branch.writeFile('current', releaseName)
  }

  yield co(list)(branch, options)
}
