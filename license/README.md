# Readme

The `dual-license-responses.json` file records responses relevant to the dual-licensing of Gutenberg from (#31893)[https://github.com/WordPress/gutenberg/issues/31893] and (#31913)[https://github.com/WordPress/gutenberg/issues/31913].

## Format of `dual-license-responses.json`

The json has two top level nodes. The `claimedEmails` node includes an object in `claimedEmails.responses` object for each email address that has contributed to Gutenberg's `trunk` branch (i.e., by being an author or coauther of a commit on that branch) but was not associated with any GitHub account. 

The `gitHubUserContributors` node includes an object in `gitHubUserContributors.responses` for each GitHub user who has contributed to Gutenberg's `trunk` branch. Once a grant or denial of consent is received for a particular contributor, the relevant `gitHubUserContributors.responses` object will be updated with a `consent` boolean, with `true` representing a grant of consent to dual-licensing the user's past contributions and `false` representing a denial of consent. If there is no `consent` field for a particular `gitHubUserContributions.responses` object, that means we have not received either a grant or denial of consent.

When a relevant comment is noted for either the `claimedEmails` or `gitHubUserContributors`, information about that comment is recorded in the `comment` field on the relevant node.

## Updating `dual-license-responses.json`

That file can be updated with the latest comments on those issues by running `node update-dual-license-responses.js`. This script has been tested with node v14.16.0. In order to run this script, you must have the [GitHub CLI](https://cli.github.com/) installed and configured (the script uses that because it handles the pagination of the search results). 

That script will download all of the comments for each issue, and allow the user to process each comment individually, updating the `dual-license-responses.json` file appropriately based on the user's input.