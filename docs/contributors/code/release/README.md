# Gutenberg Release Process

The [Gutenberg repository](https://github.com/WordPress/gutenberg) on GitHub is used to perform several types of releases. This page provides an overview of the different release processes and guides you to the appropriate documentation for each type.

## Prerequisites

Before you begin any release process, there are some requirements that must be met in order to successfully release a stable version of the Gutenberg plugin. You will need to:

-   Be a member of the [Gutenberg development team](https://developer.wordpress.org/block-editor/contributors/repository-management/#teams). This gives you the ability to launch the GitHub actions that are related to the release process and to backport pull requests (PRs) to the release branch.
-   Have write permissions on the [Make WordPress Core](https://make.wordpress.org/core) blog. This allows you to draft the release post.
-   Obtain approval from a member of the Gutenberg Core team in order to upload the new version Gutenberg to the WordPress.org plugin directory.

## Plugin Releases

Plugin releases involve creating and publishing new versions of the Gutenberg plugin to the WordPress.org plugin directory. This process includes creating release candidates, testing, and final publication.

For detailed instructions on how to perform plugin releases, see the [Gutenberg plugin releases](https://developer.wordpress.org/block-editor/contributors/code/release/plugin-release/).

## Publication of Packages

Package publication involves releasing updated versions of WordPress packages to npm. This process includes synchronizing with plugin releases, WordPress core updates, and standalone bugfix releases.

For comprehensive instructions on package releases and WordPress Core updates, see the [Packages releases to NPM and WordPress Core updates](https://developer.wordpress.org/block-editor/contributors/code/release/package-release-and-core-updates/).
