var color = require('cli-color')
var format = require('date-fns/format')

module.exports = log

function log () {
  console.log.apply(console, [format(new Date(), 'YYYY-MM-DDTHH:mm:ssZ'), '-'].concat(args(arguments)))
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
