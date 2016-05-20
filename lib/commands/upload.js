var fs = require('fs')
var path = require('path')
var moment = require('moment')
var color = require('cli-color')
var co = require('creed').coroutine
var runNode = require('creed').runNode
var gzip = require('zlib').gzip
var ora = require('ora')
var mime = require('mime')
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
  log('Uploading', color.cyanBright(distFiles.length), 'files')
  var spinner = ora('Uploading ☁').start()
  var write = fileWriter(bapConfig.distDir, s3branch, relative, spinner)
  yield distFiles.reduce((m, f, i, l) => m.then(write(f, i, l.length)), Promise.resolve())
  spinner.stop()

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

function fileWriter (distDir, s3, transformFilePath, spinner) {
  return function writeFile (f, i, n) {
    return co(function * () {
      spinner.text = (i + 1) + '/' + n + '  ☁  ' + color.cyanBright(path.relative(distDir, f))
      var s3Options = {
        ContentEncoding: 'gzip',
        ContentType: mime.lookup(f)
      }
      var c = yield runNode(fs.readFile, f)
      var g = yield runNode(gzip, c)
      return yield s3.writeFile(transformFilePath(f), g, s3Options)
    })
  }
}
