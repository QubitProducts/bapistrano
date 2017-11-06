module.exports = function getCurrent (s3, branch) {
  return s3.tryReadingFile(`/${branch}/current`).then(function (current) {
    return current ? current.Body.toString() : null
  })
}
