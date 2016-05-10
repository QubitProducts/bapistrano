var execSync = require('child_process').execSync

module.exports = function sh (cmd, options) {
  var ret = execSync(cmd, options.inherit ? { stdio: [0, 1, 2] } : undefined, { env: options.env })
  if (ret) {
    return ret.toString().replace(/\n$/, '')
  }
}
