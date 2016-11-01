var path = require('path')
var color = require('cli-color')
var log = require('./log')

var cleanupOneType = async function cleanup (s3branch, uploadType, keepAmount) {
  if (keepAmount > 0) {
    var dirs = await s3branch.readdir(uploadType)
    if (dirs.length > keepAmount) {
      var releasesToRemove = dirs.sort().slice(0, dirs.length - keepAmount)
      log('Removing old', uploadType, color.cyanBright(releasesToRemove.map(r => r.slice(0, -1)).join(', ')))
      await Promise.all(releasesToRemove.map(r => s3branch.rmdirp(path.join(uploadType, r))))
    }
  }
}

module.exports = async function cleanupReleases (s3branch, isReleaseBranch, bapConfig) {
  await cleanupOneType(s3branch, 'uploads', isReleaseBranch ? bapConfig.keepUploads : 1)
  await cleanupOneType(s3branch, 'releases', isReleaseBranch ? bapConfig.keepReleases : 1)
}
