var execSync = require('child_process').execSync

module.exports = function sh (cmd, options) {
  var execOptions = {
    env: options.env
  }

  if (options.inherit) {
    execOptions.stdio = [0, 1, 2]
  }

  var ret = execSync(cmd, execOptions)
  if (ret) {
    return ret.toString().replace(/\n$/, '')
  }
}
