var moment = require('moment')

module.exports = function (...args) {
  console.log(moment().format(), '-', ...args)
}
