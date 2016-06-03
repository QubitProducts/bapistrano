var S3FS = require('s3fs')
var co = require('creed').coroutine

// patch readdir to strip trailing slashes,
// otherwise it causes a lot of confusion
var originalReaddir = S3FS.prototype.readdir
var map = (fn) => x => x.map(fn)
var stripTrailingSlash = x => x.replace(/\/$/, '')
S3FS.prototype.readdir = function () {
  return originalReaddir.apply(this, arguments).then(map(stripTrailingSlash))
}

// extend S3FS with a function that attempts reading the file, but
// handles not found case without throwing
S3FS.prototype.tryReadingFile = co(function * tryReadFile (path) {
  try {
    return yield this.readFile(path)
  } catch (err) {
    if (err.code !== 'NoSuchKey') {
      throw err
    }
  }
})

module.exports = function (bapConfig) {
  return new S3FS(bapConfig.bucket, { region: bapConfig.region })
}
