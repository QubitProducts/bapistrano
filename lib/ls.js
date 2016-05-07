var klaw = require('klaw')

module.exports = function ls (path) {
  var items = []
  return new Promise(function (resolve, reject) {
    klaw(path)
      .on('readable', function () {
        var item
        while ((item = this.read())) {
          if (!item.stats.isDirectory()) {
            items.push(item.path)
          }
        }
      })
      .on('end', function () {
        resolve(items)
      })
      .on('error', reject)
  })
}
