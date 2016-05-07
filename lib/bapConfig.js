var path = require('path')
var color = require('cli-color')
var meta = require(path.join(process.cwd(), 'package.json'))

module.exports = Object.assign({
  distDir: '.',
  uploadTo: meta.name,
  shared: false,
  build: 'npm run build',
  clean: 'npm run clean',
  keepReleases: -1,
  keepUploads: 5,
  releaseBranches: ['master']
}, meta.bap)

if (!module.exports.bucket) {
  console.error(color.red('Missing bap.bucket config in package.json'))
  process.exit(1)
}
