var fs = require('fs')
var path = require('path')
var gift = require('gift')
var co = require('creed').coroutine
var log = require('./log')
var promisify = require('./promisify')

var gitRoot = findGitRoot()

if (!gitRoot) {
  log.error('Bap can only be executed inside git repos')
  process.exit()
}

var repo = gift(gitRoot)

module.exports = co(function * (asBranch) {
  var branch

  if (asBranch) {
    branch = asBranch
  } else {
    branch = (yield promisify(repo, 'branch')()).name
  }

  var commit = (yield promisify(repo, 'current_commit')()).id

  return { branch, commit }
})

function findGitRoot () {
  var cwd = process.cwd()
  var parts = cwd.split('/')
  while (parts.length) {
    try {
      fs.accessSync(path.join(parts.join('/'), '.git'))
      return path.join(parts.join('/'))
    } catch (err) {}
    parts.pop()
  }
}
