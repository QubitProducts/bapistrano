const path = require('path')
const color = require('cli-color')
const log = require('./log')

const cleanupOneType = async function cleanup (s3branch, uploadType, keepAmount) {
  if (keepAmount > 0) {
    const dirs = await s3branch.readdir(uploadType)
    if (dirs.length > keepAmount) {
      const releasesToRemove = dirs.sort().slice(0, dirs.length - keepAmount)
      log('Removing old', uploadType, color.cyanBright(releasesToRemove.map(r => r.slice(0, -1)).join(', ')))
      await Promise.all(releasesToRemove.map(r => s3branch.rmdirp(path.join(uploadType, r))))
    }
  }
}

module.exports = async function cleanupReleases (s3branch, isReleaseBranch, bapConfig) {
  await cleanupOneType(s3branch, 'uploads', isReleaseBranch ? bapConfig.keepUploads : 1)
  await cleanupOneType(s3branch, 'releases', isReleaseBranch ? bapConfig.keepReleases : 1)
}
