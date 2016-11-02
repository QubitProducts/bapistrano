const path = require('path')
const meta = require(path.join(process.cwd(), 'package.json'))

module.exports = function () {
  return {
    bucket: null, // required - bin.js will error if this is not set
    distDir: '.',
    uploadTo: meta.name,
    build: 'npm run build',
    clean: 'npm run clean',
    notify: false,
    keepReleases: -1,
    keepUploads: 5,
    releaseBranches: ['master'],
    private: []
  }
}
