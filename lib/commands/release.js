var co = require('creed').coroutine
var path = require('path')
var color = require('cli-color')
var log = require('../log')
var gitMeta = require('../gitMeta')
var cleanupReleases = require('../cleanupReleases')
var list = require('./list')
var s3 = require('../s3')
var notify = require('../lifecycle').notify
var upload = require('./upload')

module.exports = co(function * (options, bapConfig) {
  var foundMatchingUpload = false

  var meta = yield gitMeta(options.asBranch)
  var branch = meta.branch
  var commit = meta.commit

  var isReleaseBranch = bapConfig.releaseBranches.indexOf(branch) > -1

  // Perform all s3 fs operations relative to the current branch
  var branchDir = path.join(bapConfig.uploadTo, branch)
  var s3branch = s3(bapConfig).clone(branchDir)

  var shortCommit = commit.substr(0, 6)

  var dirs = yield s3branch.readdir(path.join('uploads'))
  var releaseName = dirs.sort().reverse().find(u => u.indexOf('-' + shortCommit) > -1)

  if (releaseName) {
    var revision = yield s3branch.tryReadingFile(path.join('uploads', releaseName, 'REVISION'))
    if (revision) {
      revision = revision.Body.toString()
      if (revision === commit) {
        foundMatchingUpload = true
      }
    }
  }

  if (!foundMatchingUpload) {
    log('Commit', color.cyanBright(commit), 'is not uploaded under branch', color.cyanBright(branch), 'yet, uploading now')
    releaseName = yield upload(Object.assign(options), bapConfig)
  } else {
    log('Commit', color.cyanBright(commit), 'is already uploaded under branch', color.cyanBright(branch))
  }

  // now that it's uploaded for sure, let's copy the upload to the release dir
  if (isReleaseBranch) {
    yield s3branch.copyDir(path.join('uploads', releaseName), path.join('releases', releaseName))
    log('Updating the current pointer of branch', color.cyanBright(branch), 'to', color.cyanBright(releaseName))
    yield s3branch.writeFile('current', releaseName)
    yield notify(branch, releaseName, bapConfig)
  }

  yield cleanupReleases(s3branch, isReleaseBranch, bapConfig)

  yield list(branch, options, bapConfig)
})
