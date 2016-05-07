var gift = require('gift-wrapper')
var co = require('creed').coroutine

var repo = gift('../..')

module.exports = co(function * (asBranch) {
  // Upload the dist files
  var branch

  if (asBranch) {
    branch = asBranch
  } else {
    branch = (yield repo.branch()).name
  }

  var commit = (yield repo.current_commit()).id

  return { branch, commit }
})
