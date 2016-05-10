var color = require('cli-color')
var sh = require('./sh')
var log = require('./log')

module.exports.build = function (branch, releaseName, bapConfig) {
  if (bapConfig.build) {
    log('Building with', color.cyanBright(bapConfig.build))
    sh(bapConfig.build, {
      inherit: true,
      env: {
        NODE_ENV: 'production',
        BAP_RELEASE_BRANCH: branch,
        BAP_RELEASE_NAME: releaseName
      }
    })
  }
}

module.exports.clean = function (bapConfig) {
  if (bapConfig.clean) {
    log('Cleaning with', color.cyanBright(bapConfig.clean))
    sh(bapConfig.clean, { inherit: true })
  }
}

module.exports.notify = function (branch, releaseName, bapConfig) {
  if (bapConfig.notify) {
    log('Notifying with', color.cyanBright(bapConfig.notify))
    sh(bapConfig.notify, {
      inherit: true,
      env: {
        BAP_RELEASE_BRANCH: branch,
        BAP_RELEASE_NAME: releaseName
      }
    })
  }
}
