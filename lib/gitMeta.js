var fs = require('fs')
var path = require('path')
var gift = require('gift-wrapper')
var log = require('./log')

var gitRoot = findGitRoot()

if (!gitRoot) {
  log.error('Bap can only be executed inside git repos')
  process.exit()
}

var repo = gift(gitRoot)

module.exports = async function (asBranch) {
  var branch

  if (asBranch) {
    branch = asBranch
  } else {
    branch = (await repo.branch()).name
  }

  var commit = (await repo.current_commit()).id

  return { branch, commit }
}

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
