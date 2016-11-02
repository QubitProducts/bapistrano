const fs = require('fs')
const path = require('path')
const gift = require('gift-wrapper')
const log = require('./log')

const gitRoot = findGitRoot()

if (!gitRoot) {
  log.error('Bap can only be executed inside git repos')
  process.exit()
}

const repo = gift(gitRoot)

module.exports = async function (asBranch) {
  let branch

  if (asBranch) {
    branch = asBranch
  } else {
    branch = (await repo.branch()).name
  }

  const commit = (await repo.current_commit()).id

  return { branch, commit }
}

function findGitRoot () {
  const cwd = process.cwd()
  const parts = cwd.split('/')
  while (parts.length) {
    try {
      fs.accessSync(path.join(parts.join('/'), '.git'))
      return path.join(parts.join('/'))
    } catch (err) {}
    parts.pop()
  }
}
