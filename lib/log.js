var color = require('cli-color')
var moment = require('moment')

module.exports = log

function log (...args) {
  console.log(moment().format(), '-', ...args)
}

log.noTs = function clean (...args) {
  console.log(...args)
}

log.error = function err (...args) {
  log(color.red(...args))
  process.exitCode = 1
}

log.warn = function warn (...args) {
  log(color.yellow(args))
}
