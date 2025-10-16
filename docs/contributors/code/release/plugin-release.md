# Gutenberg plugin releases

## Quick Reference

### Timeline

-   Release RC1 on milestone date, generally Wednesday
-   Release stable version, the following Wednesday

### General Release Process

#### Step 1: Setup

-   Create a [release issue](https://github.com/WordPress/gutenberg/issues/new?template=New_release.md) using the template. This is optional but will help you go through the process step by step
-   Review all PRs in the milestone and add proper labels (`[Type] Bug`, `[Type] Enhancement`, etc.)
-   Test the changelog: `npm run other:changelog -- --milestone="Gutenberg X.Y"`

#### Step 2: Build the Release

-   Announce in [#core-editor](https://wordpress.slack.com/messages/C02QB2JS7) Slack channel
-   Go to GitHub Actions → [Build Plugin Zip workflow](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml)
-   Keep the `Use workflow from` option set to `trunk` (default)
-   Type `rc` for release candidate OR `stable` for final release
-   Click `Run workflow`
-   When the release draft is generated in [GitHub Releases](https://github.com/WordPress/gutenberg/releases), publish it for the workflow to continue
-   For stable releases only: wait for team approval to upload to WordPress.org - this is the last step of the workflow for the plugin to be deployed to the plugin directory ([example](https://github.com/WordPress/gutenberg/actions/runs/18559811968))

#### Step 3: Edit the Release Notes

-   Find the draft in [GitHub Releases](https://github.com/WordPress/gutenberg/releases)
-   Clean up the changelog: fix spelling, move miscategorized items, combine related PRs
-   Remove mobile-only changes and reverted PRs

#### Step 4: Write Release Post

-   Use the [Google Doc template](https://docs.google.com/document/d/1D-MTOCmL9eMlP9TDTXqlzuKVOg_ghCPm9_whHFViqMk/edit)
-   Highlight 3-5 key features from the release
-   Publish on [make.wordpress.org/core](https://make.wordpress.org/core/) after stable release is live

### Additional Release Candidates and Minor Versions (X.Y.Z)

For urgent fixes after RC1 or critical bug fixes between major releases:

#### Cherry-pick Bug Fixes

-   For new RCs: Use PRs labeled `Backport to Gutenberg RC`
-   For minor releases: Use PRs labeled `Backport to Gutenberg Minor Release`
-   Checkout the appropriate release branch: `git checkout release/X.Y`
-   Run: `npm run other:cherry-pick "[Label Name]"`
-   Reassign PRs to correct milestone (e.g., from `12.6` to `12.5`) **before** running the workflow

#### Run Release Workflow

-   Go to [Build Plugin Zip workflow](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml)
-   Select the release branch from `Use workflow from` dropdown
-   Continue with the steps 2-4 above

---

## Detailed Process

The first step in releasing a stable version of the Gutenberg plugin is to [create an issue](https://github.com/WordPress/gutenberg/issues/new?template=New_release.md) in the Gutenberg repository. The issue template is called "Gutenberg Release," and it contains a checklist for the complete release process, from release candidate to changelog curation to cherry-picking, stable release, and release post. The issue for [Gutenberg 21.2](https://github.com/WordPress/gutenberg/issues/70662) is a good example.

The checklist helps you coordinate with developers and other teams involved in the release process. It ensures that all of the necessary steps are completed and that everyone is aware of the schedule and important milestones.

## Release schedule

A new major version of Gutenberg is released approximately every two weeks. The current and next versions are tracked in [GitHub milestones](https://github.com/WordPress/gutenberg/milestones), along with the date when each version will be tagged.

**On the date of the current milestone**, also called the tagging date, the first release candidate (RC) of Gutenberg is published. This is a pre-release version of the plugin that is made available for testing by plugin authors and users. If any regressions are found, a new RC can be published.

Release candidates are versioned incrementally, starting with `-rc.1`, then `-rc.2`, and so on. As soon as the first RC (RC1) is published, preparation for the release post begins.

**One week after the RC1**, the stable version is created based on the last RC and any necessary regression fixes. Once the stable version is released, the release post is published.

If critical bugs are discovered in stable versions of the plugin, patch versions can be released at any time.

## Release management

Each major Gutenberg release is run by a release manager, also known as a release lead. This individual, or small team of individuals, is responsible for the release of Gutenberg with support from the broader [Gutenberg development team](https://developer.wordpress.org/block-editor/contributors/repository-management/#teams).

The release manager is responsible for initiating all release activities, and their approval is required for any changes to the release plan. In the event of an emergency or if the release manager is unavailable, other team members may take appropriate action, but they should keep the release manager informed.

<div class="callout callout-tip">
If you are a member of the <a href="https://developer.wordpress.org/block-editor/contributors/repository-management/#teams">Gutenberg development team</a> and are interested in leading a Gutenberg release, reach out in the <a href="https://wordpress.slack.com/messages/C02QB2JS7">#core-editor</a> Slack channel.</div>

## Preparing a release

The plugin release process is mostly automated and happens on GitHub. You do not need to run any steps locally on your machine. However, it’s a good idea to have a local copy of Gutenberg for changelog preparation, general testing, and in case multiple release candidates are required. But more on that later.

Here is an [11-minute video](https://youtu.be/TnSgJd3zpJY) that demonstrates the plugin release process. If you are unfamiliar with the process, we recommend watching the video first. The process is also documented in the following paragraphs, which provide more detailed instructions.

### Organizing and labeling milestone PRs

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

### Running the release workflow

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

### Publishing the @wordpress packages to NPM

As part of the release workflow, all of the @wordpress packages are published to NPM. After the [Build Gutenberg Plugin Zip](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml) action has created the draft release, you may see a message that the [Publish npm packages](https://github.com/WordPress/gutenberg/actions/workflows/publish-npm-packages.yml) action requires someone with appropriate permissions to trigger it.

This message is misleading. You do not need to take any action to publish the @wordpress packages to NPM. The process is automated and will automatically run after the release notes are published.

### Viewing the release draft

As soon as the workflow has finished, you’ll find the release draft under [Gutenberg Releases](https://github.com/WordPress/gutenberg/releases). The draft is pre-populated with changelog entries based on previous RCs for this version and any changes that have since been cherry-picked to the release branch. Thus, when releasing the first stable version of a series, delete any RC version headers (that are only there for your information) and move the more recent changes to the correct section (see below).

### Curating the release changelog

The best time to work on the changelog is when it is first created during the release candidate workflow. This is when the changelog automation is called, and the first version of the changelog becomes available. The changelog process is mostly automated, but it depends heavily on the proper labeling of the PRs in the milestone, as mentioned above.

The stable release process takes the changelogs of the RCs and adds them to the stable release. However, there is one important thing to note: the stable release only "remembers" the first version of the changelog, which is the version that was available when RC1 was published. Any subsequent changes to the changelog of RC1 will not be included in the stable release.

That means if you curate the whole changelog before you publish RC1, you won’t have to work on it for the stable release, except for the few items of subsequent RC2 or RC3 releases that will also be added to the stable release.

Once the release changelog is available in the draft, take some time to read the notes and edit them to make sure they are easy to read and accurate. Don't rush this part. It's important to make sure the release notes are as organized as possible, but you don't have to finish them all at once. You can save the draft and come back to it later.

If you're worried that people won't be able to access the release candidate version until you publish the release, you can share the release artifact with the [#core-editor](https://wordpress.slack.com/messages/C02QB2JS7) Slack channel. This will give people access to the release candidate version while you finish curating the changelog.

Here are some additional tips for preparing clear and concise changelogs:

-   Move all entries under the `Various` section to a more appropriate section.
-   Fix spelling errors or clarify wording. Phrasing should be easy to understand where the intended audience is those who use the plugin or are keeping up with ongoing development.
-   Create new groupings as applicable, and move pull requests between.
-   When multiple PRs relate to the same task (such as a follow-up pull request), try to combine them into a single entry. Good examples for this are PRs around removing Lodash for performance purposes, replacement of Puppeteer E2E tests with Playwright or efforts to convert public components to TypeScript.
-   If subtasks of a related set of PRs are substantial, consider organizing as entries in a nested list.
-   Remove PRs that revert other PRs in the same release if the net change in code is zero.
-   Remove all PRs that only update the mobile app. The only exception to this rule is if the mobile app pull request also updates functionality for the web.
-   If a subheader only has one PR listed, remove the subheader and move the PR to the next matching subheader with more than one item listed.

### Creating release candidate patches (cherry-picking)

<div class="callout callout-info">
    <strong>Quick reference</strong>
    <ul>
        <li>Ensure all PRs that need cherry-picking have the <code>Backport to Gutenberg RC</code> label.</li>
        <li>In your local clone of the Gutenberg repository, switch to the release branch: <code>git checkout release/X.Y</code></li>
        <li>Cherry-pick all merged PRs using the automated script: <code>npm run other:cherry-pick "Backport to Gutenberg RC"</code></li>
    </ul>
</div>

After an RC is published but before the final stable release, some bugs related to the release might be fixed and committed to `trunk`. The stable release will not automatically include these fixes. Including them is a manual process, which is called cherry-picking.

There are a couple of ways you might be made aware of these bugs as a release manager:

-   Contributors may add the `Backport to Gutenberg RC` label to a closed PR. [Do a search for any of these PRs](https://github.com/WordPress/gutenberg/pulls?q=is%3Apr+label%3A%22Backport+to+Gutenberg+RC%22+is%3Aclosed) before publishing the final release.
-   You may receive a direct message or a ping in the [#core-editor](https://wordpress.slack.com/messages/C02QB2JS7) Slack channel notifying you of PRs that need to be included in the RC. Even when this is the case, the `Backport to Gutenberg RC` should always be added to the PR.

#### Automated cherry-picking

The cherry-picking process can be automated with the `npm run other:cherry-pick "[Insert Label]"` script, which is included in Gutenberg. You will need to use the label `Backport to Gutenberg RC` when running the command and ensure all PRs that need cherry-picking have the label assigned.

<div class="callout callout-warning">
To cherry-pick PRs, you must clone (not fork) the Gutenberg repository and have write access. Only members of the <a href="https://developer.wordpress.org/block-editor/contributors/repository-management/#teams">Gutenberg development team</a> have the necessary permissions to perform this action.</div>

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

#### Manual cherry-picking

If you need to handle cherry-picking one at a time and one step at a time, you can follow this sequence manually. After checking out the corresponding release branch:

1. Cherry-pick each PR (in chronological order) using `git cherry-pick [SHA]`.
2. When done, push the changes to GitHub using `git push`.
3. Remove the `Backport to Gutenberg RC` label and update the milestone to the current release for all cherry-picked PRs.

To find the `[SHA]` for a pull request, open the PR, and you’ll see a message “`[Username]` merged commit `[SHA]` into `trunk`” near the end.

![Manual cherry-picking](https://developer.wordpress.org/files/2023/07/image-5.png)

If the cherry-picked fixes deserve another release candidate before the stable version is published, create one by following the instructions above. Let other contributors know that a new release candidate has been released in the [#core-editor](https://wordpress.slack.com/messages/C02QB2JS7) Slack channel.

### Publishing the release

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

The last step needs approval by a member of either the [Gutenberg Release](https://github.com/orgs/WordPress/teams/gutenberg-release), [Gutenberg Core](https://github.com/orgs/WordPress/teams/gutenberg-core), or the [WordPress Core](https://github.com/orgs/WordPress/teams/wordpress-core) teams. These teams get a notification email when the release is ready to be approved, but if time is of the essence, you can ask in the `#core-editor` Slack channel or ping the [Gutenberg Release team](https://github.com/orgs/WordPress/teams/gutenberg-release) to accelerate the process. Reaching out before launching the release process so that somebody is ready to approve is recommended. Locate the [“Upload Gutenberg plugin to WordPress.org plugin repo” workflow](https://github.com/WordPress/gutenberg/actions/workflows/upload-release-to-plugin-repo.yml) for the new version, and have it [approved](https://docs.github.com/en/actions/how-tos/managing-workflow-runs-and-deployments/managing-deployments/reviewing-deployments#approving-or-rejecting-a-job).

Once approved, the new Gutenberg version will be available to WordPress users all over the globe. Once uploaded, confirm that the latest version can be downloaded and updated from the WordPress plugin dashboard.

The final step is to write a release post on [make.wordpress.org/core](https://make.wordpress.org/core/). You can find some tips on that below.

## Troubleshooting the release

> The plugin was published to the WordPress.org plugin directory but the workflow failed.

This has happened occasionally, see [this one](https://github.com/WordPress/gutenberg/actions/runs/16325916698/job/46115920213) for example.

It's important to check that:

-   the plugin from the directory works as expected
-   the ZIP contents (see [Downloads](https://plugins.trac.wordpress.org/browser/gutenberg/)) looks correct (doesn't have anything obvious missing)
-   the [Gutenberg SVN repo](https://plugins.trac.wordpress.org/browser/gutenberg/) has two new commits (see [the log](https://plugins.trac.wordpress.org/browser/gutenberg/)):
    -   the `trunk` folder should have "Committing version X.Y.Z"
    -   there is a new `tags/X.Y.Z` folder with the same contents as `trunk` whose latest commit is "Tagging version X.Y.Z"

Most likely, the tag folder couldn't be created. This is a [known issue](https://github.com/WordPress/gutenberg/issues/55295) that [can be fixed manually](https://github.com/WordPress/gutenberg/issues/55295#issuecomment-1759292978).

Either substitute `SVN_USERNAME`, `SVN_PASSWORD`, and `VERSION` for the proper values or set them as global environment variables first:

```sh
# CHECKOUT THE REPOSITORY
svn checkout https://plugins.svn.wordpress.org/gutenberg/trunk --username "$SVN_USERNAME" --password "$SVN_PASSWORD" gutenberg-svn

# MOVE TO THE LOCAL FOLDER
cd gutenberg-svn

# IF YOU HAPPEN TO HAVE ALREADY THE REPO LOCALLY
# AND DIDN'T CHECKOUT, MAKE SURE IT IS UPDATED
svn up .

# COPY CURRENT TRUNK INTO THE NEW TAGS FOLDER
svn copy https://plugins.svn.wordpress.org/gutenberg/trunk https://plugins.svn.wordpress.org/gutenberg/tags/$VERSION -m 'Tagging version $VERSION' --no-auth-cache --non-interactive  --username "$SVN_USERNAME" --password "$SVN_PASSWORD"
```

Ask around if you need help with any of this.

## Documenting the release

Documenting the release is led by the release manager with the help of [Gutenberg development team](https://developer.wordpress.org/block-editor/contributors/repository-management/#teams) members. This process is comprised of a series of sequential steps that, because of the number of people involved, and the coordination required, need to adhere to a timeline between the RC and stable releases. Stable Gutenberg releases happen on Wednesdays, one week after the initial RC.

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

### Selecting the release highlights

Once the changelog is cleaned up, the next step is to choose a few changes to highlight in the release post. These highlights usually focus on new features and enhancements, including performance and accessibility ones, but can also include important API changes or critical bug fixes.

Given the big scope of Gutenberg and the high number of PRs merged in each milestone, it is not uncommon to overlook impactful changes worth highlighting; because of this, this step is a collaborative effort between the release manager and other Gutenberg development team members. If you don’t know what to pick, reach out to others on the team for assistance.

### Release assets

The release post has a few visual assets that need to be organized. For the post's featured image, use the same image as the previous release used. It should already be in the media library called 'gb-featured'.

There's also a banner in the post body, which can be added via a synced pattern called 'Gutenberg What's New Banner'. Insert this pattern and update the text to the correct version number.

The highlighted features also require visual assets. For a high profile feature you can request visual assets from the Design team. For other features you can create the assets yourself if you're comfortable. To request assets from design, reach out in the [#design](https://wordpress.slack.com/archives/C02S78ZAL) Slack channel, and an example post for 15.8 can be found [here](https://wordpress.slack.com/archives/C02S78ZAL/p1684161811926279). The assets will be provided in a [Google Drive folder](https://drive.google.com/drive/folders/1U8bVbjOc0MekWjpMjNaVFVhHFEzQkYLB) assigned to the specific release.

When creating visual assets for a WordPress release, use animations (video or GIF) or static images to showcase the highlights. Use [previous release posts](https://make.wordpress.org/core/tag/gutenberg-new/) as a guide, and keep in mind that animations are better for demonstrating workflows, while more direct highlights can be shown with an image. When creating assets, avoid using copyrighted material and disable browser plugins that can be seen in the browser canvas.

### Drafting the release post

The release manager is responsible for drafting the release post based on the [Google Doc Template](https://docs.google.com/document/d/1D-MTOCmL9eMlP9TDTXqlzuKVOg_ghCPm9_whHFViqMk/edit). That said, because of the nature of the release post content, responsibilities can be divided up and delegated to other team members if agreed upon in advance. Once the draft is complete, ask for peer review.

### Publishing the release post

Once the post content is ready, an author with permission to post on [make.wordpress.org/core](https://make.wordpress.org/core/) will create a new draft and import the content. The post should include the following tags:

-   [#block-editor](https://make.wordpress.org/core/tag/block-editor/)
-   [#core-editor](https://make.wordpress.org/core/tag/core-editor/)
-   [#gutenberg](https://make.wordpress.org/core/tag/gutenberg/)
-   [#gutenberg-new](https://make.wordpress.org/core/tag/gutenberg-new/)

The author should then enable public preview on the post and ask for a final peer review. This is encouraged by the [make/core posting guidelines](https://make.wordpress.org/core/handbook/best-practices/post-comment-guidelines/#peer-review).

Finally, the post should be published after the stable version is released and is available on WordPress.org. This will help external media to echo and amplify the release.

## Call for volunteer for the next release

After you've completed the release, post in #core-editor slack channel asking for volunteers to handle the next Gutenberg release.

See an example of that [here](https://wordpress.slack.com/archives/C02QB2JS7/p1751595983193709).

## Creating minor releases

Occasionally it's necessary to create a minor release (i.e. X.Y.**Z**) of the Plugin. This is usually done to expedite fixes for bad regressions or bugs. The `Backport to Gutenberg Minor Release` is usually used to identify PRs that need to be included in a minor release, but as release coordinator you may also be notified more informally through slack. Even so, it's good to ensure all relevant PRs have the correct label.

As you proceed with the following process, it's worth bearing in mind that such minor releases are not created as branches in their own right (e.g. `release/12.5.0`) but are simply [tags](https://github.com/WordPress/gutenberg/releases/tag/v12.5.1).

The method for minor releases is nearly identical to the main Plugin release process (see above) but has some notable exceptions. Please make sure to read _the entire_ guide before proceeding.

### Updating the release branch

The minor release should only contain the _specific commits_ required. To do this you should checkout the previous _major_ stable (i.e. non-RC) release branch (e.g. `release/12.5`) locally and then cherry pick any commits that you require into that branch.

<div class="callout callout-alert">
If an RC already exists for a new version, you <strong>need</strong> to cherry-pick the same commits in the respective release branch, as they will not be included automatically. E.g.: If you're about to release a new minor release for 12.5 and just cherry-picked into <code>release/12.5</code>, but 12.6.0-rc.1 is already out, then you need to cherry-pick the same commits into the <code>release/12.6</code> branch, or they won't be included in subsequent releases for 12.6! Usually it's best to coordinate this process with the release coordinator for the next release.
</div>

The cherry-picking process can be automated with the [`npm run cherry-pick`](/docs/contributors/code/auto-cherry-picking.md) script, but be sure to use the `Backport to Gutenberg Minor Release` label when running the script.

You must also ensure that all PRs being included are assigned to the GitHub Milestone on which the minor release is based. Bear in mind, that when PRs are _merged_ they are automatically assigned a milestone for the next _stable_ release. Therefore you will need to go back through each PR in GitHub and re-assign the Milestone.

For example, if you are releasing version `12.5.4`, then all PRs picked for that release must be unassigned from the `12.6` Milestone and instead assigned to the `12.5` Milestone.

Once cherry picking is complete, you can also remove the `Backport to Gutenberg Minor Release` label from the PRs.

Once you have the stable release branch in order and the correct Milestone assigned to your PRs you can _push the branch to GitHub_ and continue with the release process using the GitHub website GUI.

### Running the minor release

![Run workflow dropdown for the plugin release](https://developer.wordpress.org/files/2023/07/image-1.png)

Go to Gutenberg's GitHub repository's Actions tab, and locate the ["Build Gutenberg Plugin Zip" action](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml). You should now _carefully_ choose the next action based on information about the current Plugin release version:

_If_ the previous release version was **stable** (`X.Y.Z` - e.g. `12.5.0`, `12.5.1` .etc) leave the `Use workflow from` field as `trunk` and then specify `stable` in the text input field. The workflow will automatically create a minor release, with z incremented (`x.y.(z+1)`) as required.

_If_ however, the previous release was an **RC** (e.g. `X.Y.0-rc.1`) you will need to _manually_ select the _stable version's release branch_ (e.g. `12.5.0`) when creating the release. Failure to do this will cause the workflow to release the next major _stable_ version (e.g. `12.6.0`) which is not what you want.

To do this, when running the Workflow, select the appropriate `release/` branch from the `Use workflow from` dropdown (e.g. `release/12.5`) and specify `stable` in the text input field.

#### Creating a minor release for previous stable releases

It is possible to create a minor release for any release branch even after a more recent stable release has been published. This can be done for _any_ previous release branches, allowing more flexibility in delivering updates to users. In the past, users had to wait for the next stable release, potentially taking days. Now, fixes can be swiftly shipped to any previous release branches as required.

The process is identical to the one documented above when an RC is already out: choose a previous release branch, type `stable`, and click "Run workflow". The release will be published on the GitHub releases page for Gutenberg and to the WordPress core repository SVN as a `tag` under [https://plugins.svn.wordpress.org/gutenberg/tags/](https://plugins.svn.wordpress.org/gutenberg/tags/). The SVN `trunk` directory will not be touched.

**IMPORTANT:** When publishing the draft created by the ["Build Plugin Zip" workflow](https://github.com/WordPress/gutenberg/actions/workflows/build-plugin-zip.yml), make sure to leave the "Set as last release" checkbox unchecked. If it is left checked by accident, the ["Upload Gutenberg plugin to WordPress.org plugin" workflow](https://github.com/WordPress/gutenberg/actions/workflows/upload-release-to-plugin-repo.yml) will still correctly upload it **as a tag (and will _not_ replace the `trunk` version)** to the WordPress plugin repository SVN - the workflow will perform some version arithmetic to determine how the plugin should be shipped - but you'll still need to fix the state on GitHub by setting the right release as `latest` on the [releases](https://github.com/WordPress/gutenberg/releases/) page!

### Troubleshooting

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
