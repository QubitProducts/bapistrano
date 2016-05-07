var S3FS = require('s3fs')
var bapConfig = require('./bapConfig')

module.exports = new S3FS(bapConfig.bucket, { region: bapConfig.region })
