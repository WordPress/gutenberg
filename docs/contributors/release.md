# Gutenberg Release Process

This Repository is used to perform several types of releases. This document serves as a checklist for each one of these. It is helpful if you'd like to understand the different workflows.

To release Gutenberg, you need commit access to the [WordPress.org plugin repository]. 🙂

## Plugin Releases

### Versioning

We release a new major version approximately every two weeks. The current and next versions are [tracked in GitHub milestones](https://github.com/WordPress/gutenberg/milestones), along with each version's tagging date.

### Release Candidates

On the date of the current milestone, we publish a release candidate and make it available for plugin authors and users to test. If any regressions are found with a release candidate, a new release candidate can be published.


The date in the milestone is the date of **tagging the release candidate**. On this date, all remaining PRs on the milestone are moved automatically to the next release.

Release candidates should be versioned incrementally, starting with `-rc.1`, then `-rc.2`, and so on.

#### Creating the first Release Candidate

Releasing the first release candidate for this milestone (`x.x`) involves:

1. writing a release blog post and changelog
2. creating the release branch
3. bumping the version and tagging the release
4. building the plugin
5. publishing the release to GitHub
6. publishing the call for testing

##### Writing the Release Post and Changelog

1. Open the [list of closed pull requests](https://github.com/WordPress/gutenberg/pulls?utf8=✓&q=is%3Apr+is%3Aclosed+sort%3Acreated-desc+) and filter by the current milestone.
2. Read through each PR  to determine if it needs to be included in the blog post and/or changelog.
3. Choose a few features to highlight in the release post; record an animation of them in use.
4. Save the draft post on [make.wordpress.org/core](https://make.wordpress.org/core/); this post should be published after the actual release.

##### Creating the Release Branch

For each milestone (let's assume it's `x.x` here), a release branch is used to release all RCs and minor releases. For the first RC of the milestone, a release branch is created from master.

```
git checkout master
git checkout -b release/x.x
git push origin release/x.x
```

##### Bumping the Version and Tagging the Release

1. Checkout the `release/x.x` branch.
2. Create [a commit like this](https://github.com/WordPress/gutenberg/pull/13125/commits/13fa651dadc2472abb9b95f80db9d5f23e63ae9c), bumping the version number in `gutenberg.php`, `package.json`, and `package-lock.json` to `x.x.0-rc.1`.
3. Create a Pull Request from the release branch into `master` using the changelog as a description and ensure the tests pass properly.
4. Tag the RC version. `git tag vx.x.0-rc.1` from the release branch.
5. Push the tag `git push --tags`.
6. Merge the version bump pull request and avoid removing the release branch.

##### Build the Plugin

1. Run `git fetch --tags`.
2. Check out the tag for this release, you should run `git checkout vx.x.0-rc.1`.
3. Run `./bin/build-plugin-zip.sh` from the root of project. This packages a zip file with a release build of `gutenberg.zip`.

##### Publish the Release on GitHub

1. [Create a new release on GitHub](https://github.com/WordPress/gutenberg/releases/new).
2. If you were releasing the `x.x.0-rc.1` release candidate, label it `x.x.0-rc.1` and use the `vx.x.x-rc.1` as a tag.
3. Upload the a `gutenberg.zip` file into the release.
4. Use the changelog as a description of the release.
5. Publish the release.

Here's an example [release candidate page](https://github.com/WordPress/gutenberg/releases/tag/v4.6.0-rc.1); yours should look like that when you're finished.

##### Publishing the Call For Testing

Ping someone from the `[#core-test](https://wordpress.slack.com/messages/C03B0H5J0)` team to publish a call for testing post. Here's an [example call for testing post.](https://make.wordpress.org/test/2019/01/04/call-for-testing-gutenberg-4-8/)

#### Creating Release Candidate Patches (done via `git cherry-pick`)

If a bug is found in a release candidate and a fix is committed to `master`, we should include that fix in a new release candidate. To do this you'll need to use `git cherry-pick` to add these changes to the milestone's release branch. This way only fixes are added to the release candidate and not all the new code that has landed on `master` since tagging:

1. Checkout the corresponding release branch with: `git checkout release/x.x`.
2. Cherry-pick fix commits (in chronological order) with `git cherry-pick [SHA]`.
3. Create [a commit like this](https://github.com/WordPress/gutenberg/pull/13125/commits/13fa651dadc2472abb9b95f80db9d5f23e63ae9c), bumping the version number in `gutenberg.php`, `package.json`, and `package-lock.json` to `x.x.0-rc.2`.
4. Create a Pull Request from the release branch into `master` using the changelog as a description and ensure the tests pass properly.
5. Tag the RC version. `git tag vx.x.0-rc.2` from the release branch.
6. Push the tag `git push --tags`.
7. Merge the version bump pull request and avoid removing the release branch.
8. Follow the steps in [build the plugin](#build-the-plugin) and [publish the release on GitHub](#publish-the-release-on-github). 

You can copy the existing changelog from the previous release candidate. Let other contributors know that a new release candidate has been released in the [`#core-editor` channel](https://wordpress.slack.com/messages/C02QB2JS7) and the call for testing post.

### Official Gutenberg Releases™

The process of releasing Gutenberg is similar to creating a release candidate, except we don't use the `-rc.X` in the `git` tag and we publish a new branch in the subversion repository. This updates the version available in the WordPress plugin repository and will cause WordPress sites around the world to prompt users to update to this new version.

#### Creating a Release

Creating a release involves:

1. verifying the release blog post and changelog
2. bumping the version
3. building the plugin
4. publishing the new release to GitHub
5. committing to the [plugin repository]
6. publishing the release blog post

##### Verifying the Release Post and Changelog

1. Check the draft post on [make.wordpress.org/core](https://make.wordpress.org/core/); make sure the changelog reflects what's shipping in the release.

##### Bumping the Version

1. Checkout the release branch `git checkout release/x.x`.

**Note:** This branch should never be removed or rebased. This means in case of conflicts when creating PRs from this branch, create temporary branches in order to merge these PRs and avoid touching the release branch.

2. Create [a commit like this](https://github.com/WordPress/gutenberg/commit/00d01049685f11f9bb721ad3437cb928814ab2a2#diff-b9cfc7f2cdf78a7f4b91a753d10865a2), removing the `-rc.X` from the version number in `gutenberg.php`, `package.json`, and `package-lock.json`.
3. Create a Pull Request from the release branch into `master` using the changelog as a description and ensure the tests pass properly.
4. Tag the version. `git tag vx.x.0` from the release branch.
5. Push the tag `git push --tags`.
6. Merge the version bump pull request and avoid removing the release branch.

##### Build the Plugin

1. Run `git fetch --tags`.
2. Check out the tag for this release, you should run `git checkout vx.x.0`.
3. Run `./bin/build-plugin-zip.sh` from the root of project. This packages a zip file with a release build of `gutenberg.zip`.

##### Publish the Release on GitHub

1. [Create a new release on GitHub](https://github.com/WordPress/gutenberg/releases/new).
2. If you were releasing the `x.x.0` release candidate, label it `x.x.0` and use the `vx.x.x` as a tag.
3. Upload the a `gutenberg.zip` file into the release.
4. Use the changelog as a description of the release.
5. Publish the release.

##### Commit to the Plugin Repository

You'll need to use Subversion to publish the plugin to WordPress.org.

1. Do an SVN checkout of `https://wordpress.org/plugins/gutenberg/`:
  * If this is your first checkout, run: `svn checkout https://plugins.svn.wordpress.org/gutenberg`
  * If you already have a copy, run: `svn up`
2. Delete the contents of `trunk` except for the `readme.txt` and `changelog.txt` files (these files don’t exist in the `git` repo, only in Subversion).
3. Extract the contents of the zip file to `trunk`.
4. Edit `readme.txt`, replacing the changelog for the previous version with the current release's changelog.
5. Add the changelog for the current release to `changelog.txt`.
6. Add new files/remove deleted files from the repository:
```bash
# Add new files:
svn st | grep '^\?' | awk '{print $2}' | xargs svn add
# Delete old files:
svn st | grep '^!' | awk '{print $2}' | xargs svn rm
```
7. Commit the new version to `trunk`:
```bash
# Replace vX.X.X with your version:
svn ci -m "Committing Gutenberg version vX.X.X"
```
8. Tag the new version. Make sure you're in the root directory of `gutenberg`, then run:
```bash
svn cp trunk tags/X.X.X
svn ci -m "Tagging Gutenberg version X.X.X"
```
9. Edit `trunk/readme.txt` to point to the new tag. The **Stable version** header in `readme.txt` should be updated to match the new release version number. After updating and committing that, the new version should be released:
```bash
svn ci -m "Releasing Gutenberg version X.X.X"
```

This will cause the new version to be available to users of WordPress all over the globe! 💃

You should check that folks are able to install the new version from their Dashboard.

### Publish the Release Blog Post

1. Publish the [make/core](https://make.wordpress.org/core/) release blog post drafted earlier.
2. Pat yourself on the back! 👍

If you don't have access to [make.wordpress.org/core](https://make.wordpress.org/core/), ping [someone on the Gutenberg Core team](https://github.com/orgs/WordPress/teams/gutenberg-core) in the [WordPress #core-editor Slack channel](https://wordpress.slack.com/messages/C02QB2JS7) to publish the post.

## Packages Releases and WordPress Core Updates

WordPress Core Updates are based on the `g-minor` branch. Releasing packages in order to update WordPress Core involves updating the `g-minor` branch (the workflow depends on whether it's a minor or major WordPress release) and run the package release process.

### Major WordPress Releases

For major WordPress releases, the last Gutenberg plugin release is merged into `g-minor`. This involves the following steps:

1. Checkout the last published Gutenberg's release branch `git checkout release/x.x`
2. Create a Pull Request from this branch into `g-minor`.
3. Merge the branch.

### Minor WordPress Releases

For minor releases, the critical fixes targetted for this WordPress Minor release should be cherry-picked into the `g-minor` branch one by one in their chronological order.

### Releasing the WordPress packages

1. Checkout the `g-minor` branch.
2. Run [the package release process](https://github.com/WordPress/gutenberg/blob/master/CONTRIBUTING.md#releasing-packages)
3. Update the `CHANGELOG` files of the published packages with the new released versions and commit to the `g-minor` branch.

---------

Ta-da! 🎉

[plugin repository]: https://plugins.trac.wordpress.org/browser/gutenberg/
