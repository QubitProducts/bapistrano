const path = require('path')
const moment = require('moment')
const releaseIdPrefix = require('./releaseIdPrefix')

module.exports = async function getBranches (s3) {
  const branches = (await s3.readdir('/')).sort()

  const branchDescriptors = []

  for (const branch of branches) {
    const currentFile = await s3.tryReadingFile(path.join(branch, 'current'))

    // something's wrong with this branch
    if (!currentFile) continue

    const current = currentFile.Body.toString()
    const released = moment.utc(new Date(currentFile.LastModified)).toISOString()
    const uploaded = moment.utc(current.substring(0, releaseIdPrefix.length), releaseIdPrefix).toISOString()

    branchDescriptors.push({
      name: branch,
      current,
      released,
      uploaded
    })
  }

  return branchDescriptors
}
