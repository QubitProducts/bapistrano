/**
 * We don't use s3.copyDir, because that removes all ACL
 * permissions when copying the objects. Instead, we map
 * over the uploaded files and use s3.copyFile with ACL
 * option.
 */

var co = require('creed').coroutine
var ora = require('ora')
var path = require('path')
var color = require('cli-color')
var log = require('./log')
var seq = require('./seq')
var isPrivate = require('./isPrivate')

module.exports = co(function * copyDir (s3branch, source, target, priv) {
  var files = yield s3branch.readdirp(source)

  log('Copying', color.cyanBright(files.length), 'files')
  var spinner = ora('Copying ☁').start()
  var copy = fileCopier(s3branch, source, target, priv, spinner)
  yield seq(files, copy)
  spinner.stop()
})

function fileCopier (s3, source, target, priv, spinner) {
  return co(function * copyFile (f, i, l) {
    spinner.text = (i + 1) + '/' + l.length + '  ☁  ' + color.cyanBright(f)
    var s3Options = {}
    if (!isPrivate(f, priv)) {
      s3Options.ACL = 'public-read'
    }
    return yield s3.copyFile(path.join(source, f), path.join(target, f), s3Options)
  })
}
