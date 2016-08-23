var execSync = require('child_process').execSync

module.exports = function sh (cmd, options) {
  var execOptions = {
    stdio: options.inherit ? { stdio: [0, 1, 2] } : undefined,
    env: options.env
  }
  var ret = execSync(cmd, execOptions)
  if (ret) {
    return ret.toString().replace(/\n$/, '')
  }
}
