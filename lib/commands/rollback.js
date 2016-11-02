const path = require('path')
const color = require('cli-color')
const gitMeta = require('../gitMeta')
const list = require('./list')
const s3 = require('../s3')
const log = require('../log')

module.exports = async function (releaseId, options, bapConfig) {
  const meta = await gitMeta(options.asBranch)
  const branch = meta.branch

  const branchDir = path.join(bapConfig.uploadTo, branch)
  const s3branch = s3(bapConfig).clone(branchDir)

  const releases = (await s3branch.readdir('releases')).sort()

  if (!releaseId) {
    let current = await s3branch.readFile('current')
    if (!current) return log.error('Could not find the current pointer')
    current = current.Body.toString()
    const currentIndex = releases.indexOf(current)
    if (options.forward) {
      if (currentIndex >= releases.length - 1) log.warn('There is no release to roll forward to')
      releaseId = releases[currentIndex + 1]
    } else {
      if (currentIndex < 1) log.warn('There is no release to rollback to')
      releaseId = releases[currentIndex - 1]
    }
  } else {
    if (releases.indexOf(releaseId) === -1) return log.error('Invalid release name -', releaseId)
  }

  if (releaseId) {
    log('Updating the current pointer of branch', color.blue(branch), 'to', color.blue(releaseId))
    await s3branch.writeFile('current', releaseId)
  }

  await list(branch, options, bapConfig)
}
