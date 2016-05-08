# bap

An opinionated way of deploying JS apps to s3.

Bap is designed to be easily hooked up with a Continuous Deployment system that would keep all branches always built and uploaded to s3.

## Installation

    $ npm install --save-dev bapistrano

## Usage

Typical usage is

    $ bap release

This will build, upload and release your project. However, you can get more control by combining the following 2 commands

    $ bap upload
    $ bap release

For release branches - upload command only uploads the code without updating the `current` pointer. For feature branches - upload command uploads the code *and* updates the `current` pointer. The reasoning here is that in your CI configuration, you only need to specify `bap upload` to get continuous releases of all your branches, with the exception that the release branches only get uploaded, but not released. This way, if you then execute `bap release` at a later time (to a chat bot or in your terminal) - the release will be instant, since `bap upload` has already been executed in the background by CI.

## All Commands

Build and upload the current branch. Uploading doesn't affect the `current` pointer.

    $ bap upload
    $ bap upload --as-branch master

Update the `current` pointer of current branch to the latest commit of current branch.

    $ bap release
    $ bap release --as-branch master

Rollback the current release of current branch to the previous release.

    $ bap rollback
    $ bap rollback --forward
    $ bap rollback --as-branch master

List all deployments.
    
    $ bap list
    $ bap list --limit 100
    $ bap list master

## Config

Your aws credentials will be read from ~/.aws or environment variables (this is using [s3fs](https://www.npmjs.com/package/s3fs) under the hood which is using [aws-sdk](https://www.npmjs.com/package/aws-sdk)).

You can specify bapistrano configuration in `package.json`:

```js
{
  "bap": {
    "bucket": "ui",
    "region": "eu-west-1",      # default is us-west-1
    "distDir": "build",         # default is `.`
    "uploadTo": "ui/app",       # default is package.json#name
    "build": false,             # default is "npm run build"
    "clean": false,             # default is "npm run clean"
    "notify": 'make slack',     # default is false
    "keepReleases": 5,          # default is -1, which keeps all releases
    "keepUploads": 5,           # default is 5
    "releaseBranches": [        # default is ["master"]
      "master",
      "next"
    ]
  }
}
```

## What does this do exactly?

Bap considers there to be two types of branches. Release branches and feature branches. The default release branch is `master`, but you could set it to `["stable"]` or `["master", "beta", "alpha"]` or `["master", "next"]`. All branches that are not release branches are considered to be feature branches.

Consider you have the following release branches - master and next, and the following feature branches - fix-bug, improve-search. After executing `bap release` in each branch, the structure that `bap` would create on s3 would look something like this:

```
  bap-bucket
    app-name
      master
        current # file containing 2016-05-06T225500-commit4
        releases
          2016-04-05T225500-commit1
          2016-05-06T225500-commit4
        uploads
          2016-04-05T225500-commit1
          2016-05-06T225500-commit3
          2016-05-06T225500-commit4
      next
        current # file containing 2016-05-17T225500-commit7
        releases
          2016-04-15T225500-commit3
          2016-05-15T225500-commit7
          2016-05-17T225500-commit8
        uploads
          2016-04-15T225500-commit3
          2016-05-15T225500-commit5
          2016-05-15T225500-commit7
          2016-05-17T225500-commit8
          2016-05-17T225500-commit9
      fix-bug
        current # file containing 2016-05-18T225500-commit10
        releases
          2016-05-18T225500-commit10
      improve-search
        current # file containing 2016-05-18T225500-commit12
        releases
          2016-05-18T225500-commit12
```

Bap has 3 commands for deploying `upload`, `release` and `rollback`.

- `upload` - runs `npm run build`, uploads the contents of the project to s3. For feature branches, it directly uploads the release to `releases` directory, immediately updates the `current` pointer and cleans up. For release branches, it only uploads the code to `uploads` directory and doesn't touch the `releases` dir.
- `release` - updates the `current` pointer to the latest commit of the current branch. In case the commit in question is not uploaded to s3, `upload` is executed first. Typically, if you're previously executed the `upload` task, release will be very quick as it only copies the right release from `uploads` into `releases` and updates the `current` pointer without having to run the build again.
- `rollback` - updates `current` pointer to point to the previous release. Use `--forward` to update it to the next release. Or specify the release name as an argument to roll to a specific release.

Bap has some helper commands for performing chores on s3 `list` and `remove`.

- `list` - lists all deployments of all branches
- `remove` - removes a deployment specified by a commit or deployment directory. Bap will refuse to remove releases that are pointed at by `current`.

#### Build

By default, the build command is `npm run build`, but you can specify a custom command in `package.json` key `bap.build`. Similarly, at the end of the `upload` or `release` execution, `npm run clean` gets run. Change this with `bap.clean`. Environment variables BAP_RELEASE_NAME and BAP_BRANCH are set before executing the build command so that the build process could take this into account. For example, this might be useful when specifying the `webpack` `publicPath` option. BAP_RELEASE_NAME is of structure YYYY-MM-DDTHHmmss-commit, where commit is the first 6 commit characters.

#### REVISION

When an upload is succesfully completed, a `REVISION` file gets created in the release dir. You can check for this file to know if the upload is complete.

## Convention vs Configuration

Bapistrano is designed to be easily specialised for your projects without having to repeat the configuration in all of the projects. Say you have 5 projects that you want to deploy with bapistrano and they all live in the same s3 bucket with the same structure and have the same lifecycle commands.

You can create your own tiny npm package with `bin/bap` that creates a version of bap with custom defaults, e.g.:

```js
#!/usr/bin/env node

var path = require('path')
var meta = require(path.join(process.cwd(), 'package.json'))

require('bapistrano/lib/bin')(Object.assign(require('bapistrano/lib/defaults')(), {
  bucket: 'all-my-apps',
  region: 'eu-west-1',
  uploadTo: 'deployments/' + meta.name,
  build: 'make build',
  clean: 'make clean',
  notify: 'make post-to-slack && curl -X POST https://myapp.com'
}, meta.bap))
```

Now all 5 of those projects can just call `bap upload` or `bap release` without any further configuration in package.json
