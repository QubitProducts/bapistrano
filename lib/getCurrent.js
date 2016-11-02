module.exports = async function getCurrent (s3, branch) {
  const current = await s3.tryReadingFile(`/${branch}/current`)
  return current ? current.Body.toString() : null
}
