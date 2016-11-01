var path = require('path')
var moment = require('moment')
var releaseIdPrefix = require('./releaseIdPrefix')

module.exports = async function getBranches (s3) {
  var branches = await s3.readdir('/')
  branches = branches.sort()

  var branchDescriptors = []

  for (var branch of branches) {
    var currentFile = await s3.tryReadingFile(path.join(branch, 'current'))

    // something's wrong with this branch
    if (!currentFile) continue

    var current = currentFile.Body.toString()
    var released = moment.utc(new Date(currentFile.LastModified)).toISOString()
    var uploaded = moment.utc(current.substring(0, releaseIdPrefix.length), releaseIdPrefix).toISOString()

    branchDescriptors.push({
      name: branch,
      current,
      released,
      uploaded
    })
  }

  return branchDescriptors
}
