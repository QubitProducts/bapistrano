var path = require('path')
var color = require('cli-color')
var moment = require('moment')
var bapConfig = require('../bapConfig')
var s3 = require('../s3')

var format = 'YYYY-MM-DDTHHmmss'

module.exports = function * (options) {
  var branches = yield s3.readdir(bapConfig.uploadTo)
  branches = branches.sort()
  var strip = (dir) => dir.slice(0, -1)

  console.log('')
  for (let branch of branches) {
    var releases = yield s3.readdir(path.join(bapConfig.uploadTo, branch, 'releases'))
    var current = (yield s3.readFile(path.join(bapConfig.uploadTo, branch, 'current')))
    var currentUpdatedAt

    if (current) {
      currentUpdatedAt = moment(new Date(current.LastModified)).utc()
      current = current.Body.toString()
    }

    var updatedAgo = current ? color.blackBright('Updated ' + currentUpdatedAt.fromNow()) : ''
    console.log('[' + color.bold(strip(branch)) + ']', updatedAgo)
    console.log('')
    for (let release of releases) {
      release = strip(release)
      var ago = moment.utc(release.substring(0, format.length), format).fromNow()
      var star = release === current ? ' ' + (color.bold('*') + '   ') : '     '
      console.log(' ', release, star, color.blackBright(ago))
    }

    console.log('')
  }
}
