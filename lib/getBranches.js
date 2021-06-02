var path = require('path')
var pLimit = require('p-limit')
var moment = require('moment')
var releaseIdPrefix = require('./releaseIdPrefix')

var limit = pLimit(10)

module.exports = async function getBranches (s3) {
  var branches = await s3.readdir('/')
  branches = branches.sort()

  var branchesMeta = branches.map(
    branch => limit(() => getBranchMeta(branch, s3))
  )

  var branchDescriptors = await Promise.all(branchesMeta)
  return branchDescriptors.filter(Boolean)
}

async function getBranchMeta (branch, s3) {
  var currentFile = await s3.tryReadingFile(path.join(branch, 'current'))

  // something's wrong with this branch
  if (!currentFile) return null

  var current = currentFile.Body.toString()
  var released = moment.utc(new Date(currentFile.LastModified)).toISOString()
  var uploaded = moment.utc(current.substring(0, releaseIdPrefix.length), releaseIdPrefix).toISOString()

  return {
    name: branch,
    current,
    released,
    uploaded
  }
}
