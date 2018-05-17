var path = require('path')
var color = require('cli-color')
var co = require('creed').coroutine
var s3 = require('../s3')
var getUTCDate = require('../getUTCDate')
var releaseIdPrefix = require('../releaseIdPrefix')
var distanceInWordsToNow = require('date-fns/distance_in_words_to_now')

module.exports = co(function * (selectedBranch, options, bapConfig) {
  s3 = s3(bapConfig)

  var branches = yield s3.readdir(bapConfig.uploadTo)
  branches = branches.sort()

  console.log('')
  for (var branch of branches) {
    if (selectedBranch && selectedBranch !== branch) continue

    var releases = yield s3.readdir(path.join(bapConfig.uploadTo, branch, 'releases'))
    var numberOfReleases = releases.length
    releases = releases.sort().reverse().slice(0, options.limit)
    var current = (yield s3.readFile(path.join(bapConfig.uploadTo, branch, 'current')))
    var currentUpdatedAt

    if (current) {
      currentUpdatedAt = getUTCDate(current.LastModified)
      current = current.Body.toString()
    }

    console.log('[' + color.bold(branch) + ']')
    console.log('')
    for (var release of releases) {
      var uploadedAgo = distanceInWordsToNow(getUTCDate(release.substring(0, releaseIdPrefix.length))) + ' ago'
      var isCurrent = release === current
      var star = isCurrent ? ' ' + (color.bold('*') + '   ') : '     '
      var releasedAgo = isCurrent ? color.blackBright('Released', currentUpdatedAt.fromNow()) : ''
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
})
