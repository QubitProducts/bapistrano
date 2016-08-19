var minimatch = require('minimatch')

var alwaysPrivate = ['REVISION']

module.exports = function isPrivate (f, priv) {
  priv = priv.concat(alwaysPrivate)
  if (priv && priv.length && !!priv.find(pattern => minimatch(f, pattern, { matchBase: true }))) {
    return true
  }
  return false
}
