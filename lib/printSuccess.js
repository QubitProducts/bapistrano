var color = require('cli-color')
var log = require('./log')

module.exports = function () {
  log(color.green(pickRandom([
    'All good!',
    'Bi Bim Bap!',
    'On The Bap!',
    'OK!',
    'Yes!',
    'On a roll!',
    'Cool!'
  ])))
}

function pickRandom (list) {
  return list[Math.floor(Math.random() * list.length)]
}
