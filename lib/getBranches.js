var path = require('path')
var co = require('creed').coroutine
var releaseIdPrefix = require('./releaseIdPrefix')
var getUTCDate = require('./getUTCDate')

module.exports = co(function * getBranches (s3) {
  var branches = yield s3.readdir('/')
  branches = branches.sort()

  var branchDescriptors = []

  for (var branch of branches) {
    var currentFile = yield s3.tryReadingFile(path.join(branch, 'current'))

    // something's wrong with this branch
    if (!currentFile) continue

    var current = currentFile.Body.toString()
    var released = getUTCDate(currentFile.LastModified).toISOString()
    var uploaded = getUTCDate(current.substring(0, releaseIdPrefix.length)).toISOString()

    branchDescriptors.push({
      name: branch,
      current,
      released,
      uploaded
    })
  }

  return branchDescriptors
})
