var fs = require('fs')
var path = require('path')
var moment = require('moment')
var color = require('cli-color')
var log = require('../log')
var cleanup = require('../cleanup')
var bapConfig = require('../bapConfig')
var gitMeta = require('../gitMeta')
var ls = require('../ls')
var sh = require('../sh')
var s3 = require('../s3')

module.exports = function * (options) {
  // Extract some meta
  var { branch, commit } = yield gitMeta(options.asBranch)

  var isReleaseBranch = bapConfig.releaseBranches.indexOf(branch) > -1

  // Perform all s3 fs operations relative to the current branch
  var branchDir = path.join(bapConfig.uploadTo, branch)
  var s3branch = s3.clone(branchDir)

  var releaseName = moment.utc().format('YYYY-MM-DDTHHmmss') + '-' + commit.substr(0, 6)

  // Build
  if (bapConfig.build) {
    log('Building with', color.cyanBright(bapConfig.build))
    sh(bapConfig.build, {
      inherit: true,
      env: {
        BAP_RELEASE_NAME: releaseName
      }
    })
  }

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
  }

  // Cleanup old releases and uploads
  yield cleanup(s3branch, 'uploads', isReleaseBranch ? bapConfig.keepUploads : 1)
  yield cleanup(s3branch, 'releases', isReleaseBranch ? bapConfig.keepReleases : 1)

  if (bapConfig.clean) {
    log('Cleaning with', color.cyanBright(bapConfig.clean))
    sh(bapConfig.clean, true)
  }

  return releaseName
}
