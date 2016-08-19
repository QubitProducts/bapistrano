var fs = require('fs')
var path = require('path')
var moment = require('moment')
var color = require('cli-color')
var co = require('creed').coroutine
var runNode = require('creed').runNode
var gzip = require('zlib').gzip
var ora = require('ora')
var mime = require('mime')
var isPrivate = require('../isPrivate')
var lifecycle = require('../lifecycle')
var log = require('../log')
var cleanupReleases = require('../cleanupReleases')
var releaseIdPrefix = require('../releaseIdPrefix')
var gitMeta = require('../gitMeta')
var ls = require('../ls')
var s3 = require('../s3')
var seq = require('../seq')

module.exports = co(function * (options, bapConfig) {
  // Extract some meta
  var meta = yield gitMeta(options.asBranch)
  var branch = meta.branch
  var commit = meta.commit

  var isReleaseBranch = bapConfig.releaseBranches.indexOf(branch) > -1

  // Perform all s3 fs operations relative to the current branch
  var branchDir = path.join(bapConfig.uploadTo, branch)
  var s3branch = s3(bapConfig).clone(branchDir)

  var releaseId = moment.utc().format(releaseIdPrefix) + '-' + commit.substr(0, 7)

  yield lifecycle.build(branch, releaseId, bapConfig)

  var uploadType = isReleaseBranch ? 'uploads' : 'releases'
  var uploadDir = path.join(uploadType, releaseId)

  log('Uploading', color.cyanBright(bapConfig.distDir), 'to', color.cyanBright(path.join(branchDir, uploadDir)))

  var distPrefix = path.resolve(bapConfig.distDir)
  var relative = function (f) {
    return path.join(uploadDir, f.replace(distPrefix, ''))
  }

  var distFiles = yield ls(bapConfig.distDir)
  log('Uploading', color.cyanBright(distFiles.length), 'files')
  var spinner = ora('Uploading ☁').start()
  var write = fileWriter(bapConfig.distDir, bapConfig.private, s3branch, relative, spinner)
  yield seq(distFiles, write)
  spinner.stop()

  // Write out the RELEASE file
  yield s3branch.writeFile(path.join(uploadDir, 'REVISION'), commit)

  // Update the current file
  if (!isReleaseBranch) {
    log('Updating the current pointer of branch', color.cyanBright(branch), 'to', color.cyanBright(releaseId))
    yield s3branch.writeFile('current', releaseId)
    yield lifecycle.notify(branch, releaseId, bapConfig)
  }

  // Cleanup old releases and uploads
  yield cleanupReleases(s3branch, isReleaseBranch, bapConfig)

  yield lifecycle.clean(bapConfig)

  return releaseId
})

function fileWriter (distDir, priv, s3, transformFilePath, spinner) {
  return co(function * writeFile (f, i, l) {
    spinner.text = (i + 1) + '/' + l.length + '  ☁  ' + color.cyanBright(path.relative(distDir, f))
    var s3Options = {
      ContentEncoding: 'gzip',
      ContentType: mime.lookup(f)
    }

    if (!isPrivate(f, priv)) {
      s3Options.ACL = 'public-read'
    }

    var c = yield runNode(fs.readFile, f)
    var g = yield runNode(gzip, c)
    return yield s3.writeFile(transformFilePath(f), g, s3Options)
  })
}
