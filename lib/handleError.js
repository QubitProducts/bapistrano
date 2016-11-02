const color = require('cli-color')
const log = require('./log')

module.exports = function (err) {
  log(color.red('Command failed'))
  log(err.stack)
  process.exitCode = 1
}
