const path = require('path')
const color = require('cli-color')
const moment = require('moment')
const s3 = require('../s3')
const releaseIdPrefix = require('../releaseIdPrefix')

module.exports = async function list (selectedBranch, options, bapConfig) {
  s3 = s3(bapConfig)

  const branches = await s3.readdir(bapConfig.uploadTo)
  branches = branches.sort()

  console.log('')
  for (const branch of branches) {
    if (selectedBranch && selectedBranch !== branch) continue

    const releases = await s3.readdir(path.join(bapConfig.uploadTo, branch, 'releases'))
    const numberOfReleases = releases.length
    const trimmedReleases = releases.sort().reverse().slice(0, options.limit)
    const current = await s3.readFile(path.join(bapConfig.uploadTo, branch, 'current'))
    let currentUpdatedAt

    if (current) {
      currentUpdatedAt = moment(new Date(current.LastModified)).utc()
      current = current.Body.toString()
    }

    console.log('[' + color.bold(branch) + ']')
    console.log('')
    for (const release of trimmedReleases) {
      const uploadedAgo = moment.utc(release.substring(0, releaseIdPrefix.length), releaseIdPrefix).fromNow()
      const isCurrent = release === current
      const star = isCurrent ? ' ' + (color.bold('*') + '   ') : '     '
      const releasedAgo = isCurrent ? color.blackBright('Released', currentUpdatedAt.fromNow()) : ''
      console.log(' ',
        release,
        star,
        color.blackBright('Uploaded', uploadedAgo + (isCurrent ? ',' : '')),
        color.blackBright(releasedAgo))
    }
    if (numberOfReleases > options.limit) {
      console.log('  ...', '(' + String(numberOfReleases - options.limit), 'more)')
    }

    console.log('')
  }
}
