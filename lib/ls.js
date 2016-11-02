const klaw = require('klaw')

module.exports = function ls (path) {
  const items = []
  return new Promise(function (resolve, reject) {
    klaw(path)
      .on('readable', function () {
        const item
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
