const S3FS = require('s3fs')

// patch readdir to strip trailing slashes,
// otherwise it causes a lot of confusion
const originalReaddir = S3FS.prototype.readdir
const map = (fn) => (x) => x.map(fn)
const stripTrailingSlash = (x) => x.replace(/\/$/, '')
S3FS.prototype.readdir = function () {
  return originalReaddir.apply(this, arguments).then(map(stripTrailingSlash))
}

// extend S3FS with a function that attempts reading the file, but
// handles not found case without throwing
S3FS.prototype.tryReadingFile = async function tryReadFile (path) {
  try {
    return await this.readFile(path)
  } catch (err) {
    if (err.code !== 'NoSuchKey') {
      throw err
    }
  }
}

module.exports = function (bapConfig) {
  return new S3FS(bapConfig.bucket, {
    region: bapConfig.region,
    accessKeyId: bapConfig.accessKeyId,
    secretAccessKey: bapConfig.secretAccessKey
  })
}
