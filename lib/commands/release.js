var path = require('path')
var color = require('cli-color')
var list = require('./list')
var upload = require('./upload')
var log = require('../log')
var gitMeta = require('../gitMeta')
var cleanupReleases = require('../cleanupReleases')
var s3 = require('../s3')
var notify = require('../lifecycle').notify
var copyDir = require('../copyDir')

module.exports = async function (options, bapConfig) {
  var foundMatchingUpload = false

  var meta = await gitMeta(options.asBranch)
  var branch = meta.branch
  var commit = meta.commit

  var isReleaseBranch = bapConfig.releaseBranches.indexOf(branch) > -1

  // Perform all s3 fs operations relative to the current branch
  var branchDir = path.join(bapConfig.uploadTo, branch)
  var s3branch = s3(bapConfig).clone(branchDir)

  var shortCommit = commit.substr(0, 7)

  var dirs = await s3branch.readdir(path.join('uploads'))
  var releaseId = dirs.sort().reverse().find(u => u.indexOf('-' + shortCommit) > -1)

  if (releaseId) {
    var revision = await s3branch.tryReadingFile(path.join('uploads', releaseId, 'REVISION'))
    if (revision) {
      revision = revision.Body.toString()
      if (revision === commit) {
        foundMatchingUpload = true
      }
    }
  }

  if (!foundMatchingUpload) {
    log('Commit', color.cyanBright(commit), 'is not uploaded under branch', color.cyanBright(branch), 'yet, uploading now')
    releaseId = await upload(Object.assign(options), bapConfig)
  } else {
    log('Commit', color.cyanBright(commit), 'is already uploaded under branch', color.cyanBright(branch))
  }

  // now that it's uploaded for sure, let's copy the upload to the release dir
  if (isReleaseBranch) {
    await copyDir(s3branch, path.join('uploads', releaseId), path.join('releases', releaseId), bapConfig.private)
    log('Updating the current pointer of branch', color.cyanBright(branch), 'to', color.cyanBright(releaseId))
    await s3branch.writeFile('current', releaseId)
    await notify(branch, releaseId, bapConfig)
  }

  await cleanupReleases(s3branch, isReleaseBranch, bapConfig)

  await list(branch, options, bapConfig)
}
