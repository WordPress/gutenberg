# Gutenberg Release Process

This Repository is used to perform several types of releases. This document serves as a checklist for each one of these. It is helpful if you'd like to understand the different workflows.

To release a stable version of the Gutenberg plugin you need to be part of the [Gutenberg development team](/docs/block-editor/contributors/repository-management/#teams). On top of that, you need approval from a member of the Gutenberg Core team for the final step of the release process (upload to the WordPress.org plugin repo -- see below). If you aren't a member yourself, make sure to contact one ahead of time so they'll be around at the time of the release. You can ping in the [#core-editor Slack channel](https://wordpress.slack.com/messages/C02QB2JS7).

To release Gutenberg's npm packages, you need to be part of the [WordPress organization at npm](https://www.npmjs.com/org/wordpress). 🙂

## Plugin Releases

### Schedule

We release a new major version approximately every two weeks. The current and next versions are [tracked in GitHub milestones](https://github.com/WordPress/gutenberg/milestones), along with each version's tagging date (the day when _the release candidate_ is to be tagged).

-   **On the date of the current milestone**, we publish a release candidate and make it available for plugin authors and users to test. If any regressions are found with a release candidate, a new one can be published. On this date, all remaining PRs on the milestone are moved automatically to the next release. Release candidates should be versioned incrementally, starting with `-rc.1`, then `-rc.2`, and so on. [Preparation of the release post starts here](/docs/block-editor/contributors/code/release/#writing-the-release-notes-and-post) and spans until the final release.

-   **One week after the first release candidate**, the stable version is created based on the last release candidate and any necessary regression fixes. Once the stable version is released, the release post is published, including a [performance audit](/docs/block-editor/contributors/testing-overview/#performance-testing).

If critical bugs are discovered on stable versions of the plugin, patch versions can be released at any time.

### Release Tool

The plugin release process is entirely automated and happens solely on GitHub -- i.e. it doesn't require any steps to be run locally on your machine.

For your convenience, here's an [11-minute video walkthrough](https://youtu.be/TnSgJd3zpJY) that demonstrates the release process. It's recommended to watch this if you're unfamiliar with it. The process is also documented in the following paragraphs.

In order to start the release process, go to Gutenberg's GitHub repository's Actions tab, and locate the ["Build Gutenberg Plugin Zip" action](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml). Note the blue banner that says "This workflow has a `workflow_dispatch` event trigger.", and expand the "Run workflow" dropdown on its right hand side.

![Run workflow dropdown](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/contributors/code/workflow-dispatch-banner.png)

To release a release candidate (RC) version of the plugin, enter `rc`. To release a stable version, enter `stable`. In each case, press the green "Run workflow" button.

This will trigger a GitHub Actions (GHA) workflow that bumps the plugin version, builds the Gutenberg plugin .zip file, creates a release draft, and attaches the plugin .zip file to it. This part of the process typically takes a little under six minutes. You'll see that workflow appear at the top of the list, right under the blue banner. Once it's finished, it'll change its status icon from a yellow dot to a green checkmark. You can follow along in a more detailed view by clicking on the workflow.

As soon as the workflow has finished, you'll find the release draft under https://github.com/WordPress/gutenberg/releases. The draft is pre-populated with changelog entries based on previous release candidates for this version, and any changes that have since been cherry-picked to the release branch. Thus, when releasing the first stable version of a series, make sure to delete any RC version headers (that are only there for your information) and to move the more recent changes to the correct section (see below).

The changelog draft will be at least partially pre-organized (based on GitHub label) into sections and within those into "features". Take some time to read the generated notes and then edit them to ensure legibility and accuracy.

Don't rush this part -- it's important to bring the release notes into a nice shape. You don't have to do it all in one go -- you can save the draft and come back to it later.

When editing the notes, you should be sure to:

1. Delete the `Various` section and move anything under it to a more appropriate section.
2. Move all features under `Uncategorized` bullet points to a more suitable feature.

You can find some more tips on writing the release notes and post in the section below.

Only once you're happy with the shape of the release notes should you press the green "Publish release" button. This will create a `git` tag for the version, publish the release, and trigger [another GHA workflow](https://github.com/WordPress/gutenberg/actions/workflows/upload-release-to-plugin-repo.yml) that has a twofold purpose:

1. Use the release notes that you just edited to update `changelog.txt`, and
2. upload the new plugin version to the WordPress.org plugin repository (SVN) (only if you're releasing a stable version).

The latter step needs approval by a member of the Gutenberg Core team. Locate the ["Upload Gutenberg plugin to WordPress.org plugin repo" workflow](https://github.com/WordPress/gutenberg/actions/workflows/upload-release-to-plugin-repo.yml) for the new version, and have it [approved](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments#approving-or-rejecting-a-job).

This will cause the new version to be available to users of WordPress all over the globe! 💃
You should check that folks can install the new version from their Dashboard.

Once released, all that's left to do is writing a release post on [make.wordpress.org/core](https://make.wordpress.org/core/). You can find some tips on that below.

### Documenting the release with the Release Notes and Post

<div class="callout callout-info">
Documenting the release is a group effort between the release manager, Gutenberg core team developers, and designers , comprised of a series of sequential steps that, because of the amount of people involved and the coordination required, need to adhere to a timeline between the RC and stable releases. The release manager will get pinged by a core member to kick-off and coordinate this process.
</div>

1. Curating the changelog - Wednesday after the RC release to Friday
2. Selecting the release highlights - Friday to Monday
3. Drafting the release post - Monday to Wednesday
4. Running the performance tests - Wednesday right after the stable release
5. Publishing the post - Wednesday after stable release

#### 1. Curating the changelog

The release notes draft is auto-generated by a script that looks for pull requests for the current milestone, and:

1. Groups them into sections (by pull request label).
2. Sub-groups them into "features" within each section (again by pull request label)

This is intended to be a starting point for release notes, and manually reviewing and curating the changelog entries is still required. The release candidate changelog is reused in the stable release and greatly helps select the highlights; because depending on the release it can be a very time-consuming process, **it is recommended to start this process as soon as the milestone is closed** and the release candidate is published.

Guidelines for proof-reading include:

-   Move _all_ entries under the `Various` section to a more appropriate section.
-   Move _all_ features listed under the `Uncategorized` bullet points to a more suitable feature grouping.
-   Fix spelling errors or clarify wording. Phrasing should be easy to understand where the intended audience is those who use the plugin or are keeping up with ongoing development.
-   Create new groupings as applicable, and move pull requests between.
-   When multiple pull requests relate to the same task (such as a follow-up pull request), try to combine them to a single entry.
-   If subtasks of a related set of pull requests are substantial, consider organizing as entries in a nested list.
-   If one or more pull requests revert one or more pull requests in the same release netting a zero-sum of code changes, remove them.
-   Remove all mobile app pull request entries (the only exception to this rule is if the mobile PR also updates functionality for the web).

#### 2. Selecting the release highlights

Once the changelog is cleaned up, the next step is to choose a few changes to highlight in the release post. These highlights usually focus on new features and enhancements, including performance and accessibility ones, but can also include important API changes or critical bug fixes.

Given the big scope of Gutenberg and the high number of pull requests merged in each milestone, it is not uncommon to overlook impactful changes worth highlighting; because of this, this step is a collaborative effort between the release manager, design, and Gutenberg Core team members.

#### 3. Drafting the release post

Because of the nature of the release post content, responsibilities are divided in this step. While the post **can either be drafted by the release manager or delegated to another core member** agreed upon in advance, **visual assets are created by the design team**.

When possible, the highlighted changes in the release post should include an animation (video or GIF) or a static image of them in use. Choosing between an animation or a static image will depend on the best way to showcase each highlight: while animations are better to demonstrate workflows, more direct highlights can be shown with an image; having too many video players adds a layer of friction for users to see the highlight, whereas too many simultaneous animated GIFs can distract and overwhelm the reader.

These visual assets should maintain consistency with previous release posts; using lean, white themes helps in this regard and visually integrate well with the [make.wordpress.org/core](https://make.wordpress.org/core/) blog aesthetics. Including copyrighted material should be avoided, and browser plugins that can be seen in the browser canvas (spell checkers, form fillers, etc.) disabled when capturing the assets.

#### 4. Running the performance tests

The post should also include a performance audit at the end, comparing the current Gutenberg release with both the previous one and the latest WordPress major version. There are GitHub worfklows in place to do this comparison as part of the Continuous Integration setup, so the performance audit results can be found at the workflow run generated by the release commit in the [Performance Tests workflows](https://github.com/WordPress/gutenberg/actions/workflows/performance.yml) page, with the job name `Compare performance with current WordPress Core and previous Gutenberg versions`.

If the GitHub workflow fails, the performance audit can be executed locally using `bin/plugin/cli.js perf` and passing as parameters the tags to run the performance suite against, such as `bin/plugin/cli.js perf release/x.y release/x.z wp/a.b`.

The performance values usually displayed in the release post are:

-   Post Editor Loading Time (test named `load`)
-   KeyPress Event (test named `typing`)

#### 5. Publishing the post

Once the post content is ready, an author already having permissions to post in [make.wordpress.org/core](https://make.wordpress.org/core/) will create a new draft and import the content; this post should be published after the actual release, helping external media to echo and amplify the release news. Remember asking for peer review is encouraged by the [make/core posting guidelines](https://make.wordpress.org/core/handbook/best-practices/post-comment-guidelines/#peer-review)!

### Creating Release Candidate Patches (done via `git cherry-pick`)

If a bug is found in a release candidate and a fix is committed to `trunk`, we should include that fix in the stable version (or optionally in another release candidate before that). To do this you'll need to use `git cherry-pick` to add these changes to the milestone's release branch. This way only the desired fixes are added rather than all the new code that has landed on `trunk` since tagging:

1. Checkout the corresponding release branch with: `git checkout release/x.x`.
2. Cherry-pick fix commits (in chronological order) with `git cherry-pick [SHA]`.
3. When done, push the changes to GitHub: `git push`.

If you decide that the fixes deserve another release candidate before the stable version is published, create one by following the instructions above. Let other contributors know that a new release candidate has been released in the [`#core-editor` channel](https://wordpress.slack.com/messages/C02QB2JS7).

### Creating Point Releases

Occasionally it's necessary to create a point release (i.e. X.Y._Z_) of the Plugin. This is most commonly to push fixes for regressions and/or bugs.

As you proceed with the following process, it's worth bearing in mind that such point releases are not created as branches in their own right (e.g. `release/12.5.0`) but are simply [tags](https://github.com/WordPress/gutenberg/releases/tag/v12.5.1).

The method for point releases is nearly identical to the main Plugin release process (see above) but has some notable exceptions. Please make sure to read _the whole_ of this guide before proceeding.

#### Updating the release branch

The point release should only contain the _specific commits_ required. To do this you should checkout the previous _minor_ stable (i.e. non-RC) release branch (e.g. `release/12.5`) locally and then cherry pick any commits that you require into that branch.

**Important**: you must assign the correct Milestone to each PR using the Github GUI. If the Milestone is closed then you will need to re-open it.

Once you have the stable release branch in order you can _push it to Github_ and continue with the release process using the Github website GUI.

#### Running the point release

![Run workflow dropdown](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/contributors/code/workflow-dispatch-banner.png)

Go to Gutenberg's GitHub repository's Actions tab, and locate the ["Build Gutenberg Plugin Zip" action](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml). You should now _carefully_ choose the next action based on information about the current Plugin release version:

_If_ the previous release version was **stable** (`X.Y.Z` - e.g. `12.5.0`, `12.5.1` .etc) leave the the `Use workflow from` field as `trunk` and then specify `stable` in the text input field. The workflow will automatically create a point release, with z incremented (`x.y.(z+1)`) as required.

_If_ however, the previous release was an **RC** (e.g. `X.Y.0-rc.1`) you will need to _manually_ select the _stable version's release branch_ (e.g. `12.5.0`) when creating the release. Failure to do this will cause the workflow to release the next major _stable_ version (e.g. `12.6.0`) which is not what you want.

To do this, when running the Workflow, select the appropriate `release/` branch from the `Use workflow from` dropdown (e.g. `release/12.5`) and specify `stable` in the text input field.

Please note you **cannot create point releases for previous stable releases once a more recent stable release has been published** as this would require significant changes to how we upload plugin versions to the WP.org plugin SVN repo). Always check the latest release version before you proceed (see [this Issue](https://github.com/WordPress/gutenberg/issues/33277#issuecomment-876289457) for more information).

#### Troubleshooting

> The release draft was created but it was empty/contained an error message

If you forget to assign the correct Milestone to your cherry picked PR then the release tool may error or your changelog may be empty.

In this case, edit the release notes manually copying the format from a previous release.

> The draft release only contains 1 asset file. Other releases have x3.

This is expected. The draft release will contain only the plugin zip. Only once the release is published will the remaining assets be generated and added to the release.

> Do I need to publish point releases to WordPress.org?

Yes. The method for this is identical to the main Plugin release process. You will need a Gutenberg Core team member to approve the release workflow.

## Packages Releases to npm and WordPress Core Updates

The Gutenberg repository mirrors the [WordPress SVN repository](https://make.wordpress.org/core/handbook/about/release-cycle/) in terms of branching for each SVN branch, a corresponding Gutenberg `wp/*` branch is created:

-   The `wp/trunk` branch contains the same version of packages published to npm with the `latest` distribution tag. The WordPress core consumes those packages directly in the `trunk` branch and uses them for public releases.
-   The `wp/next` branch contains the same version of packages published to npm with the `next` distribution tag. Projects should use those packages for development purposes only.
-   A Gutenberg branch targeting a specific WordPress major release (including its further minor increments) is created (example `wp/5.2`) based on the `wp/trunk` Gutenberg branch when the corresponding WordPress release branch is created. (This usually happens when the first `RC` of the next WordPress major version is released).

Release types and their schedule:

-   [Synchronizing WordPress Trunk](#synchronizing-wordpress-trunk) (`latest` dist tag) – when there is no "feature-freeze" mode in WordPress Core, publishing happens every two weeks based on the newly created RC1 version of the Gutenberg plugin. Otherwise, only bug fixes get manually included and published to npm before every next beta and RC version of the following WordPress release.
-   [Minor WordPress Releases](#minor-wordpress-releases) (`patch` dist tag) – only when bug fixes or security releases need to be backported into WordPress Core.
-   [Development Releases](#development-releases) (`next` dist tag) – when there is a "feature-freeze" mode in WordPress Core, publishing can still happen every two weeks based on the new RC1 version of the Gutenberg plugin. It is also possible to perform development releases at any time when there is a need to test the upcoming changes.

There is also an option to perform [Standalone Bugfix Package Releases](#standalone-bugfix-package-releases) at will. It should be reserved only for critical bug fixes or security releases that must be published to _npm_ outside of a regular WordPress release cycle.

### Synchronizing WordPress Trunk

For each Gutenberg plugin release, WordPress trunk should be synchronized.

Note that the WordPress `trunk` branch can be closed or in "feature-freeze" mode. Usually, feature freeze in WordPress Core happens about 2 weeks before Beta 1 and remains in effect until RC1 when the `trunk` gets branched. During this period, the Gutenberg plugin releases should not be synchronized with WordPress Core.

A different person usually synchronizes the WordPress `trunk` branch and publishes the npm packages. Therefore, you typically shouldn't need to worry about handling this for the normal plugin release process. However, if you are still unsure, ask in [the #core-editor Slack channel](https://wordpress.slack.com/archives/C02QB2JS7).

The process has three steps: 1) update the `wp/trunk` branch within the Gutenberg repo 2) publish the new package versions to npm 3) update the WordPress `trunk` branch.

The first step is automated via `./bin/plugin/cli.js npm-latest` command. You only have to run the command, but, for the record, the manual process would look very close to the following steps:

1. Ensure the WordPress `trunk` branch is open for enhancements.
2. Get the last published Gutenberg release branch with `git fetch`.
3. Check out the `wp/trunk` branch.
4. Remove all files from the current branch: `git rm -r .`.
5. Check out all the files from the release branch: `git checkout release/x.x -- .`.
6. Commit all changes to the `wp/trunk` branch with `git commit -m "Merge changes published in the Gutenberg plugin vX.X release"` and push to the repository.
7. Update the `CHANGELOG.md` files of the packages with the new publish version calculated and commit to the `wp/trunk` branch. Assuming the package versions are written using this format `major.minor.patch`, make sure to bump at least the `minor` version number after every major WordPress release. For example, if the CHANGELOG of the package to be released indicates that the next unreleased version is `5.6.1`, choose `5.7.0` as a version in case of `minor` version. This is important as the patch version numbers should be reserved in case bug fixes are needed for a minor WordPress release (see below).
8. Log-in to npm via the console: `npm login`. Note that you should have 2FA enabled.
9. From the `wp/trunk` branch, install npm dependencies with `npm ci`.
10. Run the script `npm run publish:latest`.
    - When asked for the version numbers to choose for each package pick the values of the updated CHANGELOG files.
    - You'll be asked for your One-Time Password (OTP) a couple of times. This is the code from the 2FA authenticator app you use. Depending on how many packages are to be released you may be asked for more than one OTP, as they tend to expire before all packages are released.
    - If the publishing process ends up incomplete (perhaps because it timed-out or an bad OTP was introduce) you can resume it via [`lerna publish from-package`](https://github.com/lerna/lerna/tree/HEAD/commands/publish#bump-from-package).

Finally, now that the npm packages are ready, a patch can be created and committed into WordPress `trunk`. You should also cherry-pick the commits created by lerna ("Publish" and the CHANGELOG update) into the `trunk` branch of Gutenberg.

### Minor WordPress Releases

The following workflow is needed when bug fixes or security releases need to be backported into WordPress Core. This can happen in a few use-cases:

-   During the `RC` period of the WordPress release cycle when `wp/X.Y` (example `wp/5.7`) branch for the release is already present.
-   For WordPress minor releases and WordPress security releases (example `5.1.1`).

1. Check out the relevant WordPress major branch (If the minor release is 5.2.1, check out `wp/5.2`).
2. Create a feature branch from that branch, and cherry-pick the merge commits for the needed bug fixes onto it.
3. Create a Pull Request from this branch targeting the WordPress major branch used above.
4. Merge the Pull Request using the "Rebase and Merge" button to keep the history of the commits.

Now, the branch is ready to be used to publish the npm packages.

1. Check out the WordPress branch used before (Example `wp/5.2`).
2. `git pull`.
3. Run the `npm run publish:patch` command (see more in [package release process]) but when asked for the version numbers to choose for each package, (assuming the package versions are written using this format `major.minor.patch`) make sure to bump only the `patch` version number. For example, if the last published package version for this WordPress branch was `5.6.0`, choose `5.6.1` as a version.

**Note:** For WordPress `5.0` and WordPress `5.1`, a different release process was used. This means that when choosing npm package versions targeting these two releases, you won't be able to use the next `patch` version number as it may have been already used. You should use the "metadata" modifier for these. For example, if the last published package version for this WordPress branch was `5.6.1`, choose `5.6.1+patch.1` as a version.

3. Optionally update the `CHANGELOG.md` files of the published packages with the new released versions and commit to the corresponding branch (Example `wp/5.2`).
4. Cherry-pick the CHANGELOG update commits, if any, into the `trunk` branch of Gutenberg.

Now, the npm packages should be ready and a patch can be created and committed into the corresponding WordPress SVN branch.

### Standalone Bugfix Package Releases

The following workflow is needed when packages require bug fixes or security releases to be published to _npm_ outside of a regular WordPress release cycle.

Note: Both the `trunk` and `wp/trunk` branches are restricted and can only be _pushed_ to by the Gutenberg Core team.

Identify the commit hashes from the pull requests that need to be ported from the repo `trunk` branch to `wp/trunk`

The `wp/trunk` branch now needs to be prepared to release and publish the packages to _npm_.

Open a terminal and perform the following steps:

1. `git checkout trunk`
2. `git pull`
3. `git checkout wp/trunk`
4. `git pull`

Before porting commits check that the `wp/trunk` branch does not have any outstanding packages waiting to be published:

1. `git checkout wp/trunk`
2. `npm run publish:check`

Now _cherry-pick_ the commits from `trunk` to `wp/trunk`, use `-m 1 commithash` if the commit was a pull request merge commit:

1. `git cherry-pick -m 1 cb150a2`
2. `git push`

Whilst waiting for the GitHub actions build for `wp/trunk`[branch to pass](https://github.com/WordPress/gutenberg/actions?query=branch%3Awp%2Ftrunk), identify and begin updating the `CHANGELOG.md` files:

1. `git checkout wp/trunk`
2. `npm run publish:check`
    > Example
    >
    > ```shell
    > npm run publish:check
    > @wordpress/e2e-tests
    > @wordpress/jest-preset-default
    > @wordpress/scripts
    > lerna success found 3 packages ready to publish
    > ```

Check the versions listed in the current `CHANGELOG.md` file, looking through the commit history of a package e.g [@wordpress/scripts](https://github.com/WordPress/gutenberg/commits/HEAD/packages/scripts) and look out for _"chore(release): publish"_ and _"Update changelogs"_ commits to determine recent version bumps, then looking at the commits since the most recent release should aid with discovering what changes have occurred since the last release.

Note: You may discover the current version of each package is not up to date, if so updating the previously released versions would be appreciated.

The good news is that the rest of the process is automated with `./bin/plugin/cli.js npm-bugfix` command. The rest of the section covers all the necessary steps for publishing the packages if you prefer to do it manually.

Begin updating the _changelogs_ based on the [Maintaining Changelogs](https://github.com/WordPress/gutenberg/blob/HEAD/packages/README.md#maintaining-changelogs) documentation and commit the changes:

1. `git checkout wp/trunk`
2. Update each of the `CHANGELOG.md` files
3. Stage the _changelog_ changes `git add packages/`
4. `git commit -m "Update changelogs"`
5. Make a note of the commit hash of this commit
    > Example
    >
    > ```
    > [trunk 278f524f16] Update changelogs` 278f524
    > ```
6. `git push`

Now that the changes have been committed to the `wp/trunk` branch and the Travis CI builds for the `wp/trunk` [branch are passing](https://travis-ci.com/WordPress/gutenberg/branches) it's time to publish the packages to npm:

1. Once again run `npm run publish:check` to confirm there are no unexpected packages ready to be published:
    > Example
    >
    > ```shell
    > npm run publish:check
    > @wordpress/e2e-tests
    > @wordpress/jest-preset-default
    > @wordpress/scripts
    > lerna success found 3 packages ready to publish
    > ```
2. Run the `npm run publish:latest` command (see more in [package release process]) but when asked for the version numbers to choose for each package use the versions you made note of above when updating each packages `CHANGELOG.md` file.
    > Truncated example of publishing process output
    >
    > ```
    > npm run publish:latest
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

Now that the packages have been published the _"chore(release): publish"_ and _"Update changelogs"_ commits to `wp/trunk` need to be ported to the `trunk` branch:

1. `git checkout trunk`
2. `git pull`
3. Cherry-pick the `278f524`hash you noted above from the _"Update changelogs"_ commit made to `wp/trunk`
4. `git cherry-pick 278f524`
5. Get the commit hash from the lerna publish commit either from the terminal or [wp/trunk commits](https://github.com/WordPress/gutenberg/commits/wp/trunk)
6. Cherry-pick the `fe6ae0d` "chore(release): publish"\_ commit made to `wp/trunk`
7. `git cherry-pick fe6ae0d`
8. `git push`

Confirm the packages dependencies do not contain `file://` links in the `dependencies` or `devdependencies` section of the packages released, e.g:

> https://unpkg.com/browse/@wordpress/jest-preset-default@5.3.1/package.json > https://unpkg.com/browse/@wordpress/scripts@6.1.1/package.json > https://unpkg.com/browse/@wordpress/jest-preset-default@5.3.1/package.json

Time to announce the published changes in the #core-js and #core-editor Slack channels

> ```
> 📣 Successfully published:
> • @wordpress/e2e-tests@1.9.1
> • @wordpress/jest-preset-default@5.3.1
> • @wordpress/scripts@6.1.1
> Lerna success published 3 packages
> ```

---

Ta-da! 🎉

### Development Releases

As noted in the [Synchronizing WordPress Trunk](#synchronizing-wordpress-trunk) section, the WordPress trunk branch can be closed or in "feature-freeze" mode. Usually, this happens during the WordPress ongoing release cycle, which takes several weeks. It means that packages don't get any enhancements and new features during the ongoing WordPress major release process. Another type of release is available to address the limitation mentioned earlier and unblock ongoing development for projects that depend on WordPress packages. We are taking advantage of [package distribution tags](https://docs.npmjs.com/cli/v7/commands/npm-dist-tag) that make it possible to consume the future version of the codebase according to npm guidelines:

> By default, the `latest` tag is used by npm to identify the current version of a package, and `npm install <pkg>` (without any `@<version>` or `@<tag>` specifier) installs the `latest` tag. Typically, projects only use the `latest` tag for stable release versions, and use other tags for unstable versions such as prereleases.

In our case, we use the `next` distribution tag for code. Developers that want to install such a version of the package need to type:

```bash
npm install @wordpress/components@next
```

The release process is fully automated via `./bin/plugin/cli.js npm-next` command. You only have to run the script, and everything else happens through interactions in the terminal.

Behind the scenes, the `wp/next` branch is synchronized with the latest release branch (`release/*`) created for the Gutenberg plugin. To avoid collisions in the versioning of packages, we always include the newest commit's `sha`, for example, `@wordpress/block-editor@5.2.10-next.645224df70.0`.

[plugin repository]: https://plugins.trac.wordpress.org/browser/gutenberg/
[package release process]: https://github.com/WordPress/gutenberg/blob/HEAD/packages/README.md#releasing-packages
