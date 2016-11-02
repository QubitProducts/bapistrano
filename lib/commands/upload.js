const fs = require('fs')
const path = require('path')
const moment = require('moment')
const color = require('cli-color')
const runNode = require('creed').runNode
const gzip = require('zlib').gzip
const ora = require('ora')
const mime = require('mime')
const isPrivate = require('../isPrivate')
const lifecycle = require('../lifecycle')
const log = require('../log')
const cleanupReleases = require('../cleanupReleases')
const releaseIdPrefix = require('../releaseIdPrefix')
const gitMeta = require('../gitMeta')
const ls = require('../ls')
const s3 = require('../s3')
const seq = require('../seq')

module.exports = async function upload (options, bapConfig) {
  // Extract some meta
  const meta = await gitMeta(options.asBranch)
  const branch = meta.branch
  const commit = meta.commit

  const isReleaseBranch = bapConfig.releaseBranches.indexOf(branch) > -1

  // Perform all s3 fs operations relative to the current branch
  const branchDir = path.join(bapConfig.uploadTo, branch)
  const s3branch = s3(bapConfig).clone(branchDir)

  const releaseId = moment.utc().format(releaseIdPrefix) + '-' + commit.substr(0, 7)

  await lifecycle.build(branch, releaseId, bapConfig)

  const uploadType = isReleaseBranch ? 'uploads' : 'releases'
  const uploadDir = path.join(uploadType, releaseId)

  log('Uploading', color.cyanBright(bapConfig.distDir), 'to', color.cyanBright(path.join(branchDir, uploadDir)))

  const distPrefix = path.resolve(bapConfig.distDir)
  const relative = (f) => {
    return path.join(uploadDir, f.replace(distPrefix, ''))
  }

  const distFiles = await ls(bapConfig.distDir)
  log('Uploading', color.cyanBright(distFiles.length), 'files')
  const spinner = ora('Uploading ☁').start()
  const write = fileWriter(bapConfig.distDir, bapConfig.private, s3branch, relative, spinner)
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
    const s3Options = {
      ContentEncoding: 'gzip',
      ContentType: mime.lookup(f)
    }

    if (!isPrivate(f, priv)) {
      s3Options.ACL = 'public-read'
    }

    const c = await runNode(fs.readFile, f)
    const g = await runNode(gzip, c)
    return await s3.writeFile(transformFilePath(f), g, s3Options)
  }
}
