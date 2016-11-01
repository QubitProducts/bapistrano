var fs = require('fs')
var path = require('path')
var moment = require('moment')
var color = require('cli-color')
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

module.exports = async function (options, bapConfig) {
  // Extract some meta
  var meta = await gitMeta(options.asBranch)
  var branch = meta.branch
  var commit = meta.commit

  var isReleaseBranch = bapConfig.releaseBranches.indexOf(branch) > -1

  // Perform all s3 fs operations relative to the current branch
  var branchDir = path.join(bapConfig.uploadTo, branch)
  var s3branch = s3(bapConfig).clone(branchDir)

  var releaseId = moment.utc().format(releaseIdPrefix) + '-' + commit.substr(0, 7)

  await lifecycle.build(branch, releaseId, bapConfig)

  var uploadType = isReleaseBranch ? 'uploads' : 'releases'
  var uploadDir = path.join(uploadType, releaseId)

  log('Uploading', color.cyanBright(bapConfig.distDir), 'to', color.cyanBright(path.join(branchDir, uploadDir)))

  var distPrefix = path.resolve(bapConfig.distDir)
  var relative = function (f) {
    return path.join(uploadDir, f.replace(distPrefix, ''))
  }

  var distFiles = await ls(bapConfig.distDir)
  log('Uploading', color.cyanBright(distFiles.length), 'files')
  var spinner = ora('Uploading ☁').start()
  var write = fileWriter(bapConfig.distDir, bapConfig.private, s3branch, relative, spinner)
  await seq(distFiles, write)
  spinner.stop()

  // Write out the RELEASE file
  await s3branch.writeFile(path.join(uploadDir, 'REVISION'), commit)

  // Update the current file
  if (!isReleaseBranch) {
    log('Updating the current pointer of branch', color.cyanBright(branch), 'to', color.cyanBright(releaseId))
    await s3branch.writeFile('current', releaseId)
    await lifecycle.notify(branch, releaseId, bapConfig)
  }

  // Cleanup old releases and uploads
  await cleanupReleases(s3branch, isReleaseBranch, bapConfig)

  await lifecycle.clean(bapConfig)

  return releaseId
}

function fileWriter (distDir, priv, s3, transformFilePath, spinner) {
  return async function writeFile (f, i, l) {
    spinner.text = (i + 1) + '/' + l.length + '  ☁  ' + color.cyanBright(path.relative(distDir, f))
    var s3Options = {
      ContentEncoding: 'gzip',
      ContentType: mime.lookup(f)
    }

    if (!isPrivate(f, priv)) {
      s3Options.ACL = 'public-read'
    }

    var c = await runNode(fs.readFile, f)
    var g = await runNode(gzip, c)
    return await s3.writeFile(transformFilePath(f), g, s3Options)
  }
}
