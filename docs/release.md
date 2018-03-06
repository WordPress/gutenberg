# Releasing Gutenberg

This document is a checklist for building and releasing a new version of Gutenberg. Unless you have commit access to the WordPress.org plugin repository, it's unlikely to be of much use to you. 🙂

## Writing the Release Post and Changelog

* Open the [recently updated PRs view](https://github.com/WordPress/gutenberg/pulls?page=2&q=is%3Apr+is%3Aclosed+sort%3Aupdated-desc), and find the PR where the last version bump occurred.
* Read through each PR since then, to determine if it needs to be included in the Release Post and/or changelog.
* Choose a feature or two to highlight in the release post - record an animation of them in action.
* Save the draft post on [make.wordpress.org/core](https://make.wordpress.org/core/), for publishing after the release.

## Bumping the Version

* Create a PR like [this one](https://github.com/WordPress/gutenberg/pull/3479/files), bumping the version number in `gutenberg.php`, `package.json`, and `package-lock.json`.
* Check that there's no work in progress that's just about to land, and inform committers to hold off on merging any changes until after the release process is complete.
* Merge the version bump PR.

## Build the Release

Note: The `1.x.0` notation `git` and `svn` commands should be replaced with the version number of the new release.

* `git checkout master` and `git pull`
  (make sure your local master is up to date, you can confirm by checking `gutenberg.php` and noting the version bump you merged previously.)
* Run the command `npm run package-plugin` from the root of project. This packages a zip file with the final builds.
* Check the zip file looks good. Drop it in the #core-editor channel for people to test. Again, make sure if you unzip the file that the version numbers is correct.
* Run `git tag v1.x.0` from `master` branch (with the new version we are shipping).
* `git push --tags`

## Push the Release

* Have a checkout of https://wordpress.org/plugins/gutenberg/.
  First time: `svn checkout https://plugins.svn.wordpress.org/gutenberg`
  Subsequent times: `svn up`
* Delete the contents of `trunk` except for the `readme.txt` file (this file doesn’t exist in github, only on svn).
* Copy all the contents of the zip file to `trunk`.
* Edit `readme.txt` to include the changelog for the current release.
* Add new files to the SVN repo, and remove old files, in the `trunk` directory:
  Add new files: `svn st | grep '^\?' | awk '{print $2}' | svn add`
  Delete old files: `svn st | grep '^!' | awk '{print $2}' | svn rm`
* Commit the new version to `trunk`:
  `svn ci -m "Committing version 1.x.0"`
* Tag the new version. Change to the parent directory, and run:
  `svn cp trunk tags/1.x.0`
  `svn ci -m "Tagging version 1.x.0."`
* Edit `trunk/readme.txt` to point to the new tag. The `Stable version` header in `readme.txt` should be updated to match the new release version number. After updating and committing that, the new version will be released:
  `svn ci -m "Releasing version 1.x.0"`

## Post Release

* Check that folks are able to install the new version from their Dashboard.
* Publish the make/core post.

Tada! 🎉
