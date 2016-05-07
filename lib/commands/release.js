var co = require('creed').coroutine
var path = require('path')
var color = require('cli-color')
var log = require('../log')
var bapConfig = require('../bapConfig')
var gitMeta = require('../gitMeta')
var cleanup = require('../cleanup')
var s3 = require('../s3')
var upload = require('./upload')

module.exports = function * (options) {
  // check if the relevant commit is already uploaded by finding the latest
  // release dir for this branch and this commit and doublechecking that REVISION
  // file matches.

  var foundMatchingUpload = false

  var { branch, commit } = yield gitMeta(options.asBranch)

  var isReleaseBranch = bapConfig.releaseBranches.indexOf(branch) > -1

  // Perform all s3 fs operations relative to the current branch
  var branchDir = path.join(bapConfig.uploadTo, branch)
  var s3branch = s3.clone(branchDir)

  var shortCommit = commit.substr(0, 6)

  var dirs = yield s3branch.readdir(path.join('uploads'))
  var uploadName = dirs.sort().reverse().find(u => u.indexOf('-' + shortCommit) > -1)

  if (uploadName) {
    // TODO, handle missing revision file
    var revision = (yield s3branch.readFile(path.join('uploads', uploadName, 'REVISION'))).Body.toString()
    if (revision === commit) {
      foundMatchingUpload = true
    }
  }

  if (!foundMatchingUpload) {
    log('Commit', color.blue(commit), 'is not uploaded under branch', color.blue(branch), 'yet, uploading now')
    uploadName = yield co(upload)(Object.assign(options), { updateCurrent: true })
  } else {
    log('Commit', color.blue(commit), 'is already uploaded under branch', color.blue(branch))
  }

  // now that it's uploaded for sure, let's copy the upload to the release dir
  if (isReleaseBranch) {
    yield s3branch.copyDir(path.join('uploads', uploadName), path.join('releases', uploadName))
    log('Updating the current pointer of branch', color.blue(branch), 'to', color.blue(uploadName))
    yield s3branch.writeFile('current', commit)
    yield cleanup(s3branch, 'releases', bapConfig.keepUploads)
  }
}
