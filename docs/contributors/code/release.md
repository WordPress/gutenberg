# Gutenberg Release Process

This Repository is used to perform several types of releases. This document serves as a checklist for each one of these. It is helpful if you'd like to understand the different workflows.

To release a stable version of the Gutenberg plugin you need:
- To be part of the [Gutenberg development team](/docs/block-editor/contributors/repository-management/#teams), to launch the GitHub actions related to the release process and to potentially backport PRs to the release branch.
- Write permissions in [make.wordpress.org/core](make.wordpress.org/core), to draft the release post.
- On top of that, for the last step of the process (uploading the new version to the WordPress.org.plugin directory), you will need approval from a member of the Gutenberg Core team -- see below for more details).

To [release WordPress's npm packages](#packages-releases-to-npm-and-wordpress-core-updates), similar requirements apply.

## Plugin Releases

### Schedule

We release a new major version approximately every two weeks. The current and next versions are [tracked in GitHub milestones](https://github.com/WordPress/gutenberg/milestones), along with each version's tagging date (the day when _the release candidate_ is to be tagged).

-   **On the date of the current milestone**, we publish a release candidate and make it available for plugin authors and users to test. If any regressions are found with a release candidate, a new one can be published. On this date, all remaining PRs on the milestone are moved automatically to the next release. Release candidates should be versioned incrementally, starting with `-rc.1`, then `-rc.2`, and so on. [Preparation of the release post starts here](/docs/block-editor/contributors/code/release/#writing-the-release-notes-and-post) and spans until the final release.

-   **One week after the first release candidate**, the stable version is created based on the last release candidate and any necessary regression fixes. Once the stable version is released and the release post is published.  

If critical bugs are discovered on stable versions of the plugin, patch versions can be released at any time.

### Release Tool

The plugin release process is entirely automated and happens solely on GitHub -- i.e. it doesn't require any steps to be run locally on your machine.

For your convenience, here's an [11-minute video walkthrough](https://youtu.be/TnSgJd3zpJY) that demonstrates the release process. It's recommended to watch this if you're unfamiliar with it. The process is also documented in the following paragraphs.

#### Running workflow

In order to start the release process, go to Gutenberg's GitHub repository's Actions tab, and locate the ["Build Gutenberg Plugin Zip" action](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml). Note the blue banner that says "This workflow has a `workflow_dispatch` event trigger.", and expand the "Run workflow" dropdown on its right hand side.

![Run workflow dropdown for the plugin release](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/contributors/code/workflow-dispatch-plugin-banner.png)

To release a release candidate (RC) version of the plugin, enter `rc`. To release a stable version, enter `stable`. In each case, press the green "Run workflow" button.

This will trigger a GitHub Actions (GHA) workflow that bumps the plugin version, builds the Gutenberg plugin .zip file, creates a release draft, and attaches the plugin .zip file to it. This part of the process typically takes a little under six minutes. You'll see that workflow appear at the top of the list, right under the blue banner. Once it's finished, it'll change its status icon from a yellow dot to a green checkmark. You can follow along in a more detailed view by clicking on the workflow.

#### Publishing the @wordpress packages to NPM

As part of the release candidate (RC) process, all of the `@wordpress` packages are published to NPM. You may see messaging after the ["Build Gutenberg Plugin Zip" action](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml) action has created the draft release that the ["Publish npm packages"](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml) action requires someone with appropriate permissions to trigger the action.

This message is misleading and no action is required by the release coordinator. The process is automated and it will automatically run after the release notes are published.

#### View the release draft

As soon as the workflow has finished, you'll find the release draft under [Gutenberg Releases](https://github.com/WordPress/gutenberg/releases). The draft is pre-populated with changelog entries based on previous release candidates for this version and any changes that have since been cherry-picked to the release branch. Thus, when releasing the first stable version of a series, delete any RC version headers (that are only there for your information) and move the more recent changes to the correct section (see below).

The changelog draft will be partially pre-organized (based on GitHub labels) into sections and, within those, into “features.” Take some time to read the generated notes and then edit them to ensure legibility and accuracy.

Don't rush this part. It's important to ensure the release notes are as organized as possible, and it doesn't need to be completed in one go. You can save the draft and come back to it later.

When editing the notes, you should be sure to:

1. Delete the `Various` section and move anything under it to a more appropriate section.
2. Move all features under `Uncategorized` bullet points to a more suitable feature.

You can find some more tips on writing the release notes and post in the section below.

#### Creating Release Candidate Patches

At any point after the release candidate has been published but before the final stable release, some bugs related to this release might be fixed and committed to `trunk`. These fixes won't automatically be incorporated into the final stable release, including them is a manual process.

There are a couple of ways a release coordinator might be made aware of these bugs:

- Contributors may add the `Backport to Gutenberg RC` label to a closed PR. [Do a search for any of these PRs](https://github.com/WordPress/gutenberg/pulls?q=is%3Apr+label%3A%22Backport+to+Gutenberg+RC%22+is%3Aclosed) before publishing the final release.
- You may receive a direct message or a ping in the #core-editor channel in slack notifying you of PRs that need to be included in the release candidate. Even when this is the case, the `Backport to Gutenberg RC` should be added to the PR.

The cherry-picking process is handled as follows:

1. Checkout the corresponding release branch with: `git checkout release/x.x`.
2. Cherry-pick fix commits (in chronological order) with `git cherry-pick [SHA]`. The cherry-picking process can be automated with the [`npm run cherry-pick` script](/docs/contributors/code/auto-cherry-picking.md), but make sure to use the `Backport to Gutenberg RC` label when running the command.
3. When done, push the changes to GitHub: `git push`.

<div class="callout callout-tip">
To find the `[SHA]` for a pull request, open the PR and near the end you'll see a message "[Username] merged commit [SHA] into `trunk`".
</div>

Once the commits have been cherry-picked, remove the `Backport to Gutenberg RC` label and update the milestone to the current release for all cherry-picked PRs.

If you decide that the fixes deserve another release candidate before the stable version is published, create one by following the instructions above. Let other contributors know that a new release candidate has been released in the [`#core-editor`](https://wordpress.slack.com/messages/C02QB2JS7) Slack channel.

#### Publishing the release

Only once you're happy with the shape of the release notes, press the green "Publish release" button. This will create a `git` tag for the version, publish the release, and trigger [another GHA workflow](https://github.com/WordPress/gutenberg/actions/workflows/upload-release-to-plugin-repo.yml) with a twofold purpose:

1. Use the release notes that you just edited to update `changelog.txt`, and
2. Upload the new plugin version to the WordPress.org plugin repository (SVN) (only if you're releasing a stable version).

The last step needs approval by a member of either the Gutenberg Core team, WordPress core team, or Gutenberg Release team. These teams get a notification email when the release is ready to be approved, but if time is of the essence you can ask in the [#core-editor Slack channel] or ping the [Gutenberg Release team]([url](https://github.com/orgs/WordPress/teams/gutenberg-release)) to speed up the process; reaching out _before_ launching the release process so that somebody is ready to approve is recommended. Locate the ["Upload Gutenberg plugin to WordPress.org plugin repo" workflow](https://github.com/WordPress/gutenberg/actions/workflows/upload-release-to-plugin-repo.yml) for the new version, and have it [approved](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments#approving-or-rejecting-a-job).

Once approved, the new Gutenberg version will be available to WordPress users all over the globe. You should check that folks can install the latest version from their WordPress Dashboard.

Once released, all that's left to do is writing a release post on [make.wordpress.org/core](https://make.wordpress.org/core/). You can find some tips on that below.

### Documenting the release with the Release Notes and Post

<div class="callout callout-info">
Documenting the release is a group effort between the release manager, Gutenberg core team developers, and designers , comprised of a series of sequential steps that, because of the amount of people involved and the coordination required, need to adhere to a timeline between the RC and stable releases. The release manager will get pinged by a core member to kick-off and coordinate this process.
</div>

1. Curating the changelog - Wednesday after the RC release to Friday
2. Selecting the release highlights - Friday to Monday
3. Drafting the release post - Monday to Wednesday
4. Publishing the post - Wednesday after stable release

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

#### 5. Publishing the post

Once the post content is ready, an author already having permissions to post in [make.wordpress.org/core](https://make.wordpress.org/core/) will create a new draft and import the content; this post should be published after the actual release, helping external media to echo and amplify the release news. Remember asking for peer review is encouraged by the [make/core posting guidelines](https://make.wordpress.org/core/handbook/best-practices/post-comment-guidelines/#peer-review)!

### Creating Minor Releases

Occasionally it's necessary to create a minor release (i.e. X.Y.**Z**) of the Plugin. This is usually done to expedite fixes for bad regressions or bugs. The `Backport to Gutenberg Minor Release` is usually used to identify PRs that need to be included in a minor release, but as release coordinator you may also be notified more informally through slack. Even so, it's good to ensure all relevant PRs have the correct label.

As you proceed with the following process, it's worth bearing in mind that such minor releases are not created as branches in their own right (e.g. `release/12.5.0`) but are simply [tags](https://github.com/WordPress/gutenberg/releases/tag/v12.5.1).

The method for minor releases is nearly identical to the main Plugin release process (see above) but has some notable exceptions. Please make sure to read _the entire_ guide before proceeding.

#### Updating the release branch

The minor release should only contain the _specific commits_ required. To do this you should checkout the previous _major_ stable (i.e. non-RC) release branch (e.g. `release/12.5`) locally and then cherry pick any commits that you require into that branch.

<div class="callout callout-alert">
If an RC already exists for a new version, you _need_ to cherry-pick the same commits in the respective release branch, as they will not be included automatically. E.g.: If you're about to release a new minor release for 12.5 and just cherry-picked into `release/12.5`, but 12.6.0-rc.1 is already out, then you need to cherry-pick the same commits into the `release/12.6` branch, or they won't be included in subsequent releases for 12.6! Usually it's best to coordinate this process with the release coordinator for the next release.
</div>

The cherry-picking process can be automated with the [`npm run cherry-pick`](/docs/contributors/code/auto-cherry-picking.md) script, but be sure to use the `Backport to Gutenberg Minor Release` label when running the script.

You must also ensure that all PRs being included are assigned to the Github Milestone on which the minor release is based. Bear in mind, that when PRs are _merged_ they are automatically assigned a milestone for the next _stable_ release. Therefore you will need to go back through each PR in Github and re-assign the Milestone.

For example, if you are releasing version `12.5.4`, then all PRs picked for that release must be unassigned from the `12.6` Milestone and instead assigned to the `12.5` Milestone.

Once cherry picking is complete, you can also remove the `Backport to Gutenberg Minor Release` label from the PRs.

Once you have the stable release branch in order and the correct Milestone assigned to your PRs you can _push the branch to Github_ and continue with the release process using the Github website GUI.

#### Running the minor release

![Run workflow dropdown for the plugin release](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/contributors/code/workflow-dispatch-plugin-banner.png)

Go to Gutenberg's GitHub repository's Actions tab, and locate the ["Build Gutenberg Plugin Zip" action](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml). You should now _carefully_ choose the next action based on information about the current Plugin release version:

_If_ the previous release version was **stable** (`X.Y.Z` - e.g. `12.5.0`, `12.5.1` .etc) leave the `Use workflow from` field as `trunk` and then specify `stable` in the text input field. The workflow will automatically create a minor release, with z incremented (`x.y.(z+1)`) as required.

_If_ however, the previous release was an **RC** (e.g. `X.Y.0-rc.1`) you will need to _manually_ select the _stable version's release branch_ (e.g. `12.5.0`) when creating the release. Failure to do this will cause the workflow to release the next major _stable_ version (e.g. `12.6.0`) which is not what you want.

To do this, when running the Workflow, select the appropriate `release/` branch from the `Use workflow from` dropdown (e.g. `release/12.5`) and specify `stable` in the text input field.

Please note you **cannot create minor releases for previous stable releases once a more recent stable release has been published** as this would require significant changes to how we upload plugin versions to the WP.org plugin SVN repo). Always check the latest release version before you proceed (see [this Issue](https://github.com/WordPress/gutenberg/issues/33277#issuecomment-876289457) for more information).

#### Troubleshooting

> The release draft was created but it was empty/contained an error message

If you forget to assign the correct Milestone to your cherry picked PR(s) then the changelog may not be generated as you would expect.

It is important to always manually verify that the PRs shown in the changelog match up with those cherry picked to the release branch.

Moreover, if the release includes only a single PR, then failing to assign the PR to the correct Milestone will cause an error to be displayed when generating the changelog. In this case you can edit the release notes to include details of the missing PR (manually copying the format from a previous release).

If for any reason the Milestone has been closed, you may reopen it for the purposes of the release.

> The draft release only contains 1 asset file. Other releases have x3.

This is expected. The draft release will contain only the plugin zip. Only once the release is published will the remaining assets be generated and added to the release.

> Do I need to publish point releases to WordPress.org?

Yes. The method for this is identical to the main Plugin release process. You will need a member of the Gutenberg Core team the Gutenberg Release team to approve the release workflow.

> The release process failed to cherry-pick version bump commit to the trunk branch.

First, confirm that the step failed by checking the latest commits on `trunk` do not include the version bump commit. Then revert the version bump commit on the release branch - `git revert --no-edit {commitHash}`. Finally, push the changes and start the release process again.

## Packages Releases to npm and WordPress Core Updates

The Gutenberg repository follows the [WordPress SVN repository's](https://make.wordpress.org/core/handbook/about/release-cycle/) branching strategy for every major WordPress release. In addition to that, it also contains two other special branches that control npm publishing workflows:

-   The `wp/latest` branch contains the same version of packages as those published to npm with the `latest` distribution tag. The goal here is to have this branch synchronized with the last Gutenberg plugin release, and the only exception would be an unplanned [bugfix release](#standalone-bugfix-package-releases).
-   The `wp/next` branch contains the same version of packages as those published to npm with the `next` distribution tag. It always gets synchronized with the `trunk` branch. Projects should use those packages for development or testing purposes only.
-   A Gutenberg branch `wp/X.Y` (example `wp/6.2`) targeting a specific WordPress major release (including its further minor increments) gets created based on the current Gutenberg plugin release branch `release/X.Y` (example `release/15.1`) shortly after the last release planned for inclusion in the next major WordPress release.

Release types and their schedule:

-   [Synchronizing Gutenberg Plugin](#synchronizing-gutenberg-plugin) (`latest` dist tag) – publishing happens automatically every two weeks based on the newly created `release/X.Y` (example `release/12.8`) branch with the RC1 version of the Gutenberg plugin.
-   [WordPress Releases](#wordpress-releases) (`wp-X.Y` dist tag, example `wp-6.2`) – publishing gets triggered on demand from the `wp/X.Y` (example `wp/6.2`) branch. Once we reach the point in the WordPress major release cycle (shortly before Beta 1) where we only cherry-pick commits from the Gutenberg repository to the WordPress core, we use `wp/X.Y` branch (created from `release/X.Y` branch, example `release/15.1`) for npm publishing with the `wp-X.Y` dist-tag. It's also possible to use older branches to backport bug or security fixes to the corresponding older versions of WordPress Core.
-   [Development Releases](#development-releases) (`next` dist tag) – it is also possible to perform development releases at any time when there is a need to test the upcoming changes.

There is also an option to perform [Standalone Bugfix Package Releases](#standalone-bugfix-package-releases) at will. It should be reserved only for critical bug fixes or security releases that must be published to _npm_ outside of regular cycles.

### Synchronizing Gutenberg Plugin

For each Gutenberg plugin release, we also publish to npm an updated version of WordPress packages. This is automated with the [Release Tool](#release-tool) that handles releases for the Gutenberg plugin. A successful RC1 release triggers the npm publishing job, and this needs to be approved by a Gutenberg Core team member. Locate the ["Build Gutenberg Plugin Zip" workflow](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml) for the new version, and have it [approved](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments#approving-or-rejecting-a-job).

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
10. Run the script `npm run publish:latest`.
    - When asked for the version numbers to choose for each package pick the values of the updated CHANGELOG files.
    - You'll be asked for your One-Time Password (OTP) a couple of times. This is the code from the 2FA authenticator app you use. Depending on how many packages are to be released you may be asked for more than one OTP, as they tend to expire before all packages are released.
    - If the publishing process ends up incomplete (perhaps because it timed-out or an bad OTP was introduce) you can resume it via [`lerna publish from-package`](https://github.com/lerna/lerna/tree/HEAD/commands/publish#bump-from-package).
11. Finally, now that the npm packages are published, cherry-pick the commits created by lerna ("Publish" and the CHANGELOG update) into the `trunk` branch of Gutenberg.

### WordPress Releases

The following workflow is needed when bug or security fixes need to be backported into WordPress Core. This can happen in a few use-cases:

-   During the `beta` and `RC` periods of the WordPress release cycle when `wp/X.Y` (example `wp/5.7`) branch for the release is already present.
-   For WordPress minor releases and WordPress security releases (example `5.1.1`).

1. Check out the relevant WordPress major branch (If the minor release is 5.2.1, check out `wp/5.2`).
2. Create a feature branch from that branch, and cherry-pick the merge commits for the needed bug fixes onto it. The cherry-picking process can be automated with the [`npm run other:cherry-pick` script](/docs/contributors/code/auto-cherry-picking.md).
3. Create a Pull Request from this branch targeting the WordPress major branch used above.
4. Merge the Pull Request using the "Rebase and Merge" button to keep the history of the commits.

Now, the `wp/X.Y` branch is ready for publishing npm packages. In order to start the process, go to Gutenberg's GitHub repository's Actions tab, and locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml). Note the blue banner that says "This workflow has a `workflow_dispatch` event trigger.", and expand the "Run workflow" dropdown on its right hand side.

![Run workflow dropdown for npm publishing](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/contributors/code/workflow-dispatch-npm-banner.png)

To publish packages to npm for the WordPress major release, select `wp` from the "Release type" dropdown and enter `X.Y` (example `5.2`) in the "WordPress major release" input field. Finally, press the green "Run workflow" button. It triggers the npm publishing job, and this needs to be approved by a Gutenberg Core team member. Locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml) for the current publishing, and have it [approved](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments#approving-or-rejecting-a-job).

For the record, the manual process would look like the following:

1. Check out the WordPress branch used before (example `wp/5.2`).
2. `git pull`.
3. Run the `npm run publish:patch` command (see more in [package release process]) but when asked for the version numbers to choose for each package, (assuming the package versions are written using this format `major.minor.patch`) make sure to bump only the `patch` version number. For example, if the last published package version for this WordPress branch was `5.6.0`, choose `5.6.1` as a version.

**Note:** For WordPress `5.0` and WordPress `5.1`, a different release process was used. This means that when choosing npm package versions targeting these two releases, you won't be able to use the next `patch` version number as it may have been already used. You should use the "metadata" modifier for these. For example, if the last published package version for this WordPress branch was `5.6.1`, choose `5.6.1+patch.1` as a version.

3. Optionally update the `CHANGELOG.md` files of the published packages with the new released versions and commit to the corresponding branch (Example `wp/5.2`).
4. Cherry-pick the CHANGELOG update commits, if any, into the `trunk` branch of Gutenberg.

Now, the npm packages should be ready and a patch can be created and committed into the corresponding WordPress SVN branch.

### Standalone Bugfix Package Releases

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
2. `npm run publish:check`

Now _cherry-pick_ the commits from `trunk` to `wp/latest`, use `-m 1 commithash` if the commit was a pull request merge commit:

1. `git cherry-pick -m 1 cb150a2`
2. `git push`

Whilst waiting for the GitHub actions build for `wp/latest`[branch to pass](https://github.com/WordPress/gutenberg/actions?query=branch%3Awp%2Ftrunk), identify and begin updating the `CHANGELOG.md` files:

1. `git checkout wp/latest`
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

Now, the `wp/latest` branch is ready for publishing npm packages. In order to start the process, go to Gutenberg's GitHub repository's Actions tab, and locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml). Note the blue banner that says "This workflow has a `workflow_dispatch` event trigger.", and expand the "Run workflow" dropdown on its right hand side.

![Run workflow dropdown for npm publishing](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/contributors/code/workflow-dispatch-npm-banner.png)

To publish packages to npm with bugfixes, select `bugfix` from the "Release type" dropdown and leave empty "WordPress major release" input field. Finally, press the green "Run workflow" button. It triggers the npm publishing job, and this needs to be approved by a Gutenberg Core team member. Locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml) for the current publishing, and have it [approved](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments#approving-or-rejecting-a-job).

Behind the scenes, the rest of the process is automated with `./bin/plugin/cli.js npm-bugfix` command. For the record, the manual process would look very close to the following steps:

1. Check out the `wp/latest` branch.
2. Update the `CHANGELOG.md` files of the packages with the new publish version calculated and commit to the `wp/latest` branch.
3. Log-in to npm via the console: `npm login`. Note that you should have 2FA enabled.
4. From the `wp/latest` branch, install npm dependencies with `npm ci`.
5. Run the script `npm run publish:latest`.
    - When asked for the version numbers to choose for each package pick the values of the updated CHANGELOG files.
    - You'll be asked for your One-Time Password (OTP) a couple of times. This is the code from the 2FA authenticator app you use. Depending on how many packages are to be released you may be asked for more than one OTP, as they tend to expire before all packages are released.
    - If the publishing process ends up incomplete (perhaps because it timed-out or an bad OTP was introduce) you can resume it via [`lerna publish from-package`](https://github.com/lerna/lerna/tree/main/libs/commands/publish#bump-from-package).
6. Finally, now that the npm packages are published, cherry-pick the commits created by lerna ("Publish" and the CHANGELOG update) into the `trunk` branch of Gutenberg.

### Development Releases

As noted in the [Synchronizing Gutenberg Plugin](#synchronizing-gutenberg-plugin) section, packages publishing happens every two weeks from the `wp/latest` branch. It's also possible to use the development release to test the upcoming changes present in the `trunk` branch at any time. We are taking advantage of [package distribution tags](https://docs.npmjs.com/cli/v7/commands/npm-dist-tag) that make it possible to consume the future version of the codebase according to npm guidelines:

> By default, the `latest` tag is used by npm to identify the current version of a package, and `npm install <pkg>` (without any `@<version>` or `@<tag>` specifier) installs the `latest` tag. Typically, projects only use the `latest` tag for stable release versions, and use other tags for unstable versions such as prereleases.

In our case, we use the `next` distribution tag for code. Developers that want to install such a version of the package need to type:

```bash
npm install @wordpress/components@next
```

In order to start the publishing process for development version of npm packages, go to Gutenberg's GitHub repository's Actions tab, and locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml). Note the blue banner that says "This workflow has a `workflow_dispatch` event trigger.", and expand the "Run workflow" dropdown on its right hand side.

![Run workflow dropdown for npm publishing](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/contributors/code/workflow-dispatch-npm-banner.png)

To publish development packages to npm, select `development` from the "Release type" dropdown and leave empty "WordPress major release" input field. Finally, press the green "Run workflow" button. It triggers the npm publishing job, and this needs to be approved by a Gutenberg Core team member. Locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml) for the current publishing, and have it [approved](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments#approving-or-rejecting-a-job).

Behind the scenes, the release process is fully automated via `./bin/plugin/cli.js npm-next` command. It ensures
the `wp/next` branch is synchronized with the latest release branch (`release/X.Y`) created for the Gutenberg plugin. To avoid collisions in the versioning of packages, we always include the newest commit's `sha`, for example, `@wordpress/block-editor@5.2.10-next.645224df70.0`.

[plugin repository]: https://plugins.trac.wordpress.org/browser/gutenberg/
[package release process]: https://github.com/WordPress/gutenberg/blob/HEAD/packages/README.md#releasing-packages
