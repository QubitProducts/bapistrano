var fs = require('fs')
var path = require('path')
var moment = require('moment')
var color = require('cli-color')
var co = require('creed').coroutine
var { build, clean, notify } = require('../lifecycle')
var log = require('../log')
var cleanupReleases = require('../cleanupReleases')
var gitMeta = require('../gitMeta')
var ls = require('../ls')
var s3 = require('../s3')

module.exports = co(function * (options, bapConfig) {
  // Extract some meta
  var { branch, commit } = yield gitMeta(options.asBranch)

  var isReleaseBranch = bapConfig.releaseBranches.indexOf(branch) > -1

  // Perform all s3 fs operations relative to the current branch
  var branchDir = path.join(bapConfig.uploadTo, branch)
  var s3branch = s3(bapConfig).clone(branchDir)

  var releaseName = moment.utc().format(bapConfig.releaseNamePrefix) + '-' + commit.substr(0, 6)

  yield build(branch, releaseName, bapConfig)

  var uploadType = isReleaseBranch ? 'uploads' : 'releases'
  var uploadDir = path.join(uploadType, releaseName)

  log('Uploading', color.cyanBright(bapConfig.distDir), 'to', color.cyanBright(path.join(branchDir, uploadDir)))

  var distPrefix = path.resolve(bapConfig.distDir)
  var relative = (f) => path.join(uploadDir, f.replace(distPrefix, ''))

  var distFiles = yield ls(bapConfig.distDir)
  yield Promise.all(distFiles.map(f => s3branch.writeFile(relative(f), fs.createReadStream(f))))

  // Write out the RELEASE file
  yield s3branch.writeFile(path.join(uploadDir, 'REVISION'), commit)

  // Update the current file
  if (!isReleaseBranch) {
    log('Updating the current pointer of branch', color.cyanBright(branch), 'to', color.cyanBright(releaseName))
    yield s3branch.writeFile('current', releaseName)
    yield notify(branch, releaseName, bapConfig)
  }

  // Cleanup old releases and uploads
  yield cleanupReleases(s3branch, isReleaseBranch, bapConfig)

  yield clean(bapConfig)

  return releaseName
})
