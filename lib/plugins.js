const co = require('co')
const log = require('./log')

const HOOK_TYPES = ['postRelease']

HOOK_TYPES.forEach(function (type) {
  module.exports[type] = function (bapConfig, hookData) {
    return executeHook(bapConfig, type, hookData)
  }
})

const executeHook = co.wrap(function * (bapConfig, type, hookData) {
  for (let plugin of bapConfig.plugins) {
    if (plugin[type]) {
      try {
        yield plugin[type](hookData, bapConfig) || {}
      } catch (e) {
        log.error('Error while executing hook `' + type + '` on plugin `' + getPluginName(plugin) + '`:', e.stack)
      }
    }
  }
})

function getPluginName (plugin) {
  if (plugin.constructor && plugin.constructor.name) {
    return plugin.constructor.name
  }

  return 'UnknownPlugin'
}
