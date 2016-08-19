module.exports = function (list, fn) {
  return list.reduce(function (m, x, i, l) {
    return m.then(() => fn(x, i, l))
  }, Promise.resolve())
}
