const path = require('path')
const color = require('cli-color')
const list = require('./list')
const upload = require('./upload')
const log = require('../log')
const gitMeta = require('../gitMeta')
const cleanupReleases = require('../cleanupReleases')
const s3 = require('../s3')
const notify = require('../lifecycle').notify
const copyDir = require('../copyDir')

module.exports = async function (options, bapConfig) {
  let foundMatchingUpload = false

  const meta = await gitMeta(options.asBranch)
  const branch = meta.branch
  const commit = meta.commit

  const isReleaseBranch = bapConfig.releaseBranches.indexOf(branch) > -1

  // Perform all s3 fs operations relative to the current branch
  const branchDir = path.join(bapConfig.uploadTo, branch)
  const s3branch = s3(bapConfig).clone(branchDir)

  const shortCommit = commit.substr(0, 7)

  const dirs = await s3branch.readdir(path.join('uploads'))
  let releaseId = dirs.sort().reverse().find(u => u.indexOf('-' + shortCommit) > -1)

  if (releaseId) {
    let revision = await s3branch.tryReadingFile(path.join('uploads', releaseId, 'REVISION'))
    if (revision && revision.Body.toString()) {
      foundMatchingUpload = true
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
