var S3FS = require('s3fs')
var bapConfig = require('./bapConfig')

var s3 = new S3FS(bapConfig.bucket, { region: bapConfig.region })

// patch readdir to strip trailing slashes,
// otherwise it causes a lot of confusion
var originalReaddir = S3FS.prototype.readdir
var map = (fn) => x => x.map(fn)
var stripTrailingSlash = x => x.replace(/\/$/, '')
S3FS.prototype.readdir = function (...args) {
  return originalReaddir.apply(this, args).then(map(stripTrailingSlash))
}

module.exports = s3
