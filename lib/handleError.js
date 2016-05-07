var color = require('cli-color')
var log = require('./log')

module.exports = function (err) {
  log(color.red('Command failed'))
  log(err.stack)
  process.exit(1)
}
