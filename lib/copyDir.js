/**
 * We don't use s3.copyDir, because that removes all ACL
 * permissions when copying the objects. Instead, we map
 * over the uploaded files and use s3.copyFile with ACL
 * option.
 */

const ora = require('ora')
const path = require('path')
const color = require('cli-color')
const log = require('./log')
const seq = require('./seq')
const isPrivate = require('./isPrivate')

module.exports = async function copyDir (s3branch, source, target, priv) {
  const files = await s3branch.readdirp(source)

  log('Copying', color.cyanBright(files.length), 'files')
  const spinner = ora('Copying ☁').start()
  const copy = fileCopier(s3branch, source, target, priv, spinner)
  await seq(files, copy)
  spinner.stop()
}

function fileCopier (s3, source, target, priv, spinner) {
  return async function copyFile (f, i, l) {
    spinner.text = (i + 1) + '/' + l.length + '  ☁  ' + color.cyanBright(f)
    const s3Options = {}
    if (!isPrivate(f, priv)) {
      s3Options.ACL = 'public-read'
    }
    return s3.copyFile(path.join(source, f), path.join(target, f), s3Options)
  }
}
