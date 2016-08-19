var program = require('commander')
var log = require('./log')
var handleError = require('./handleError')

module.exports = function createBapBin (bapConfig) {
  program
    .version(require('../package.json').version)

  program
    .command('upload')
    .description('Build and upload the current branch to s3.')
    .option('-b, --as-branch [branch]', 'Upload the current commit to the specified branch dir irrespective of current branch')
    .action(make('upload', true))

  program
    .command('release')
    .description('Release the current branch to s3. Uploads first if needed.')
    .option('-b, --as-branch [branch]', 'Release the current commit to the specified branch dir irrespective of current branch')
    .action(make('release', true))

  program
    .command('rollback [release]')
    .description('Point current to the previous, next or arbitrary release.')
    .option('-b, --as-branch [branch]', 'Upload the current commit to the specified branch dir irrespective of current branch')
    .option('-f, --forward', 'Roll forward')
    .action(make('rollback'))

  program
    .command('ls [branch]')
    .description('List all releases')
    .option('-l, --limit <n>', 'Limit how many releases to display per branch', parseInt, 10)
    .action(make('list'))

  program
    .command('*')
    .action(function () {
      program.outputHelp()
    })

  program.parse(process.argv)

  if (!process.argv.slice(2).length) {
    program.outputHelp()
  }

  function make (cmd, shouldPrintSuccess) {
    return function () {
      if (!bapConfig.bucket) {
        return log.error('Missing bap.bucket config in package.json')
      }

      const args = [].slice.apply(arguments)

      require('./commands/' + cmd).apply(null, args.concat(bapConfig))
        .catch(handleError)
    }
  }
}
