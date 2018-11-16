# Gutenberg Release Process

This document serves as a checklist for building and releasing a new version of Gutenberg. It documents our release process, but it is helpful if you'd like to understand how Gutenberg ships release candidates and new versions.

To release Gutenberg, you need commit access to the [WordPress.org plugin repository]. 🙂

## Gutenberg Versioning

Gutenberg follows semantic versioning; we release a new major version approximately every two weeks. The current and next versions are [tracked in GitHub milestones](https://github.com/WordPress/gutenberg/milestones), along with each version's tagging date. The date in the milestone is the date of **tagging the release candidate**, not the final version that will be published to the [plugin repository].

Up until version `4.0.0`, "point releases"/minor releases (eg. `3.8` > `3.9`) effectively constituted a major version bump.

Our [deprecation policy](./deprecated.md) maintains deprecated APIs/functions for two major versions, whenever possible.

# Release Candidates

Since [`3.8`](https://github.com/WordPress/gutenberg/releases/tag/v3.8.0), we [publish a release candidate](https://github.com/WordPress/gutenberg/releases/tag/v3.8.0-rc.1) at least one week before we publish a new version. This release candidate is available for plugin authors and for users to test. If any bugs/regressions are found with a release candidate, they should be cherry-picked into a new release candidate and it should be published.

Release candidates should be versioned incrementally, starting with `-rc.1`, then `-rc.2`, and so on.

## Creating a Release Candidate

Creating a release candidate involves:

1. writing a release blog post and changelog
2. bumping the version
3. tagging the release
4. building the plugin
5. publishing the new release to GitHub
6. committing to the [plugin repository]

### Writing the Release Post and Changelog

1. Open the [list of closed pull requests](https://github.com/WordPress/gutenberg/pulls?utf8=✓&q=is%3Apr+is%3Aclosed+sort%3Acreated-desc+) and filter by the current milestone.
2. Read through each PR  to determine if it needs to be included in the blog post and/or changelog.
3. Choose a few features to highlight in the release post; record an animation of them in use.
4. Save the draft post on [make.wordpress.org/core](https://make.wordpress.org/core/); this post should be published after the actual release.

### Bumping the Version

1. Create [a pull request like this](https://github.com/WordPress/gutenberg/pull/9663), bumping the version number in `gutenberg.php`, `package.json`, and `package-lock.json`.
2. Check that there's no work-in-progress that's just about to land. [Inform committers in `#core-editor` on Slack](https://make.wordpress.org/chat/) to hold off on merging any changes until after the release candidate is tagged.
3. Merge the version bump pull request.

### Tag the Release

1. [Create a new release on GitHub](https://github.com/WordPress/gutenberg/releases/new).
2. If you were releasing the `5.0.0` release candidate, label it `v5.0.0-rc.1`.
3. The GitHub release screen should look like this:
[![GitHub Release Screenshot](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/reference/release-screenshot.png)](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/reference/release-screenshot.png)
4. Creative emojis related to a key feature in this release are encouraged. Emojis are fun!
5. Publish the release.

### Build the Plugin

1. Run `git fetch --tags`.
2. Check out the tag for this release; it will be the tag you created on the GitHub release page; assuming version `5.0.0`, you should run `git checkout v5.0.0-rc.1`.
3. Run `./bin/build-plugin-zip.sh` from the root of project. This packages a zip file with a release build of `gutenberg.zip`.

### Publish the Release on GitHub

1. Upload the a `gutenberg.zip` file to the [GitHub Releases page](https://github.com/WordPress/gutenberg/releases)
2. Post a link to the release page to the [`#core-editor` channel](https://wordpress.slack.com/messages/C02QB2JS7).

Here's an example [release candidate page](https://github.com/WordPress/gutenberg/releases/tag/v3.8.0-rc.1); yours should look like that when you're finished.

### Commit to the Plugin Repository

You'll need to use Subversion for this step.

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
# Replace vX.X.X-rc.1 with your version:
svn ci -m "Committing Gutenberg version vX.X.X-rc.1"
```

## Creating Release Candidate Patches (done via `git cherry-pick`)

If a bug is found in a release candidate and a fix is committed to `master`, we should include that fix in a new release candidate. To do this you'll need to use `git cherry-pick`. This way only fixes are added to the release candidate and not all the new code that has landed on `master` since tagging:

1. Create a pull request against master that only bumps the release candidate number in `gutenberg.php`, `package.json`, and `package-lock.json`. If your current release candidate is `v3.8.0-rc.1`, you would change the version number to `v3.8.0-rc.2`
2. After this pull request is merged into master, note its commit SHA.
3. Run `git fetch --tags` to load the tags.
4. Check out the latest release candidate (for example: `git checkout v3.8.0-rc.1`).
5. Cherry-pick fix commits (in chronological order) with `git cherry-pick [SHA]`.
6. Cherry-pick the version bump commit you noted in step 2.
7. Tag this release by incrementing its `rc.X` number and push it to GitHub:
```bash
git tag v3.8.0-rc.2
git push origin v3.8.0-rc.2
```
8. Follow the steps in [tag the release](#tag-the-release), [build the plugin](#build-the-plugin), [publish the release on GitHub](#publish-the-release-on-github), and [commit to the plugin repository](#commit-to-the-plugin-repository). You can copy the existing changelog from the previous release candidate.

It's worth mentioning that a new release candidate has been released in the [`#core-editor` channel](https://wordpress.slack.com/messages/C02QB2JS7).

# Official Gutenberg Releases™

The process of releasing Gutenberg is similar to creating a release candidate, except we don't use the `-rc.X` in the `git` tag and we publish a new branch in the subversion repository. This updates the version available in the WordPress plugin repository and will cause WordPress sites around the world to prompt users to update to this new version. The steps below are very similar to the ones above, for a release candidate, but they're spelled out here in their entirely to reduce confusion. 😅

## Creating a Release

Creating a release involves:

1. verifying the release blog post and changelog
2. bumping the version
4. building the plugin
5. publishing the new release to GitHub
6. committing to the [plugin repository]
7. publishing the release blog post

### Verifying the Release Post and Changelog

1. Check the draft post on [make.wordpress.org/core](https://make.wordpress.org/core/); make sure the changelog reflects what's shipping in the release.

### Bumping the Version

1. Create [a pull request with a commit like this](https://github.com/WordPress/gutenberg/commit/00d01049685f11f9bb721ad3437cb928814ab2a2#diff-b9cfc7f2cdf78a7f4b91a753d10865a2), removing the `-rc.X` from the version number in `gutenberg.php`, `package.json`, and `package-lock.json`.
2. Merge the version bump pull request. (If you want to live dangerously, you can push the version bump directly to `master`. 😎)
3. Note the commit SHA of the version bump.
4. Cherry-pick the version bump commit into your release candidate branch:
```bash
# Assuming you're releasing version v5.0.0, based on v5.0.0-rc.1.
git fetch --tags
git checkout v.5.0.0-rc.1
git cherry-pick [VERSION-BUMP-COMMIT-SHA]
git tag v5.0.0
git push origin v5.0.0
```

### Build the Plugin

1. Run `git fetch --tags`.
2. Check out the tag for this release; it will be the tag you created on the GitHub release page; assuming version `5.0.0`, you should run `git checkout v5.0.0-rc.1`.
3. Run `./bin/build-plugin-zip.sh` from the root of project. This packages a zip file with a release build of `gutenberg.zip`.

### Publish the Release on GitHub

1. [Create a new release on GitHub](https://github.com/WordPress/gutenberg/releases/new).
2. If you are releasing `5.0.0`, target the tag `v5.0.0`.
3. Upload the `gutenberg.zip` file
4. Post a link to the release page to the [`#core-editor` channel](https://wordpress.slack.com/messages/C02QB2JS7).

Here's an example [release page](https://github.com/WordPress/gutenberg/releases/tag/v3.8.0); yours should look like that when you're finished.

### Commit to the Plugin Repository

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

If you don't have access to [make.wordpress.org/core](https://make.wordpress.org/core/), ping [Matias Ventura](https://profiles.wordpress.org/matveb) or someone else on the Gutenberg Core team to publish the post.

---------

Ta-da! 🎉

[plugin repository]: https://plugins.trac.wordpress.org/browser/gutenberg/
