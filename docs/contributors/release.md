# Gutenberg Release Process

This Repository is used to perform several types of releases. This document serves as a checklist for each one of these. It is helpful if you'd like to understand the different workflows.

To release Gutenberg, you need commit access to the [WordPress.org plugin repository][plugin repository]. 🙂

## Plugin Releases

### Schedule

We release a new major version approximately every two weeks. The current and next versions are [tracked in GitHub milestones](https://github.com/WordPress/gutenberg/milestones), along with each version's tagging date.

On the date of the current milestone, we publish a release candidate and make it available for plugin authors and users to test. If any regressions are found with a release candidate, a new release candidate can be published.

The date in the milestone is the date of **tagging the release candidate**. On this date, all remaining PRs on the milestone are moved automatically to the next release.

Release candidates should be versioned incrementally, starting with `-rc.1`, then `-rc.2`, and so on.

Two days after the first release candidate, the stable version is created based on the last release candidate and any necessary regression fixes.

Once the stable version is released, a post [like this](https://make.wordpress.org/core/2019/06/26/whats-new-in-gutenberg-26th-june/) describing the changes and performing a performance audit should be published.

If critical bugs are discovered on stable versions of the plugin, patch versions can be released at any time.

### Release Tool

The plugin release process is entirely automated. To release the RC version of the plugin, run the following command and follow the instructions: (Note that at the time of writing, the tool doesn't support releasing multiple consecutive RC releases)

```bash
./bin/commander.js rc
```

To release a stable version, run:

```bash
./bin/commander.js stable
```

It is possible to run the "stable" release CLI in a consecutive way to release patch releases following the first stable release.

### Manual Release Process

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

**Note:** This branch should never be removed or rebased. When we want to merge something from it to master and conflicts exist/may exist we use a temporary branch `bump/x.x`.

2. Create [a commit like this](https://github.com/WordPress/gutenberg/commit/00d01049685f11f9bb721ad3437cb928814ab2a2#diff-b9cfc7f2cdf78a7f4b91a753d10865a2), removing the `-rc.X` from the version number in `gutenberg.php`, `package.json`, and `package-lock.json`.
3. Create a new branch called `bump/x.x` from `release/x.x` and switch to it: `git checkout -b bump/x.x`.
4. Create a pull request from `bump/x.x` to `master`. Verify the continuous integrations tests pass, before continuing to the next step even if conflicts exist.
5. Rebase `bump/x.x` against `origin/master` using `git fetch origin && git rebase origin/master`.
6. Force push the branch `bump/x.x` using `git push --force-with-lease`.
7. Switch to the `release/x.x` branch. Tag the version from the release branch `git tag vx.x.0`.
8. Push the tag `git push --tags`.
9. Merge the version bump pull request.


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

1. Do an SVN checkout of `https://wordpress.org/plugins/gutenberg/trunk`:
  * If this is your first checkout, run: `svn checkout https://plugins.svn.wordpress.org/gutenberg/trunk`
  * If you already have a copy, run: `svn up`
2. Delete the contents except for the `readme.txt` and `changelog.txt` files (these files don’t exist in the `git` repo, only in Subversion).
3. Extract the contents of the zip file.
4. Edit `readme.txt`, replacing the changelog for the previous version with the current release's changelog.
5. Add the changelog for the current release to `changelog.txt`.
6. Add new files/remove deleted files from the repository:
```bash
# Add new files:
svn st | grep '^\?' | awk '{print $2}' | xargs svn add
# Delete old files:
svn st | grep '^!' | awk '{print $2}' | xargs svn rm
```
7. Commit the new version:
```bash
# Replace X.X.X with your version:
svn ci -m "Committing Gutenberg version X.X.X"
```
8. Tag the new version:
```bash
svn cp https://plugins.svn.wordpress.org/gutenberg/trunk https://plugins.svn.wordpress.org/gutenberg/tags/X.X.X -m "Tagging Gutenberg version X.X.X"
```
9. Edit `readme.txt` to point to the new tag. The **Stable version** header in `readme.txt` should be updated to match the new release version number. After updating and committing that, the new version should be released:
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

The Gutenberg repository mirrors the [WordPress SVN repository](https://make.wordpress.org/core/handbook/about/release-cycle/) in terms of branching for each SVN branch, a corresponding Gutenberg `wp/*` branch is created:

 - The `wp/trunk` branch contains all the packages that are published and used in the `trunk` branch of WordPress.
 - A Gutenberg branch targeting a specific WordPress major release (including its further minor increments) is created (example `wp/5.2`) based on the `wp/trunk` Gutenberg branch when the WordPress `trunk` branch is marked as "feature-freezed". (This usually happens when the first `beta` of the next WordPress major version is released).

### Synchronizing WordPress Trunk

For each Gutenberg plugin release, WordPress trunk should be synchronized with this release. This involves the following steps that are automated with `./bin/commander npm-stable` command:

**Note:** The WordPress `trunk` branch can be closed or in "feature-freeze" mode. Usually, this happens between the first `beta` and the first `RC` of the WordPress release cycle. During this period, the Gutenberg plugin releases should not be synchronized with WordPress Core.

1. Ensure the WordPress `trunk` branch is open for enhancements.
2. Get the last published Gutenberg release branch with `git fetch`.
2. Check out the `wp/trunk` branch.
3. Remove all files from the current branch: `git rm -r .`.
4. Check out all the files from the release branch: `git checkout release/x.x -- .`.
5. Commit all changes to the `wp/trunk` branch with `git commit -m "Merge changes published in the Gutenberg plugin vX.X release"` and push to the repository.
6. Update the `CHANGELOG.md` files of the packages with the new publish version calculated and commit to the `wp/trunk` branch.
Aassuming the package versions are written using this format `major.minor.patch`, make sure to bump at least the `minor` version number. For example, if the CHANGELOG of the package to be released indicates that the next unreleased version is `5.6.1`, choose `5.7.0` as a version in case of `minor` version.

Now, the branch is ready to be used to publish the npm packages.

1. Run the [package release process] but when asked for the version numbers to choose for each package pick values based on the updated CHANGELOG files.
2. Cherry-pick the "Publish" (created by Lerna) and the CHANGELOG update commits into the `master` branch of Gutenberg.

Now, the npm packages should be ready and a patch can be created and committed into WordPress `trunk`.


### Minor WordPress Releases

The following workflow is needed when bug fixes or security releases need to be backported into WordPress Core. This can happen in a few use-cases:

 - During the `beta` and the `RC` period of the WordPress release cycle.
 - For WordPress minor releases and WordPress security releases (example `5.1.1`).

1. Cherry-pick
2. Check out the last published Gutenberg release branch `git checkout release/x.x`
3. Create a Pull Request from this branch targeting the WordPress related major branch (Example `wp/5.2`).
4. Merge the Pull Request using the "Rebase and Merge" button to keep the history of the commits.

Now, the branch is ready to be used to publish the npm packages.

1. Check out the WordPress branch used before (Example `wp/5.2`).
2. Run the [package release process] but when asked for the version numbers to choose for each package, (assuming the package versions are written using this format `major.minor.patch`) make sure to bump only the `patch` version number. For example, if the last published package version for this WordPress branch was `5.6.0`, choose `5.6.1` as a version.

**Note:** For WordPress `5.0` and WordPress `5.1`, a different release process was used. This means that when choosing npm package versions targeting these two releases, you won't be able to use the next `patch` version number as it may have been already used. You should use the "metadata" modifier for these. For example, if the last published package version for this WordPress branch was `5.6.1`, choose `5.6.1+patch.1` as a version.

3. Update the `CHANGELOG.md` files of the published packages with the new released versions and commit to the corresponding branch (Example `wp/5.2`).
4. Cherry-pick the CHANGELOG update commits into the `master` branch of Gutenberg.

Now, the npm packages should be ready and a patch can be created and committed into the corresponding WordPress SVN branch.


### Standalone Package Releases

The following workflow is needed when packages require bug fixes or security releases to be published to _npm_ outside of a WordPress release cycle.

Note: Both the `master` and `wp/trunk` branches are restricted and can only be _pushed_ to by the Gutenberg Core team.

Identify the commit hashes from the pull requests that need to be ported from the repo `master` branch to `wp/trunk`

The `wp/trunk` branch now needs to be prepared to release and publish the packages to _npm_.

Open a terminal and perform the following steps:
1. `git checkout master`
2. `git pull`
3. `git checkout wp/trunk`
4. `git pull`

Before porting commits check that the `wp/trunk` branch does not have any outstanding packages waiting to be published:
1. `git checkout wp/trunk`
2. `npm run publish:check`

Now _cherry-pick_ the commits from `master` to `wp/trunk`, use `-m 1 commithash` if the commit was a pull request merge commit:
1. `git cherry-pick -m 1 cb150a2`
2. `git push`

Whilst waiting for the Travis CI build for  `wp/trunk` [branch to pass](https://travis-ci.com/WordPress/gutenberg/branches) identify and begin updating the `CHANGELOG.md` files:
1. `git checkout wp/trunk`
2. `npm run publish:check`
> Example
> ```shell
> npm run publish:check
> @wordpress/e2e-tests
> @wordpress/jest-preset-default
> @wordpress/scripts
> lerna success found 3 packages ready to publish
> ```

Check the versions listed in the current `CHANGELOG.md` file, looking through the commit history of a package e.g [@wordpress/scripts](https://github.com/WordPress/gutenberg/commits/master/packages/scripts) and look out for _"chore(release): publish"_ and _"Update changelogs"_ commits to determine recent version bumps, then looking at the commits since the most recent release should aid with discovering what changes have occurred since the last release.

Note: You may discover the current version of each package is not up to date, if so updating the previous released versions would be appreciated.

Begin updating the _changelogs_ based on the [Maintaining Changelogs](https://github.com/WordPress/gutenberg/blob/master/packages/README.md#maintaining-changelogs) documentation and commit the changes:

1. `git checkout wp/trunk`
2. Update each of the `CHANGELOG.md` files
3. Stage the _changelog_ changes `git add packages/`
4. `git commit -m "Update changelogs"`
5. Make a note of the commit hash of this commit
> Example
> ```
> [master 278f524f16] Update changelogs` 278f524
> ```
6. `git push`

Now that the changes have been committed to the `wp/trunk` branch and the Travis CI builds for the `wp/trunk` [branch are passing](https://travis-ci.com/WordPress/gutenberg/branches) it's time to publish the packages to npm:
1. Once again run `npm run publish:check` to confirm there are no unexpected packages ready to be published:
> Example
> ```shell
> npm run publish:check
> @wordpress/e2e-tests
> @wordpress/jest-preset-default
> @wordpress/scripts
> lerna success found 3 packages ready to publish
> ```
2. Run the [package release process] but when asked for the version numbers to choose for each package use the versions you made note of above when updating each packages `CHANGELOG.md` file.
> Truncated example of publishing process output
> ```
> npm run publish:prod
>
> Build Progress: [==============================] 100%
> lerna notice cli v3.18.2
> lerna info versioning independent
> ? Select a new version for @wordpress/e2e-tests (currently 1.9.0) Patch (1.9.1)
> ? Select a new version for @wordpress/jest-preset-default (currently 5.3.0) Patch (5.3.1)
> ? Select a new version for @wordpress/scripts (currently 6.1.0) Patch (6.1.1)
>
> Changes:
>  - @wordpress/e2e-tests: 1.9.0 => 1.9.1
>  - @wordpress/jest-preset-default: 5.3.0 => 5.3.1
>  - @wordpress/scripts: 6.1.0 => 6.1.1
>
> ? Are you sure you want to publish these packages? Yes
> lerna info execute Skipping releases
> lerna info git Pushing tags...
> lerna info publish Publishing packages to npm...
> lerna info Verifying npm credentials
> lerna info Checking two-factor auth mode
> ? Enter OTP: 753566
> lerna success published @wordpress/jest-preset-default 5.3.1
> lerna success published @wordpress/scripts 6.1.1
> lerna success published @wordpress/e2e-tests 1.9.1
> Successfully published:
>  - @wordpress/e2e-tests@1.9.1
>  - @wordpress/jest-preset-default@5.3.1
>  - @wordpress/scripts@6.1.1
> lerna success published 3 packages
> ```

Now that the packages have been published the _"chore(release): publish"_ and _"Update changelogs"_ commits to `wp/trunk` need to be ported to the `master` branch:
1. `git checkout master`
2. `git pull`
3. Cherry-pick the `278f524`hash you noted above from the _"Update changelogs"_ commit made to `wp/trunk`
4. `git cherry-pick 278f524`
5. Get the commit hash from the the lerna publish commit either from the terminal or [wp/trunk commits](https://github.com/WordPress/gutenberg/commits/wp/trunk)
6. Cherry-pick the `fe6ae0d` "chore(release): publish"_ commit made to `wp/trunk`
7. `git cherry-pick fe6ae0d`
8. `git push`

Confirm the packages dependancies do not contain `file://` links in the `dependencies` or `devdependencies` section of the packages released, e.g:
> https://unpkg.com/browse/@wordpress/jest-preset-default@5.3.1/package.json
> https://unpkg.com/browse/@wordpress/scripts@6.1.1/package.json
> https://unpkg.com/browse/@wordpress/jest-preset-default@5.3.1/package.json

Time to announce the published changes in the #core-js and #core-editor Slack channels
> ```
> 📣 Successfully published:
> • @wordpress/e2e-tests@1.9.1
> • @wordpress/jest-preset-default@5.3.1
> • @wordpress/scripts@6.1.1
> Lerna success published 3 packages
> ```

---------

Ta-da! 🎉

[plugin repository]: https://plugins.trac.wordpress.org/browser/gutenberg/
[package release process]: https://github.com/WordPress/gutenberg/blob/master/packages/README.md#releasing-packages
