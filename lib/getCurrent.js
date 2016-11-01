module.exports = async function getCurrent (s3, branch) {
  var current = await s3.tryReadingFile(`/${branch}/current`)
  return current ? current.Body.toString() : null
}
