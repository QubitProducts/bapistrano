# bap

An opinionated way of deploying JS apps to s3.

Bap is designed to be easily hooked up with a Continuous Deployment system that would keep all branches always built and uploaded to s3.

## Installation

    $ npm install --save-dev bap

## Usage

Typical usage is simply

    $ bap release

However, you can get more control by combining the following 2 commands

    $ bap upload
    $ bap release

For release branches - upload command only uploads the code without updating the `current` pointer. For feature branches - upload command uploads the code *and* updates the `current` pointer. The reasoning here is that in your CI configuration, you only need to specify `bap upload` to get continuous releases of all your branches, with the exception that the release branches only get uploaded, but not released. This way, if you then execute `bap release` at a later time (to a chat bot or in your terminal) - the release will be instant, since `bap upload` has already been executed in the background by CI.

## All Commands

Build and upload the current branch. Uploading doesn't affect the `current` pointer.

    $ bap upload

Build and upload a specific commit. This will get uploaded to a directory named on the branch you're currently on even if the commit is not in that branch.

    $ bap upload --as-branch master

Update the `current` pointer of current branch to the latest commit of current branch.

    $ bap release

Rollback the current release of current branch to the previous release.

    $ bap rollback

List all deployments.
    
    $ bap list

Remove a specific deployment, but only if it's not currently pointed to by the `current` pointer.

    $ bap remove cdef12
    $ bap remove 201605062317-cdef12

## Config

Your aws credentials will be read from ~/.aws or environment variables.

You can also specify bap configuration in `package.json`:

```js
{
  "bap": {
    "region": "eu-west-1",      # default is us-west-1
    "bucket": "ui",
    "dist": "build",            # default is `.`
    "shared": "shared",         # default is false
    "uploadTo": "ui/app",       # default is package.json#name
    "build": false,             # default is "npm run build"
    "keepReleases": 5,          # default is -1, which is keep them all
    "releaseBranches": [        # default is ["master"]
      "master",
      "next"
    ]
  }
}
```

## What does this do exactly?

Bap considers two types of branches. Release branches and feature branches. The default release branch is `master`, but you could set it to `["stable"]` or `["master", "beta", "alpha"]` or `["master", "next"]`. All branches that are not release branches are considered to be feature branches.

Consider you have the following release branches - master and next, and the following feature branches - fix-bug, improve-search. After executing `bap upload` in each branch, the structure that `bap` would create on s3 would look something like this:

```
  bap-bucket
    app-name
      master
        current # file containing 20160506225500-commit4
        releases
          20160405225500-commit1
          20160506225500-commit4
        shared
      next
        current # file containing 20160517225500-commit7
        releases
          20160415225500-commit3
          20160515225500-commit7
          20160517225500-commit8
        shared
      fix-bug
        current # file containing 20160518225500-commit10
        releases
          20160518225500-commit10
        shared
      improve-search
        current # file containing 20160518225500-commit12
        releases
          20160518225500-commit12
        shared
```

Bap has 3 commands for deploying `upload`, `release` and `rollback`.

- `upload` - runs `npm run build`, uploads the contents of the project to s3. In case it's a feature branch, it also automatically executes the `release` task as well.
- `release` - checks what the latest commit for the current branch is and updates the `current` pointer for this branch to point to the latest upload matching that commit. In case the commit in question is not fully uploaded to s3, `upload` is executed first.
- `rollback` - update `current` pointer to point to the previous release.

It also has some helper commands for performing chores on s3 `list` and `remove`.

- `list` - lists all deployments of all branches
- `remove` - removes a deployment specified by a commit or deployment directory. Bap will refuse to remove releases that are pointed at by `current`.

#### Build

By default, the build command is `npm run build`, but you can specify a custom command in `package.json` key `bap.build`. Similarly, at the end of the `upload` or `release` execution, `npm run clean` gets run. Change this with `bap.clean`. An environment variable BAP_RELEASE_NAME is set before executing the build command so that the build process could take this into account. For example, this might be useful when specifying the `webpack` `publicPath` option. BAP_RELEASE_NAME is of structure YYYY-MM-DDTHHmmss-commit, where commit is the first 6 commit characters.

#### Shared

Shared directory can be used for files that should stay the same between deploys. Useful for resources that should be cached forever.

#### REVISION

When an upload is succesfully completed, a `REVISION` file gets created in the release dir. You can check for this file to know if the upload is complete.
