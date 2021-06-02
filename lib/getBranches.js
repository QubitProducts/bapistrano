const path = require('path')
const pLimit = require('p-limit')
const moment = require('moment')
const releaseIdPrefix = require('./releaseIdPrefix')

const limit = pLimit(10)

module.exports = async function getBranches (s3) {
  const branches = await s3.readdir('/')
  branches.sort()

  const branchesMeta = branches.map(
    branch => limit(() => getBranchMeta(branch, s3))
  )

  const branchDescriptors = await Promise.all(branchesMeta)
  return branchDescriptors.filter(Boolean)
}

async function getBranchMeta (branch, s3) {
  const currentFile = await s3.tryReadingFile(path.join(branch, 'current'))

  // something's wrong with this branch
  if (!currentFile) return null

  const current = currentFile.Body.toString()
  const released = moment.utc(new Date(currentFile.LastModified)).toISOString()
  const uploaded = moment.utc(current.substring(0, releaseIdPrefix.length), releaseIdPrefix).toISOString()

  return {
    name: branch,
    current,
    released,
    uploaded
  }
}
