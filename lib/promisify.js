module.exports = function promisify (obj, method) {
  return function () {
    return new Promise((resolve, reject) => {
      obj[method]((err, val) => {
        if (err) return reject(err)
        resolve(val)
      })
    })
  }
}
