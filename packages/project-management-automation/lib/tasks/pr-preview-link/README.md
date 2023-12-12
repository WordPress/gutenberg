PR Preview Link
===

Adds a comment to new PRs with a comment about Gutenberg plugin build status:
- Latest commit
- Build status of [Build Gutenberg Plugin Zip](https://github.com/WordPress/gutenberg/blob/d19eb92d96886f4bb8e1028c5d54d365e37d71e4/.github/workflows/build-plugin-zip.yml#L1)
- Link to live preview `http://gutenberg.run/{pr_number}`
- Link to artifact download URL

## Rationale

Preview sites make PRs much easier to test, especially for folks who don't have a dev environment setup. The comment also saves contributors some extra clicks to download the latest build of the Gutenberg plugin.