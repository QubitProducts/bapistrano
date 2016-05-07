var execSync = require('child_process').execSync

module.exports = function sh (cmd, inherit) {
  var ret = execSync(cmd, inherit ? { stdio: [0, 1, 2] } : undefined)
  if (ret) {
    return ret.toString().replace(/\n$/, '')
  }
}
