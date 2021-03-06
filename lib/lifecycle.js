var color = require('cli-color')
var sh = require('./sh')
var log = require('./log')

module.exports.build = function (branch, releaseId, bapConfig) {
  if (bapConfig.build) {
    if (isString(bapConfig.build)) {
      log('Building with', color.cyanBright(bapConfig.build))
      sh(bapConfig.build, {
        inherit: true,
        env: {
          NODE_ENV: 'production',
          BAP_RELEASE_BRANCH: branch,
          BAP_RELEASE_NAME: releaseId,
          BAP_RELEASE_ID: releaseId
        }
      })
    } else {
      bapConfig.notify({ branch, releaseId })
    }
  }
}

module.exports.clean = function (bapConfig) {
  if (bapConfig.clean) {
    if (isString(bapConfig.clean)) {
      log('Cleaning with', color.cyanBright(bapConfig.clean))
      sh(bapConfig.clean, { inherit: true })
    } else {
      bapConfig.clean()
    }
  }
}

module.exports.notify = function (branch, releaseId, bapConfig) {
  if (bapConfig.notify) {
    if (isString(bapConfig.notify)) {
      log('Notifying with', color.cyanBright(bapConfig.notify))
      sh(bapConfig.notify, {
        inherit: true,
        env: {
          BAP_RELEASE_BRANCH: branch,
          BAP_RELEASE_NAME: releaseId
        }
      })
    } else {
      bapConfig.notify({ branch, releaseId })
    }
  }
}

function isString (obj) {
  return typeof obj === 'string'
}
