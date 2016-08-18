var bap = require('../..').meta({
  bucket: 'qubit-ui',
  region: 'eu-west-1'
})

bap.getCurrent('ui/bap-example', 'master').then(a => console.log(a))
bap.getBranches('ui/bap-example', 'master').then(a => console.log(a))
