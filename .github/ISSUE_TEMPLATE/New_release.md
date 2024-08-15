---
name: Gutenberg Release
about: A checklist for the Gutenberg plugin release process
labels: Gutenberg Plugin, [Type] Project Management
---

This issue is to provide visibility on the progress of the release process of Gutenberg VERSION_NUMBER and to centralize any conversations about it. The ultimate goal of this issue is to keep the reference of the steps, resources, work, and conversations about this release so it can be helpful for the next contributors releasing a new Gutenberg version.

-   Gutenberg version to release: VERSION_NUMBER ([milestone](ADD_LINK))
-   Release Manager (a.k.a. Release Lead):
-   Release Date VERSION_NUMBER RC: ADD DATE
-   Release Date VERSION_NUMBER: ADD DATE
-   Previous version change log (as a reference): [15.3](https://github.com/WordPress/gutenberg/releases/tag/v15.3.0)

## Resources

-   📖 Read: [Gutenberg Release Process](https://developer.wordpress.org/block-editor/contributors/code/release/)
-   📽 Watch: [Gutenberg Plugin: New Release Workflow](https://www.youtube.com/watch?v=TnSgJd3zpJY)
-   📽 Watch: [Creating the Gutenberg plugin v12.0 Release Candidate](https://www.youtube.com/watch?v=FLkLHKecxWg)
-   📽 Watch: [Gutenberg plugin v12.0.0 Release Party!](https://www.youtube.com/watch?v=4SDtpVPDsLc)

## Checklist

### RC Day - {Weekday, Month, Date}

-   [ ] Post a message in `#core-editor` channel to let folks know you are starting the RC release process
-   [ ] Organize and Label PRs on the relevant milestone
-   [ ] Start the release process by triggering the `rc` [workflow](https://developer.wordpress.org/block-editor/contributors/code/release/#running-workflow)
-   [ ] [Update the created Draft Release accordingly](https://developer.wordpress.org/block-editor/contributors/code/release/#view-the-release-draft)
-   [ ] [Curate the changelog](https://developer.wordpress.org/block-editor/contributors/code/release/#1-curating-the-changelog) before publishing
-   [ ] Publish Release
-   [ ] Announce in `#core-editor` channel that RC1 has been released and is ready for testing
-   [ ] Ping any other relevant channels announcing that the RC is available
-   [ ] Create Draft of Release post on Make Core blog _(initial draft in [Google doc](https://docs.google.com/document/d/1D-MTOCmL9eMlP9TDTXqlzuKVOg_ghCPm9_whHFViqMk/edit))_

### Between RC and Release

-   [ ] Post a reminder in #core-editor for backporting PRs to RC (~Label Backport to Gutenberg RC)
-   [ ] If there are any PRs marked as [Backport to RC](https://github.com/WordPress/gutenberg/pulls?q=is%3Apr+label%3A%22Backport+to+Gutenberg+RC%22+is%3Aclosed), run the [cherry-pick command to apply them](https://developer.wordpress.org/block-editor/contributors/code/release/auto-cherry-picking/#how-can-i-use-it-for-a-gutenberg-plugin-release) to the release branch. **This needs to be run locally**
-   [ ] [Draft Release Post Highlights and Change Log](https://docs.google.com/document/d/1D-MTOCmL9eMlP9TDTXqlzuKVOg_ghCPm9_whHFViqMk/edit)
-   [ ] Get assets from [Design Team](https://make.wordpress.org/design/) for the post
-   [ ] Reach out to Highlight Authors to draft sections (if necessary)

### Release Day - {Weekday, Month, Date}

-   [ ] Post a message in `#core-editor` channel to let folks know you are starting the release process
-   [ ] Start the release process by triggering the `stable` [workflow](https://developer.wordpress.org/block-editor/contributors/code/release/#running-workflow)
-   [ ] Update the created Draft Release accordingly. Typically by copy/pasting the last RC release notes and add any changes/updates as needed.
-   [ ] Publish Release
-   [ ] Trigger the update to the plugin directory. _(Get approval from a member of [Gutenberg Release team](https://github.com/orgs/WordPress/teams/gutenberg-release/members) if necessary)_
-   [ ] Announce in `#core-editor` channel that the plugin has been released
-   [ ] Reach out to other contributors to help get the post reviewed
-   [ ] Publish Release post on Make Core blog
