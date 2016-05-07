var co = require('creed').coroutine
var path = require('path')
var color = require('cli-color')
var log = require('../log')
var bapConfig = require('../bapConfig')
var gitMeta = require('../gitMeta')
var cleanup = require('../cleanup')
var list = require('./list')
var s3 = require('../s3')
var upload = require('./upload')

module.exports = function * (options) {
  var foundMatchingUpload = false

  var { branch, commit } = yield gitMeta(options.asBranch)

  var isReleaseBranch = bapConfig.releaseBranches.indexOf(branch) > -1

  // Perform all s3 fs operations relative to the current branch
  var branchDir = path.join(bapConfig.uploadTo, branch)
  var s3branch = s3.clone(branchDir)

  var shortCommit = commit.substr(0, 6)

  var dirs = yield s3branch.readdir(path.join('uploads'))
  var releaseName = dirs.sort().reverse().find(u => u.indexOf('-' + shortCommit) > -1)

  if (releaseName) {
    var revision = yield co(tryReadFile)(s3branch, path.join('uploads', releaseName, 'REVISION'))
    if (revision) {
      revision = revision.Body.toString()
      if (revision === commit) {
        foundMatchingUpload = true
      }
    }
  }

  if (!foundMatchingUpload) {
    log('Commit', color.cyanBright(commit), 'is not uploaded under branch', color.cyanBright(branch), 'yet, uploading now')
    releaseName = yield co(upload)(Object.assign(options))
  } else {
    log('Commit', color.cyanBright(commit), 'is already uploaded under branch', color.cyanBright(branch))
  }

  // now that it's uploaded for sure, let's copy the upload to the release dir
  if (isReleaseBranch) {
    yield s3branch.copyDir(path.join('uploads', releaseName), path.join('releases', releaseName))
    log('Updating the current pointer of branch', color.cyanBright(branch), 'to', color.cyanBright(releaseName))
    yield s3branch.writeFile('current', releaseName)
    yield cleanup(s3branch, 'releases', bapConfig.keepUploads)
  }

  yield co(list)(branch, options)
}

function * tryReadFile (s3, file) {
  try {
    return yield s3.readFile(file)
  } catch (err) {
    if (err.code !== 'NoSuchKey') {
      throw err
    }
  }
}
