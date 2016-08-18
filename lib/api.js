/**
  * The programmatic bapistrano API.
  *
  * Currently, it does not support all the same commands as CLI,
  * instead it offers require('bapistrano').meta(options) service.
  *
  * Meta service is useful when embedding bapistrano
  * deployed assets to your html. It can be used to retrieve
  * the current release name for a given upload path and a branch
  * as well as a list of available branches for a given upload path.
*/

var createS3 = require('./s3')
var defaults = require('../lib/defaults')
var getCurrent = require('./getCurrent')
var getBranches = require('./getBranches')
var cached = require('./cached')

module.exports.meta = function createBap (options) {
  options = Object.assign({
    bucket: defaults.bucket,
    region: defaults.region,
    accessKeyId: undefined,
    secretAccessKey: undefined,
    cache: 30 * 1000
  }, options)

  var s3 = createS3(options)

  return {
    getCurrent: cached('current', function (path, branch) {
      return getCurrent(s3.clone(path), branch, options)
    }, options.cache),
    getBranches: cached('branches', function (path) {
      return getBranches(s3.clone(path))
    }, options.cache)
  }
}
