# Gutenberg Release Process

The [Gutenberg repository](https://github.com/WordPress/gutenberg) on GitHub is used to perform several types of releases. This document serves as a checklist for each of these releases, and it can help you understand the different workflows involved.

Before you begin, there are some requirements that must be met in order to successfully release a stable version of the Gutenberg plugin. You will need to:

-   Be a member of the [Gutenberg development team](https://developer.wordpress.org/block-editor/block-editor/contributors/repository-management/#teams). This gives you the ability to launch the GitHub actions that are related to the release process and to backport pull requests (PRs) to the release branch.
-   Have write permissions on the [Make WordPress Core](http://make.wordpress.org/core) blog. This allows you to draft the release post.
-   Obtain approval from a member of the Gutenberg Core team in order to upload the new version Gutenberg to the WordPress.org plugin directory.

Similar requirements apply to releasing WordPress's [npm packages](https://developer.wordpress.org/block-editor/contributors/code/release/#packages-releases-to-npm-and-wordpress-core-updates).

## Gutenberg plugin releases

The first step in releasing a stable version of the Gutenberg plugin is to [create an issue](https://github.com/WordPress/gutenberg/issues/new?assignees=&labels=&projects=&template=New_release.md) in the Gutenberg repository. The issue template is called "Gutenberg Release," and it contains a checklist for the complete release process, from release candidate to changelog curation to cherry-picking, stable release, and release post. The issue for [Gutenberg 15.7](https://github.com/WordPress/gutenberg/issues/50092) is a good example.

The checklist helps you coordinate with developers and other teams involved in the release process. It ensures that all of the necessary steps are completed and that everyone is aware of the schedule and important milestones.

### Release schedule

A new major version of Gutenberg is released approximately every two weeks. The current and next versions are tracked in [GitHub milestones](https://github.com/WordPress/gutenberg/milestones), along with the date when each version will be tagged.

**On the date of the current milestone**, also called the tagging date, the first release candidate (RC) of Gutenberg is published. This is a pre-release version of the plugin that is made available for testing by plugin authors and users. If any regressions are found, a new RC can be published.

Release candidates are versioned incrementally, starting with `-rc.1`, then `-rc.2`, and so on. As soon as the first RC (RC1) is published, preparation for the release post begins.

**One week after the RC1**, the stable version is created based on the last RC and any necessary regression fixes. Once the stable version is released, the release post is published.

If critical bugs are discovered in stable versions of the plugin, patch versions can be released at any time.

### Release management

Each major Gutenberg release is run by a release manager, also known as a release lead. This individual, or small team of individuals, is responsible for the release of Gutenberg with support from the broader [Gutenberg development team](https://developer.wordpress.org/block-editor/block-editor/contributors/repository-management/#teams).

The release manager is responsible for initiating all release activities, and their approval is required for any changes to the release plan. In the event of an emergency or if the release manager is unavailable, other team members may take appropriate action, but they should keep the release manager informed.

<div class="callout callout-tip">
If you are a member of the <a href="https://developer.wordpress.org/block-editor/block-editor/contributors/repository-management/#teams">Gutenberg development team</a> and are interested in leading a Gutenberg release, reach out in the <a href="https://wordpress.slack.com/messages/C02QB2JS7">#core-editor</a> Slack channel.</div>

### Preparing a release

The plugin release process is mostly automated and happens on GitHub. You do not need to run any steps locally on your machine. However, it’s a good idea to have a local copy of Gutenberg for changelog preparation, general testing, and in case multiple release candidates are required. But more on that later.

Here is an [11-minute video](https://youtu.be/TnSgJd3zpJY) that demonstrates the plugin release process. If you are unfamiliar with the process, we recommend watching the video first. The process is also documented in the following paragraphs, which provide more detailed instructions.

#### Organizing and labeling milestone PRs

<div class="callout callout-info">
    <strong>Quick reference</strong>
    <ul>
        <li>Ensure all PRs are properly labeled.</li>
        <li>Each PR must have one label prefixed by <code>[Type]</code>.</li>
    </ul>
</div>

The first step in preparing a Gutenberg release is to organize all PRs assigned to the current [milestone](https://github.com/WordPress/gutenberg/milestones) and ensure that each is properly labeled. [Labels](https://github.com/WordPress/gutenberg/labels) are used to automatically generate the changelog, and changing the labels on PRs is much faster than reorganizing an existing changelog in the release section afterward.

To test the changelog automation that will be run as part of the release workflow, you can use the following command in your local copy of Gutenberg using the milestone of the stable release version you are working on:

```
npm run other:changelog -- --milestone="Gutenberg 16.2"
```

The output of this command is the changelog for the provided milestone, which in the above example is Gutenberg 16.2. You can copy and paste the output into a Markdown document, which will make it easier to view and allow you to follow the links to each PR.

All PRs should have a label prefixed by `[Type]` as well as labels for sub-categories. The two most common labels are `[Type] Bug` and `[Type] Enhancement`. When reviewing the generated changelog, pay close attention to the following:

-   **Enhancements:** Look for PRs that don't have any subcategories attached.
-   **Bug fixes:** Also look for PRs that don't have any subcategories attached.
-   **Various:** PRs in this section don't have any labels at all.

Update the labels on each PR as needed. You can continue generating the changelog until you are comfortable proceeding. Now you are ready to start the release candidate workflow.

<div class="callout callout-tip">
You can see how the changelog is generated from the PR labels in the <a href="https://github.com/WordPress/gutenberg/blob/trunk/bin/plugin/commands/changelog.js">changelog.js</a> file.
</div>

#### Running the release workflow

<div class="callout callout-info">
    <strong>Quick reference</strong>
    <ul>
        <li>
            Announce in <a href="https://wordpress.slack.com/messages/C02QB2JS7">#core-editor</a> that you are about to start the release workflow.
        </li>
        <li>
            Run the <a href="https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml">Build Gutenberg Plugin Zip</a> workflow.
        </li>
    </ul>
</div>

Before you begin, announce in [#core-editor](https://wordpress.slack.com/messages/C02QB2JS7) Slack channel that you are about to start the workflow and indicate whether you are releasing a stable version of Gutenberg or an RC.

Then go to the Gutenberg repository, click on the Actions tab, and then locate the [Build Gutenberg Plugin Zip](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml) action. Note the blue banner that says, “This workflow has a `workflow_dispatch` event trigger.” Expand the “Run workflow” dropdown on its right-hand side.

![Run workflow dropdown for the plugin release](https://developer.wordpress.org/files/2023/07/image-3-1.png)

To release an RC version of the plugin, enter `rc `in the text field. To release a stable version, enter `stable`. In each case, press the button “Run workflow”.

This will trigger a GitHub Actions (GHA) workflow that will bump the plugin version, build the Gutenberg plugin `.zip` file, create a release draft, and attach the plugin `.zip` file. This part of the process typically takes about six minutes. The workflow will appear at the top of the list, right under the blue banner. Once it is finished, the workflow's status icon will change from a yellow dot to a green checkmark. You can follow along for a more detailed view by clicking on the workflow.

#### Publishing the @wordpress packages to NPM

As part of the release workflow, all of the @wordpress packages are published to NPM. After the [Build Gutenberg Plugin Zip](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml) action has created the draft release, you may see a message that the [Publish npm packages](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml) action requires someone with appropriate permissions to trigger it.

This message is misleading. You do not need to take any action to publish the @wordpress packages to NPM. The process is automated and will automatically run after the release notes are published.

#### Viewing the release draft

As soon as the workflow has finished, you’ll find the release draft under [Gutenberg Releases](https://github.com/WordPress/gutenberg/releases). The draft is pre-populated with changelog entries based on previous RCs for this version and any changes that have since been cherry-picked to the release branch. Thus, when releasing the first stable version of a series, delete any RC version headers (that are only there for your information) and move the more recent changes to the correct section (see below).

#### Curating the release changelog

The best time to work on the changelog is when it is first created during the release candidate workflow. This is when the changelog automation is called, and the first version of the changelog becomes available. The changelog process is mostly automated, but it depends heavily on the proper labeling of the PRs in the milestone, as mentioned above.

The stable release process takes the changelogs of the RCs and adds them to the stable release. However, there is one important thing to note: the stable release only "remembers" the first version of the changelog, which is the version that was available when RC1 was published. Any subsequent changes to the changelog of RC1 will not be included in the stable release.

That means if you curate the whole changelog before you publish RC1, you won’t have to work on it for the stable release, except for the few items of subsequent RC2 or RC3 releases that will also be added to the stable release.

Once the release changelog is available in the draft, take some time to read the notes and edit them to make sure they are easy to read and accurate. Don't rush this part. It's important to make sure the release notes are as organized as possible, but you don't have to finish them all at once. You can save the draft and come back to it later.

If you're worried that people won't be able to access the release candidate version until you publish the release, you can share the release artifact with the [#core-editor](https://wordpress.slack.com/messages/C02QB2JS7) Slack channel. This will give people access to the release candidate version while you finish curating the changelog.

Here are some additional tips for preparing clear and concise changelogs:

-   Move all entries under the `Various` section to a more appropriate section.
-   Fix spelling errors or clarify wording. Phrasing should be easy to understand where the intended audience is those who use the plugin or are keeping up with ongoing development.
-   Create new groupings as applicable, and move pull requests between.
-   When multiple PRs relate to the same task (such as a follow-up pull request), try to combine them into a single entry. Good examples for this are PRs around removing Lodash for performance purposes, replacement of Puppeteer E2D tests with Playwright or efforts to convert public components to TypeScript.
-   If subtasks of a related set of PRs are substantial, consider organizing as entries in a nested list.
-   Remove PRs that revert other PRs in the same release if the net change in code is zero.
-   Remove all PRs that only update the mobile app. The only exception to this rule is if the mobile app pull request also updates functionality for the web.
-   If a subheader only has one PR listed, remove the subheader and move the PR to the next matching subheader with more than one item listed.

#### Creating release candidate patches (cherry-picking)

<div class="callout callout-info">
    <strong>Quick reference</strong>
    <ul>
        <li>Ensure all PRs that need cherry-picking have the <code>Backport to Gutenberg RC</code> label.</li>
        <li>In your local clone of the Gutenberg repository, switch to the release branch: <code>git checkout release/X.Y</code></li>
        <li>Cherry-pick all merged PRs using the automated script: </code>npm run other:cherry-pick "Backport to Gutenberg RC"</code></li>
    </ul>
</div>

After an RC is published but before the final stable release, some bugs related to the release might be fixed and committed to `trunk`. The stable release will not automatically include these fixes. Including them is a manual process, which is called cherry-picking.

There are a couple of ways you might be made aware of these bugs as a release manager:

-   Contributors may add the `Backport to Gutenberg RC` label to a closed PR. [Do a search for any of these PRs](https://github.com/WordPress/gutenberg/pulls?q=is%3Apr+label%3A%22Backport+to+Gutenberg+RC%22+is%3Aclosed) before publishing the final release.
-   You may receive a direct message or a ping in the [#core-editor](https://wordpress.slack.com/messages/C02QB2JS7) Slack channel notifying you of PRs that need to be included in the RC. Even when this is the case, the `Backport to Gutenberg RC` should always be added to the PR.

##### Automated cherry-picking

The cherry-picking process can be automated with the `npm run other:cherry-pick "[Insert Label]"` script, which is included in Gutenberg. You will need to use the label `Backport to Gutenberg RC` when running the command and ensure all PRs that need cherry-picking have the label assigned.

<div class="callout callout-warning">
To cherry-pick PRs, you must clone (not fork) the Gutenberg repository and have write access. Only members of the <a href="https://developer.wordpress.org/block-editor/block-editor/contributors/repository-management/#teams">Gutenberg development team</a> have the necessary permissions to perform this action.</div>

Once you have cloned the Gutenberg repository to your local development environment, begin by switching to the release branch:

```
git checkout release/X.Y
```

Next, cherry-pick all the merged PRs with the appropriate backport label:

```
npm run other:cherry-pick "Backport to Gutenberg RC"
```

Behind the scenes, the script will:

-   Cherry-pick all PRs with the label `Backport to Gutenberg RC`
-   Add them to the release milestone
-   `git push` all changes to the release branch
-   Add a comment to the PR indicating it’s been cherry-picked
-   Remove the label `Backport to Gutenberg RC` from the PR

Here is a screenshot of the process:

![Automated cherry-picking](https://developer.wordpress.org/files/2023/07/image-7.png)

##### Manual cherry-picking

If you need to handle cherry-picking one at a time and one step at a time, you can follow this sequence manually. After checking out the corresponding release branch:

1. Cherry-pick each PR (in chronological order) using `git cherry-pick [SHA]`.
2. When done, push the changes to GitHub using `git push`.
3. Remove the `Backport to Gutenberg RC` label and update the milestone to the current release for all cherry-picked PRs.

To find the `[SHA]` for a pull request, open the PR, and you’ll see a message “`[Username]` merged commit `[SHA]` into `trunk`” near the end.

![Manual cherry-picking](https://developer.wordpress.org/files/2023/07/image-5.png)

If the cherry-picked fixes deserve another release candidate before the stable version is published, create one by following the instructions above. Let other contributors know that a new release candidate has been released in the [#core-editor](https://wordpress.slack.com/messages/C02QB2JS7) Slack channel.

#### Publishing the release

<div class="callout callout-info">
    <strong>Quick reference</strong>
    <ul>
        <li>In the release draft, press the “Publish release” button.</li>
        <li>If publishing a stable release, get approval from a member of the <a href="https://github.com/orgs/WordPress/teams/gutenberg-release">Gutenberg Release</a>, <a href="https://github.com/orgs/WordPress/teams/gutenberg-core">Gutenberg Core</a>, or the <a href="https://github.com/orgs/WordPress/teams/wordpress-core">WordPress Core</a> teams to upload the new plugin version to the WordPress.org plugin repository (SVN).</li>
        <li>Once uploaded, confirm that the latest version can be downloaded and updated from the WordPress plugin dashboard.</li>
    </ul>
</div>

Only once you’re happy with the shape of the changelog in the release draft, press the “Publish release” button.

Note that you do not need to change the checkboxes above the button. If you are publishing an RC, the “Set as a pre-release” will automatically be selected, and “Set as the latest release” will be selected if you are publishing the stable version.

![Publishing the release checkboxes for an RC](https://developer.wordpress.org/files/2023/07/image.png)

Publishing the release will create a `git` tag for the version, publish the release, and trigger [another GHA workflow](https://github.com/WordPress/gutenberg/actions/workflows/upload-release-to-plugin-repo.yml) with a twofold purpose:

1. Use the release notes that you just edited to update `changelog.txt`, and
2. Upload the new plugin version to the WordPress.org plugin repository (SVN) (only if you’re releasing a stable version).

The last step needs approval by a member of either the [Gutenberg Release](https://github.com/orgs/WordPress/teams/gutenberg-release), [Gutenberg Core](https://github.com/orgs/WordPress/teams/gutenberg-core), or the [WordPress Core](https://github.com/orgs/WordPress/teams/wordpress-core) teams. These teams get a notification email when the release is ready to be approved, but if time is of the essence, you can ask in the #core-editor Slack channel or ping the [Gutenberg Release team](https://github.com/orgs/WordPress/teams/gutenberg-release)) to accelerate the process. Reaching out before launching the release process so that somebody is ready to approve is recommended. Locate the [“Upload Gutenberg plugin to WordPress.org plugin repo” workflow](https://github.com/WordPress/gutenberg/actions/workflows/upload-release-to-plugin-repo.yml) for the new version, and have it [approved](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments#approving-or-rejecting-a-job).

Once approved, the new Gutenberg version will be available to WordPress users all over the globe. Once uploaded, confirm that the latest version can be downloaded and updated from the WordPress plugin dashboard.

The final step is to write a release post on [make.wordpress.org/core](https://make.wordpress.org/core/). You can find some tips on that below.

### Troubleshooting the release

> The plugin was published to the WordPress.org plugin directory but the workflow failed.

This has happened occasionally, see [this one](https://github.com/WordPress/gutenberg/actions/runs/6955409957/job/18924124118) for example.

It's important to check that:

- the plugin from the directory works as expected
- the ZIP contents (see [Downloads](https://plugins.trac.wordpress.org/browser/gutenberg/)) looks correct (doesn't have anything obvious missing)
- the [Gutenberg SVN repo](https://plugins.trac.wordpress.org/browser/gutenberg/) has two new commits (see [the log](https://plugins.trac.wordpress.org/browser/gutenberg/)):
  - the `trunk` folder should have "Commiting version X.Y.Z"
  - there is a new `tags/X.Y.Z` folder with the same contents as `trunk` whose latest commit is "Tagging version X.Y.Z"

Most likely, the tag folder couldn't be created. This is a [known issue](https://plugins.trac.wordpress.org/browser/gutenberg/) that [can be fixed manually](https://github.com/WordPress/gutenberg/issues/55295#issuecomment-1759292978).

Either substitute SVN_USERNAME, SVN_PASSWORD, and VERSION for the proper values or set them as global environment variables first:

```sh
# CHECKOUT THE REPOSITORY
svn checkout https://plugins.svn.wordpress.org/gutenberg/trunk --username "$SVN_USERNAME" --password "$SVN_PASSWORD" gutenberg-svn

# MOVE TO THE LOCAL FOLDER
cd gutenberg-svn

# IF YOU HAPPEN TO HAVE ALREADY THE REPO LOCALLY
# AND DIDN'T CHECKOUT, MAKE SURE IT IS UPDATED
# svn up .

# COPY CURRENT TRUNK INTO THE NEW TAGS FOLDER
svn copy https://plugins.svn.wordpress.org/gutenberg/trunk https://plugins.svn.wordpress.org/gutenberg/tags/$VERSION -m 'Tagging version $VERSION' --no-auth-cache --non-interactive  --username "$SVN_USERNAME" --password "$SVN_PASSWORD"
```

Ask around if you need help with any of this.

### Documenting the release

Documenting the release is led by the release manager with the help of [Gutenberg development team](https://developer.wordpress.org/block-editor/block-editor/contributors/repository-management/#teams) members. This process is comprised of a series of sequential steps that, because of the number of people involved, and the coordination required, need to adhere to a timeline between the RC and stable releases. Stable Gutenberg releases happen on Wednesdays, one week after the initial RC.

<div class="callout callout-info">
    <strong>Timeline</strong>
    <ol>
        <li>Make a copy of the <a href="https://docs.google.com/document/d/1D-MTOCmL9eMlP9TDTXqlzuKVOg_ghCPm9_whHFViqMk/edit">Google Doc Template for release posts</a> – Wednesday to Friday</li>
        <li>Select the release highlights – Friday to Monday</li>
        <li>Request release assets (images, videos) from the Design team once highlights are finalized – Friday to Monday</li>
        <li>Draft the release post and request peer review – Monday to Wednesday</li>
        <li>Publishing the post after the stable version is released – Wednesday</li>
    </ol>
</div>

#### Selecting the release highlights

Once the changelog is cleaned up, the next step is to choose a few changes to highlight in the release post. These highlights usually focus on new features and enhancements, including performance and accessibility ones, but can also include important API changes or critical bug fixes.

Given the big scope of Gutenberg and the high number of PRs merged in each milestone, it is not uncommon to overlook impactful changes worth highlighting; because of this, this step is a collaborative effort between the release manager and other Gutenberg development team members. If you don’t know what to pick, reach out to others on the team for assistance.

#### Requesting release assets

After identifying the highlights of a new WordPress release, the release manager requests visual assets from the Design team. The request is made in the [#design](https://wordpress.slack.com/archives/C02S78ZAL) Slack channel, and an example post for 15.8 can be found [here](https://wordpress.slack.com/archives/C02S78ZAL/p1684161811926279). The assets will be provided in a [Google Drive folder](https://drive.google.com/drive/folders/1U8bVbjOc0MekWjpMjNaVFVhHFEzQkYLB) assigned to the specific release.

When creating visual assets for a WordPress release, use animations (video or GIF) or static images to showcase the highlights. Use [previous release posts](https://make.wordpress.org/core/tag/gutenberg-new/) as a guide, and keep in mind that animations are better for demonstrating workflows, while more direct highlights can be shown with an image. When creating assets, avoid using copyrighted material and disable browser plugins that can be seen in the browser canvas.

#### Drafting the release post

The release manager is responsible for drafting the release post based on the [Google Doc Template](https://docs.google.com/document/d/1D-MTOCmL9eMlP9TDTXqlzuKVOg_ghCPm9_whHFViqMk/edit). That said, because of the nature of the release post content, responsibilities can be divided up and delegated to other team members if agreed upon in advance. Once the draft is complete, ask for peer review.

#### Publishing the release post

Once the post content is ready, an author with permission to post on [make.wordpress.org/core](https://make.wordpress.org/core/) will create a new draft and import the content. The post should include the following tags:

-   [#block-editor](https://make.wordpress.org/core/tag/block-editor/)
-   [#core-editor](https://make.wordpress.org/core/tag/core-editor/)
-   [#gutenberg](https://make.wordpress.org/core/tag/gutenberg/)
-   [#gutenberg-new](https://make.wordpress.org/core/tag/gutenberg-new/)

The author should then enable public preview on the post and ask for a final peer review. This is encouraged by the [make/core posting guidelines](https://make.wordpress.org/core/handbook/best-practices/post-comment-guidelines/#peer-review).

Finally, the post should be published after the stable version is released and is available on WordPress.org. This will help external media to echo and amplify the release.

### Creating minor releases

Occasionally it's necessary to create a minor release (i.e. X.Y.**Z**) of the Plugin. This is usually done to expedite fixes for bad regressions or bugs. The `Backport to Gutenberg Minor Release` is usually used to identify PRs that need to be included in a minor release, but as release coordinator you may also be notified more informally through slack. Even so, it's good to ensure all relevant PRs have the correct label.

As you proceed with the following process, it's worth bearing in mind that such minor releases are not created as branches in their own right (e.g. `release/12.5.0`) but are simply [tags](https://github.com/WordPress/gutenberg/releases/tag/v12.5.1).

The method for minor releases is nearly identical to the main Plugin release process (see above) but has some notable exceptions. Please make sure to read _the entire_ guide before proceeding.

#### Updating the release branch

The minor release should only contain the _specific commits_ required. To do this you should checkout the previous _major_ stable (i.e. non-RC) release branch (e.g. `release/12.5`) locally and then cherry pick any commits that you require into that branch.

<div class="callout callout-alert">
If an RC already exists for a new version, you _need_ to cherry-pick the same commits in the respective release branch, as they will not be included automatically. E.g.: If you're about to release a new minor release for 12.5 and just cherry-picked into `release/12.5`, but 12.6.0-rc.1 is already out, then you need to cherry-pick the same commits into the `release/12.6` branch, or they won't be included in subsequent releases for 12.6! Usually it's best to coordinate this process with the release coordinator for the next release.
</div>

The cherry-picking process can be automated with the [`npm run cherry-pick`](/docs/contributors/code/auto-cherry-picking.md) script, but be sure to use the `Backport to Gutenberg Minor Release` label when running the script.

You must also ensure that all PRs being included are assigned to the GitHub Milestone on which the minor release is based. Bear in mind, that when PRs are _merged_ they are automatically assigned a milestone for the next _stable_ release. Therefore you will need to go back through each PR in GitHub and re-assign the Milestone.

For example, if you are releasing version `12.5.4`, then all PRs picked for that release must be unassigned from the `12.6` Milestone and instead assigned to the `12.5` Milestone.

Once cherry picking is complete, you can also remove the `Backport to Gutenberg Minor Release` label from the PRs.

Once you have the stable release branch in order and the correct Milestone assigned to your PRs you can _push the branch to GitHub_ and continue with the release process using the GitHub website GUI.

#### Running the minor release

![Run workflow dropdown for the plugin release](https://developer.wordpress.org/files/2023/07/image-1.png)

Go to Gutenberg's GitHub repository's Actions tab, and locate the ["Build Gutenberg Plugin Zip" action](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml). You should now _carefully_ choose the next action based on information about the current Plugin release version:

_If_ the previous release version was **stable** (`X.Y.Z` - e.g. `12.5.0`, `12.5.1` .etc) leave the `Use workflow from` field as `trunk` and then specify `stable` in the text input field. The workflow will automatically create a minor release, with z incremented (`x.y.(z+1)`) as required.

_If_ however, the previous release was an **RC** (e.g. `X.Y.0-rc.1`) you will need to _manually_ select the _stable version's release branch_ (e.g. `12.5.0`) when creating the release. Failure to do this will cause the workflow to release the next major _stable_ version (e.g. `12.6.0`) which is not what you want.

To do this, when running the Workflow, select the appropriate `release/` branch from the `Use workflow from` dropdown (e.g. `release/12.5`) and specify `stable` in the text input field.

##### Creating a minor release for previous stable releases

It is possible to create a minor release for any release branch even after a more recent stable release has been published. This can be done for _any_ previous release branches, allowing more flexibility in delivering updates to users. In the past, users had to wait for the next stable release, potentially taking days. Now, fixes can be swiftly shipped to any previous release branches as required.

The process is identical to the one documented above when an RC is already out: choose a previous release branch, type `stable`, and click "Run workflow". The release will be published on the GitHub releases page for Gutenberg and to the WordPress core repository SVN as a `tag` under http://plugins.svn.wordpress.org/gutenberg/tags/. The SVN `trunk` directory will not be touched.

**IMPORTANT:** When publishing the draft created by the ["Build Plugin Zip" workflow](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml), make sure to leave the "Set as last release" checkbox unchecked. If it is left checked by accident, the ["Upload Gutenberg plugin to WordPress.org plugin" workflow](https://github.com/WordPress/gutenberg/actions/workflows/upload-release-to-plugin-repo.yml) will still correctly upload it **as a tag (and will _not_ replace the `trunk` version)** to the WordPress plugin repository SVN - the workflow will perform some version arithmetic to determine how the plugin should be shipped - but you'll still need to fix the state on GitHub by setting the right release as `latest` on the [releases](https://github.com/WordPress/gutenberg/releases/) page!

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

## Packages releases to NPM and WordPress Core updates

The Gutenberg repository follows the [WordPress SVN repository's](https://make.wordpress.org/core/handbook/about/release-cycle/) branching strategy for every major WordPress release. In addition to that, it also contains two other special branches that control npm publishing workflows:

-   The `wp/latest` branch contains the same version of packages as those published to npm with the `latest` distribution tag. The goal here is to have this branch synchronized with the last Gutenberg plugin release, and the only exception would be an unplanned [bugfix release](#standalone-bugfix-package-releases).
-   The `wp/next` branch contains the same version of packages as those published to npm with the `next` distribution tag. It always gets synchronized with the `trunk` branch. Projects should use those packages for development or testing purposes only.
-   A Gutenberg branch `wp/X.Y` (example `wp/6.2`) targeting a specific WordPress major release (including its further minor increments) gets created based on the current Gutenberg plugin release branch `release/X.Y` (example `release/15.1`) shortly after the last release planned for inclusion in the next major WordPress release.

Release types and their schedule:

-   [Synchronizing Gutenberg Plugin](#synchronizing-gutenberg-plugin) (`latest` dist tag) – publishing happens automatically every two weeks based on the newly created `release/X.Y` (example `release/12.8`) branch with the RC1 version of the Gutenberg plugin.
-   [WordPress Releases](#wordpress-releases) (`wp-X.Y` dist tag, example `wp-6.2`) – publishing gets triggered on demand from the `wp/X.Y` (example `wp/6.2`) branch. Once we reach the point in the WordPress major release cycle (shortly before Beta 1) where we only cherry-pick commits from the Gutenberg repository to the WordPress core, we use `wp/X.Y` branch (created from `release/X.Y` branch, example `release/15.1`) for npm publishing with the `wp-X.Y` dist-tag. It's also possible to use older branches to backport bug or security fixes to the corresponding older versions of WordPress Core.
-   [Development Releases](#development-releases) (`next` dist tag) – it is also possible to perform development releases at any time when there is a need to test the upcoming changes.

There is also an option to perform [Standalone Bugfix Package Releases](#standalone-bugfix-package-releases) at will. It should be reserved only for critical bug fixes or security releases that must be published to _npm_ outside of regular cycles.

### Synchronizing the Gutenberg plugin

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
10. Run the script `npx lerna publish --no-private`.
    - When asked for the version numbers to choose for each package pick the values of the updated CHANGELOG files.
    - You'll be asked for your One-Time Password (OTP) a couple of times. This is the code from the 2FA authenticator app you use. Depending on how many packages are to be released you may be asked for more than one OTP, as they tend to expire before all packages are released.
    - If the publishing process ends up incomplete (perhaps because it timed-out or an bad OTP was introduce) you can resume it via [`npx lerna publish from-package`](https://lerna.js.org/docs/features/version-and-publish#from-package).
11. Finally, now that the npm packages are published, cherry-pick the commits created by lerna ("Publish" and the CHANGELOG update) into the `trunk` branch of Gutenberg.

### WordPress releases

The following workflow is needed when bug or security fixes need to be backported into WordPress Core. This can happen in a few use-cases:

-   During the `beta` and `RC` periods of the WordPress release cycle when `wp/X.Y` (example `wp/5.7`) branch for the release is already present.
-   For WordPress minor releases and WordPress security releases (example `5.1.1`).

1. Check out the relevant WordPress major branch (If the minor release is 5.2.1, check out `wp/5.2`).
2. Create a feature branch from that branch, and cherry-pick the merge commits for the needed bug fixes onto it. The cherry-picking process can be automated with the [`npm run other:cherry-pick` script](/docs/contributors/code/auto-cherry-picking.md).
3. Create a Pull Request from this branch targeting the WordPress major branch used above.
4. Merge the Pull Request using the "Rebase and Merge" button to keep the history of the commits.

Now, the `wp/X.Y` branch is ready for publishing npm packages. In order to start the process, go to Gutenberg's GitHub repository's Actions tab, and locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml). Note the blue banner that says "This workflow has a `workflow_dispatch` event trigger.", and expand the "Run workflow" dropdown on its right hand side.

![Run workflow dropdown for npm publishing](https://developer.wordpress.org/files/2023/07/image-2.png)

To publish packages to npm for the WordPress major release, select `trunk` as the branch to run the workflow from (this means that the script used to run the workflow comes from the trunk branch, though the packages themselves will published from the release branch as long as the correct "Release type" is selected below), then select `wp` from the "Release type" dropdown and enter `X.Y` (example `5.2`) in the "WordPress major release" input field. Finally, press the green "Run workflow" button. It triggers the npm publishing job, and this needs to be approved by a Gutenberg Core team member. Locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml) for the current publishing, and have it [approved](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments#approving-or-rejecting-a-job).

For the record, the manual process would look like the following:

1. Check out the WordPress branch used before (example `wp/5.2`).
2. `git pull`.
3. Run the `npx lerna publish patch --no-private --dist-tag wp-5.2` command (see more in [package release process]) but when asked for the version numbers to choose for each package, (assuming the package versions are written using this format `major.minor.patch`) make sure to bump only the `patch` version number. For example, if the last published package version for this WordPress branch was `5.6.0`, choose `5.6.1` as a version.

**Note:** For WordPress `5.0` and WordPress `5.1`, a different release process was used. This means that when choosing npm package versions targeting these two releases, you won't be able to use the next `patch` version number as it may have been already used. You should use the "metadata" modifier for these. For example, if the last published package version for this WordPress branch was `5.6.1`, choose `5.6.1+patch.1` as a version.

3. Optionally update the `CHANGELOG.md` files of the published packages with the new released versions and commit to the corresponding branch (Example `wp/5.2`).
4. Cherry-pick the CHANGELOG update commits, if any, into the `trunk` branch of Gutenberg.

Now, the npm packages should be ready and a patch can be created and committed into the corresponding WordPress SVN branch.

### Standalone bugfix package releases

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
    > Example
    >
    > ```shell
    > npx lerna updated
    > @wordpress/e2e-tests
    > @wordpress/jest-preset-default
    > @wordpress/scripts
    > lerna success found 3 packages ready to publish
    > ```

Check the versions listed in the current `CHANGELOG.md` file, looking through the commit history of a package e.g [@wordpress/scripts](https://github.com/WordPress/gutenberg/commits/HEAD/packages/scripts) and look out for _"chore(release): publish"_ and _"Update changelogs"_ commits to determine recent version bumps, then looking at the commits since the most recent release should aid with discovering what changes have occurred since the last release.

Note: You may discover the current version of each package is not up to date, if so updating the previously released versions would be appreciated.

Now, the `wp/latest` branch is ready for publishing npm packages. In order to start the process, go to Gutenberg's GitHub repository's Actions tab, and locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml). Note the blue banner that says "This workflow has a `workflow_dispatch` event trigger.", and expand the "Run workflow" dropdown on its right hand side.

![Run workflow dropdown for npm publishing](https://developer.wordpress.org/files/2023/07/image-6.png)

To publish packages to npm with bugfixes, select `bugfix` from the "Release type" dropdown and leave empty "WordPress major release" input field. Finally, press the green "Run workflow" button. It triggers the npm publishing job, and this needs to be approved by a Gutenberg Core team member. Locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml) for the current publishing, and have it [approved](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments#approving-or-rejecting-a-job).

Behind the scenes, the rest of the process is automated with `./bin/plugin/cli.js npm-bugfix` command. For the record, the manual process would look very close to the following steps:

1. Check out the `wp/latest` branch.
2. Update the `CHANGELOG.md` files of the packages with the new publish version calculated and commit to the `wp/latest` branch.
3. Log-in to npm via the console: `npm login`. Note that you should have 2FA enabled.
4. From the `wp/latest` branch, install npm dependencies with `npm ci`.
5. Run the script `npx lerna publish --no-private`.
    - When asked for the version numbers to choose for each package pick the values of the updated CHANGELOG files.
    - You'll be asked for your One-Time Password (OTP) a couple of times. This is the code from the 2FA authenticator app you use. Depending on how many packages are to be released you may be asked for more than one OTP, as they tend to expire before all packages are released.
    - If the publishing process ends up incomplete (perhaps because it timed-out or an bad OTP was introduce) you can resume it via [`npx lerna publish from-package`](https://lerna.js.org/docs/features/version-and-publish#from-package).
6. Finally, now that the npm packages are published, cherry-pick the commits created by lerna ("Publish" and the CHANGELOG update) into the `trunk` branch of Gutenberg.

### Development releases

As noted in the [Synchronizing Gutenberg Plugin](#synchronizing-gutenberg-plugin) section, packages publishing happens every two weeks from the `wp/latest` branch. It's also possible to use the development release to test the upcoming changes present in the `trunk` branch at any time. We are taking advantage of [package distribution tags](https://docs.npmjs.com/cli/v7/commands/npm-dist-tag) that make it possible to consume the future version of the codebase according to npm guidelines:

> By default, the `latest` tag is used by npm to identify the current version of a package, and `npm install <pkg>` (without any `@<version>` or `@<tag>` specifier) installs the `latest` tag. Typically, projects only use the `latest` tag for stable release versions, and use other tags for unstable versions such as prereleases.

In our case, we use the `next` distribution tag for code. Developers that want to install such a version of the package need to type:

```bash
npm install @wordpress/components@next
```

In order to start the publishing process for development version of npm packages, go to Gutenberg's GitHub repository's Actions tab, and locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml). Note the blue banner that says "This workflow has a `workflow_dispatch` event trigger.", and expand the "Run workflow" dropdown on its right hand side.

![Run workflow dropdown for npm publishing](https://developer.wordpress.org/files/2023/07/image-4.png)

To publish development packages to npm, select `development` from the "Release type" dropdown and leave empty "WordPress major release" input field. Finally, press the green "Run workflow" button. It triggers the npm publishing job, and this needs to be approved by a Gutenberg Core team member. Locate the ["Publish npm packages" action](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml) for the current publishing, and have it [approved](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments#approving-or-rejecting-a-job).

Behind the scenes, the release process is fully automated via `./bin/plugin/cli.js npm-next` command. It ensures
the `wp/next` branch is synchronized with the latest release branch (`release/X.Y`) created for the Gutenberg plugin. To avoid collisions in the versioning of packages, we always include the newest commit's `sha`, for example, `@wordpress/block-editor@5.2.10-next.645224df70.0`.

[plugin repository]: https://plugins.trac.wordpress.org/browser/gutenberg/
[package release process]: https://github.com/WordPress/gutenberg/blob/HEAD/packages/README.md#releasing-packages
