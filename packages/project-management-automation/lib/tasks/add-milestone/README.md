# Add Milestone

Assigns the plugin release milestone to a pull request once it is merged.

Creates the milestone if it does not yet exist.

## Rationale

If a pull request is merged, it can be difficult to know which upcoming or past plugin version that change would be included within. This is useful for debugging if a change should be expected to be available for testing, and to know if a change should be anticipated to be released within an upcoming release of the plugin.

It is also used in automation associated with [release changelogs](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/release.md#writing-the-release-notes-and-post), which aggregate pull requests based on the assigned milestone.
