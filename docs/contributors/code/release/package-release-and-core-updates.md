# Packages releases to NPM and WordPress Core updates

The Gutenberg repository follows the [WordPress SVN repository's](https://make.wordpress.org/core/handbook/about/release-cycle/) branching strategy for every major WordPress release. In addition to that, it also contains two other special branches that control npm publishing workflows:

-   The `wp/latest` branch contains the same version of packages as those published to npm with the `latest` distribution tag. The goal here is to have this branch synchronized with the last Gutenberg plugin release, and the only exception would be an unplanned [bugfix release](#standalone-bugfix-package-releases).
-   The `wp/next` branch contains the same version of packages as those published to npm with the `next` distribution tag. It always gets synchronized with the `trunk` branch. Projects should use those packages for development or testing purposes only.
-   A Gutenberg branch `wp/X.Y` (example `wp/6.2`) targeting a specific WordPress major release (including its further minor increments) gets created based on the current Gutenberg plugin release branch `release/X.Y` (example `release/15.1`) shortly after the last release planned for inclusion in the next major WordPress release.

Release types and their schedule:

-   [Synchronizing Gutenberg Plugin](#synchronizing-the-gutenberg-plugin) (`latest` dist tag) – publishing happens automatically every two weeks based on the newly created `release/X.Y` (example `release/12.8`) branch with the RC1 version of the Gutenberg plugin.
-   [WordPress Releases](#wordpress-releases) (`wp-X.Y` dist tag, example `wp-6.2`) – publishing gets triggered on demand from the `wp/X.Y` (example `wp/6.2`) branch. Once we reach the point in the WordPress major release cycle (shortly before Beta 1) where we only cherry-pick commits from the Gutenberg repository to the WordPress core, we use `wp/X.Y` branch (created from `release/X.Y` branch, example `release/15.1`) for npm publishing with the `wp-X.Y` dist-tag. It's also possible to use older branches to backport bug or security fixes to the corresponding older versions of WordPress Core.
-   [Development Releases](#development-releases) (`next` dist tag) – it is also possible to perform development releases at any time when there is a need to test the upcoming changes.

There is also an option to perform [Standalone Bugfix Package Releases](#standalone-bugfix-package-releases) at will. It should be reserved only for critical bug fixes or security releases that must be published to _npm_ outside of regular cycles.

## Synchronizing the Gutenberg plugin

For each Gutenberg plugin release, we also publish to npm an updated version of WordPress packages. This is automated with the [Release Tool](https://github.com/WordPress/gutenberg/blob/trunk/.github/workflows/build-plugin-zip.yml) that handles releases for the Gutenberg plugin. A successful RC1 release triggers the npm publishing job, and this needs to be approved by a Gutenberg Core team member. Locate the ["Build Gutenberg Plugin Zip" workflow](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml) for the new version, and have it [approved](https://docs.github.com/en/actions/how-tos/managing-workflow-runs-and-deployments/managing-deployments/reviewing-deployments#approving-or-rejecting-a-job).

We deliberately update the `wp/latest` branch within the Gutenberg repo with the content from the Gutenberg release `release/X.Y` (example `release/12.7`) branch at the time of the Gutenberg RC1 release. This is done to ensure that the `wp/latest` branch is as close as possible to the latest version of the Gutenberg plugin. It also practically removes the chances of conflicts while backporting to `trunk` commits with updates applied during publishing to `package.json` and `CHANGELOG.md` files. In the past, we had many issues in that aspect when doing npm publishing after the regular Gutenberg release a week later. When publishing the new package versions to npm, we pick at least the `minor` version bump to account for future bugfix or security releases.

Behind the scenes, all steps are automated via `./bin/plugin/cli.js npm-latest` command. For the record, the manual process would look very close to the following steps:

1. Ensure the WordPress `trunk` branch is open for enhancements.
2. Get the last published Gutenberg release branch with `git fetch`.
3. Check out the `wp/latest` branch.
4. Remove all files from the current branch: `git rm -r .`.
5. Check out all the files from the release branch: `git checkout release/x.x -- .`.
6. Commit all changes to the `wp/latest` branch with `git commit -m "Merge changes published in the Gutenberg plugin vX.X release"` and push to the repository.
7. Update the `CHANGELOG.md` files of the packages with the new publish version calculated and commit to the `wp/latest` branch. Assuming the package versions are written using this format `major.minor.patch`, make sure to bump at least the `minor` version bumps gets applied. For example, if the CHANGELOG of the package to be released indicates that the next unreleased version is `5.6.1`, choose `5.7.0` as a version in case of `minor` version. This is important as the patch version numbers should be reserved in case bug fixes are needed for a minor WordPress release (see below).
8. Log-in to npm via the console: `npm login`. Note that you should have 2FA enabled.
9. From the `wp/latest` branch, install npm dependencies with `npm ci`.
10. Run the script `npx lerna publish --no-private`.
    - When asked for the version numbers to choose for each package pick the values of the updated CHANGELOG files.
    - You'll be asked for your One-Time Password (OTP) a couple of times. This is the code from the 2FA authenticator app you use. Depending on how many packages are to be released you may be asked for more than one OTP, as they tend to expire before all packages are released.
    - If the publishing process ends up incomplete (perhaps because it timed-out or a bad OTP was introduced) you can resume it via [`npx lerna publish from-package`](https://lerna.js.org/docs/features/version-and-publish#from-package).
11. Finally, now that the npm packages are published, cherry-pick the commits created by lerna ("Publish" and the CHANGELOG update) into the `trunk` branch of Gutenberg.

## WordPress releases

The following workflow is needed when bug or security fixes need to be backported into WordPress Core. This can happen in a few use-cases:

-   During the `beta` and `RC` periods of the WordPress release cycle when `wp/X.Y` (example `wp/5.7`) branch for the release is already present.
-   For WordPress minor releases and WordPress security releases (example `5.1.1`).

1. Check out the relevant WordPress major branch (If the minor release is `5.2.1`, check out `wp/5.2`).
2. Create a feature branch from that branch, and cherry-pick the merge commits for the needed bug fixes onto it. The cherry-picking process can be automated with the [`npm run other:cherry-pick`](/docs/contributors/code/auto-cherry-picking.md) script.
3. Create a Pull Request from this branch targeting the WordPress major branch used above.
4. Merge the Pull Request using the "Rebase and Merge" button to keep the history of the commits.

Now, the `wp/X.Y` branch is ready for publishing npm packages. In order to start the process, go to Gutenberg's GitHub repository's Actions tab, and locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml). Note the blue banner that says "This workflow has a `workflow_dispatch` event trigger.", and expand the "Run workflow" dropdown on its right hand side.

![Run workflow dropdown for npm publishing](https://developer.wordpress.org/files/2023/07/image-2.png)

To publish packages to npm for the WordPress major release, select `trunk` as the branch to run the workflow from (this means that the script used to run the workflow comes from the trunk branch, though the packages themselves will published from the release branch as long as the correct "Release type" is selected below), then select `wp` from the "Release type" dropdown and enter `X.Y` (example `5.2`) in the "WordPress major release" input field. Finally, press the green "Run workflow" button. It triggers the npm publishing job, and this needs to be approved by a Gutenberg Core team member. Locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml) for the current publishing, and have it [approved](https://docs.github.com/en/actions/how-tos/managing-workflow-runs-and-deployments/managing-deployments/reviewing-deployments#approving-or-rejecting-a-job).

For the record, the manual process would look like the following:

1. Check out the WordPress branch used before (example `wp/5.2`).
2. `git pull`.
3. Run the `npx lerna publish patch --no-private --dist-tag wp-5.2` command (see more in [package release process]) but when asked for the version numbers to choose for each package, (assuming the package versions are written using this format `major.minor.patch`) make sure to bump only the `patch` version number. For example, if the last published package version for this WordPress branch was `5.6.0`, choose `5.6.1` as a version.

**Note:** For WordPress `5.0` and WordPress `5.1`, a different release process was used. This means that when choosing npm package versions targeting these two releases, you won't be able to use the next `patch` version number as it may have been already used. You should use the "metadata" modifier for these. For example, if the last published package version for this WordPress branch was `5.6.1`, choose `5.6.1+patch.1` as a version.

3. Optionally update the `CHANGELOG.md` files of the published packages with the new released versions and commit to the corresponding branch (Example `wp/5.2`).
4. Cherry-pick the CHANGELOG update commits, if any, into the `trunk` branch of Gutenberg.

Now, the npm packages should be ready and a patch can be created and committed into the corresponding WordPress SVN branch.

## Standalone bugfix package releases

The following workflow is needed when packages require bug fixes or security releases to be published to _npm_ outside of a regular release cycle.

Note: Both the `trunk` and `wp/latest` branches are restricted and can only be _pushed_ to by the Gutenberg Core team.

Identify the commit hashes from the pull requests that need to be ported from the repo `trunk` branch to `wp/latest`

The `wp/latest` branch now needs to be prepared to release and publish the packages to _npm_.

Open a terminal and perform the following steps:

1. `git checkout trunk`
2. `git pull`
3. `git checkout wp/latest`
4. `git pull`

Before porting commits check that the `wp/latest` branch does not have any outstanding packages waiting to be published:

1. `git checkout wp/latest`
2. `npx lerna updated`

Now _cherry-pick_ the commits from `trunk` to `wp/latest`, use `-m 1 commithash` if the commit was a pull request merge commit:

1. `git cherry-pick -m 1 cb150a2`
2. `git push`

Whilst waiting for the GitHub actions build for `wp/latest`[branch to pass](https://github.com/WordPress/gutenberg/actions?query=branch%3Awp%2Ftrunk), identify and begin updating the `CHANGELOG.md` files:

1. `git checkout wp/latest`
2. `npx lerna updated`
   Example:
   ```shell
   npx lerna updated
   @wordpress/e2e-tests
   @wordpress/jest-preset-default
   @wordpress/scripts
   lerna success found 3 packages ready to publish
   ```

Check the versions listed in the current `CHANGELOG.md` file, looking through the commit history of a package e.g [@wordpress/scripts](https://github.com/WordPress/gutenberg/commits/HEAD/packages/scripts) and look out for _"chore(release): publish"_ and _"Update changelogs"_ commits to determine recent version bumps, then looking at the commits since the most recent release should aid with discovering what changes have occurred since the last release.

Note: You may discover the current version of each package is not up to date, if so updating the previously released versions would be appreciated.

Now, the `wp/latest` branch is ready for publishing npm packages. In order to start the process, go to Gutenberg's GitHub repository's Actions tab, and locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml). Note the blue banner that says "This workflow has a `workflow_dispatch` event trigger.", and expand the "Run workflow" dropdown on its right hand side.

![Run workflow dropdown for npm publishing](https://developer.wordpress.org/files/2023/07/image-6.png)

To publish packages to npm with bugfixes, select `bugfix` from the "Release type" dropdown and leave empty "WordPress major release" input field. Finally, press the green "Run workflow" button. It triggers the npm publishing job, and this needs to be approved by a Gutenberg Core team member. Locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml) for the current publishing, and have it [approved](https://docs.github.com/en/actions/how-tos/managing-workflow-runs-and-deployments/managing-deployments/reviewing-deployments#approving-or-rejecting-a-job).

Behind the scenes, the rest of the process is automated with `./bin/plugin/cli.js npm-bugfix` command. For the record, the manual process would look very close to the following steps:

1. Check out the `wp/latest` branch.
2. Update the `CHANGELOG.md` files of the packages with the new publish version calculated and commit to the `wp/latest` branch.
3. Log-in to npm via the console: `npm login`. Note that you should have 2FA enabled.
4. From the `wp/latest` branch, install npm dependencies with `npm ci`.
5. Run the script `npx lerna publish --no-private`.
    - When asked for the version numbers to choose for each package pick the values of the updated CHANGELOG files.
    - You'll be asked for your One-Time Password (OTP) a couple of times. This is the code from the 2FA authenticator app you use. Depending on how many packages are to be released you may be asked for more than one OTP, as they tend to expire before all packages are released.
    - If the publishing process ends up incomplete (perhaps because it timed-out or a bad OTP was introduced) you can resume it via [`npx lerna publish from-package`](https://lerna.js.org/docs/features/version-and-publish#from-package).
6. Finally, now that the npm packages are published, cherry-pick the commits created by lerna ("Publish" and the CHANGELOG update) into the `trunk` branch of Gutenberg.

## Development releases

As noted in the [Synchronizing Gutenberg Plugin](#synchronizing-the-gutenberg-plugin) section, packages publishing happens every two weeks from the `wp/latest` branch. It's also possible to use the development release to test the upcoming changes present in the `trunk` branch at any time. We are taking advantage of [package distribution tags](https://docs.npmjs.com/cli/v7/commands/npm-dist-tag) that make it possible to consume the future version of the codebase according to npm guidelines:

> By default, the `latest` tag is used by npm to identify the current version of a package, and `npm install <pkg>` (without any `@<version>` or `@<tag>` specifier) installs the `latest` tag. Typically, projects only use the `latest` tag for stable release versions, and use other tags for unstable versions such as prereleases.

In our case, we use the `next` distribution tag for code. Developers that want to install such a version of the package need to type:

```bash
npm install @wordpress/components@next
```

In order to start the publishing process for development version of npm packages, go to Gutenberg's GitHub repository's Actions tab, and locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml). Note the blue banner that says "This workflow has a `workflow_dispatch` event trigger.", and expand the "Run workflow" dropdown on its right hand side.

![Run workflow dropdown for npm publishing](https://developer.wordpress.org/files/2023/07/image-4.png)

To publish development packages to npm, select `development` from the "Release type" dropdown and leave empty "WordPress major release" input field. Finally, press the green "Run workflow" button. It triggers the npm publishing job, and this needs to be approved by a Gutenberg Core team member. Locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml) for the current publishing, and have it [approved](https://docs.github.com/en/actions/how-tos/managing-workflow-runs-and-deployments/managing-deployments/reviewing-deployments#approving-or-rejecting-a-job).

Behind the scenes, the release process is fully automated via `./bin/plugin/cli.js npm-next` command. It ensures
the `wp/next` branch is synchronized with the latest release branch (`release/X.Y`) created for the Gutenberg plugin. To avoid collisions in the versioning of packages, we always include the newest commit's `sha`, for example, `@wordpress/block-editor@5.2.10-next.645224df70.0`.

[plugin repository]: https://plugins.trac.wordpress.org/browser/gutenberg/
[package release process]: https://github.com/WordPress/gutenberg/blob/HEAD/packages/README.md#releasing-packages
