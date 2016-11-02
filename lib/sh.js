const execSync = require('child_process').execSync

module.exports = function sh (cmd, options) {
  const execOptions = {}

  if (options.env) {
    execOptions.env = Object.assign({}, process.env, options.env)
  }

  if (options.inherit) {
    execOptions.stdio = [0, 1, 2]
  }

  const ret = execSync(cmd, execOptions)
  return ret && ret.toString().replace(/\n$/, '')
}
