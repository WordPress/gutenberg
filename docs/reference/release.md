# Gutenberg Release Process

This document serves as a checklist for building and releasing a new version of Gutenberg. It documents our release process, but it is helpful if you'd like to understand how Gutenberg ships release candidates and new versions.

To release Gutenberg, you need commit access to the [WordPress.org plugin repository](https://plugins.trac.wordpress.org/browser/gutenberg/). 🙂

## Gutenberg Versioning

Gutenberg currently does not follow semantic versioning. Right now "point releases"/minor releases (eg. `3.8` > `3.9`) constitute a major version bump. Our [deprecation policy](./deprecated.md) attempts to keep any deprecated APIs/functions for at least two "point releases".

## Release Candidates

When a new version milestone is published in the [Gutenberg milestones](https://github.com/WordPress/gutenberg/milestones), a date should accompany it. We usually track the current and next version milestone, and we tend to release a version every two weeks. The date in the milestone is the date of tagging the release candidate, not the final version that will be published to the plugin repository.

Since [`3.8`](https://github.com/WordPress/gutenberg/releases/tag/v3.8.0), we [publish a release candidate](https://github.com/WordPress/gutenberg/releases/tag/v3.8.0-rc.1) at least one week before we actually publish a new version. This release candidate is available for plugin authors and for users to test. If any bugs/regressions are found with a release candidate, they should be cherry-picked into a new release candidate and it should be published.

Release candidates should be versioned incrementally, starting with `-rc.1`, then `-rc.2`, and so on.

### Cherry-picking into Release Candidates

If a bug is found in a release candidate and a fix is committed to `master`, we should include that fix in a new release candidate. To do this you'll need to use `git cherry-pick`. This way only fixes are added to the release candidate and not all the new code that has landed since tagging.

(This guide assumes we are targetting version `4.0.0`, we released `4.0.0-rc.1` already, and the commit hash for the fix is `123456abcdef`. Substitute those values for your own.)

Here is the process to cherry-pick a fix and push a new tag:

```bash
git fetch --tags
git checkout v4.0.0-rc1
git cherry-pick 123456abcdef # If you want to cherry-pick multiple fixes for a
                             # new release candidate, you can cherry-pick
                             # multiple times.
git tag v4.0.0-rc2
git push origin v4.0.0-rc2
```

After you've pushed a new release-candidate for a version, you should update the [GitHub Releases page](https://github.com/WordPress/gutenberg/releases). In this example, you would visit https://github.com/WordPress/gutenberg/releases/edit/v4.0.0-rc.1 and click _"Edit Release"_, then change the tag from `v4.0.0-rc1` to `v4.0.0-rc2`. You should create a new `gutenberg.zip` file, and replace the existing one on that page with the new release.

It's worth mentioning that a new release candidate has been released in the [`#core-editor` channel](https://wordpress.slack.com/messages/C02QB2JS7).

## How To Release Gutenberg

This guide applies to both release candidates and actual releases. The only difference between a release candidate and actual release is that the "push to repository" step is only done for actual releases and not release candidates.

### Writing the Release Post and Changelog

* Open the [recently updated PRs view](https://github.com/WordPress/gutenberg/pulls?q=is%3Apr+is%3Aclosed+sort%3Aupdated-desc) and find the PR where the last version bump occurred.
* Read through each PR since the last version bump to determine if it needs to be included in the Release Post and/or changelog.
* Choose a feature or two to highlight in the release post–record an animation of them in action.
* Save the draft post on [make.wordpress.org/core](https://make.wordpress.org/core/), for publishing after the release.

### Bumping the Version

* Create a PR like [this for a release candidate](https://github.com/WordPress/gutenberg/pull/9663) or like [this for an actual release](https://github.com/WordPress/gutenberg/pull/3479/files), bumping the version number in `gutenberg.php`, `package.json`, and `package-lock.json`.
* Check that there's no work-in-progress that's just about to land. [Inform committers in `#core-editor` on Slack](https://make.wordpress.org/chat/) to hold off on merging any changes until after the release process is complete.
* Merge the version bump PR.

#### For Patch Releases Done via `git cherry-pick`

If you're creating a bugfix release which is cherry-picked instead of tagged from `master` (example: https://github.com/WordPress/gutenberg/compare/v3.1.0…v3.1.1), you should go about things a bit differently:

1. Check out the last release (for example: `git checkout v3.1.0`).
2. Cherry-pick commits (in chronological order) with `git cherry-pick [SHA]`.
3. Tag this release and push it to GitHub:
```bash
git tag v3.1.1
git push origin v3.1.1
```
4. Create a merge PR against master that only bumps the version number in `gutenberg.php`, `package.json`, and `package-lock.json`.

### Build the Release

Note: The `1.x.0` notation `git` and `svn` commands should be replaced with the version number of the new release.

* Run `git checkout master` and `git pull`. Make sure your local `master` is up to date; you can confirm this by opening `gutenberg.php` and checking for the version bump you merged previously.
* Run `./bin/build-plugin-zip.sh` from the root of project. This packages a zip file with a release build of `gutenberg.zip`.
* Check that the zip file looks good. Drop it in the [`#core-editor` channel](https://wordpress.slack.com/messages/C02QB2JS7) for people to test. Again: make sure if you unzip the file that the version number is correct.
* Run `git tag v1.x.0` from `master` branch (with the new version we are shipping).
* Run `git push origin v1.x.0`.

### Post the Release to GitHub

Any new release should be posted with a changelog and a `gutenberg.zip` file to the [GitHub Releases page](https://github.com/WordPress/gutenberg/releases). Here's an example [release post](https://github.com/WordPress/gutenberg/releases/tag/v3.8.0) and [release candidate post](https://github.com/WordPress/gutenberg/releases/tag/v3.8.0-rc.1).

### Push the Release to the Plugin Repository

**Only perform this step for an actual release and never for a release candidate. This will update the version of Gutenberg in the plugin repository and will update end-users Gutenberg plugin on their WordPress sites.**

You'll need to use Subversion to publish the plugin to WordPress.org.

* Do an SVN checkout of `https://wordpress.org/plugins/gutenberg/`:
  * If this is your first checkout, run: `svn checkout https://plugins.svn.wordpress.org/gutenberg`
  * If you already have a copy, run: `svn up`
* Delete the contents of `trunk` except for the `readme.txt` and `changelog.txt` files (these files don’t exist in the git repo, only in subversion).
* Extract the contents of the zip file to `trunk`.
* Edit `readme.txt`, replacing the changelog for the previous version with the current release's changelog.
* Add the changelog for the current release to `changelog.txt`.
* Add new files to the SVN repo, and remove old files, in the `trunk` directory:
```bash
# Add new files:
svn st | grep '^\?' | awk '{print $2}' | xargs svn add
# Delete old files:
svn st | grep '^!' | awk '{print $2}' | xargs svn rm
```

* Commit the new version to `trunk`:
```bash
svn ci -m "Committing version 1.x.0"
```

* Tag the new version. Change to the parent directory, and run:
```bash
svn cp trunk tags/1.x.0
svn ci -m "Tagging version 1.x.0."
```

* Edit `trunk/readme.txt` to point to the new tag. The **Stable version** header in `readme.txt` should be updated to match the new release version number. After updating and committing that, the new version will be released:
```bash
svn ci -m "Releasing version 1.x.0"
```

## Post-Release

* Check that folks are able to install the new version from their Dashboard.
* Publish the make/core post.
* Pat yourself on the back! 👍

Ta-da! 🎉
