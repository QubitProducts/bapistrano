var color = require('cli-color')
var moment = require('moment')

module.exports = log

function log () {
  console.log.apply(console, [moment().format(), '-'].concat(args(arguments)))
}

log.noTs = function clean () {
  console.log.apply(console, arguments)
}

log.error = function err () {
  log(color.red.apply(color, args(arguments)))
  process.exitCode = 1
}

log.warn = function warn () {
  log(color.yellow.apply(color, args(arguments)))
}

function args (argArr) {
  return [].slice.apply(argArr)
}
