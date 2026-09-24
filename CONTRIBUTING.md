# Contributing Guidelines

Welcome to WordPress' Gutenberg project! We hope you join us in creating the future platform for publishing; all are welcome here.

## How can I contribute?

To learn all about contributing to the Gutenberg project, see the [Contributor Guide](/docs/contributors/README.md). The handbook includes all the details you need to get setup and start shaping the future of web publishing.

-   Code? See the [developer section](/docs/contributors/code/README.md).

-   Design? See the [design section](/docs/contributors/design/README.md).

-   Documentation? See the [documentation section](/docs/contributors/documentation/README.md).

-   Triage? We need help reviewing existing issues to make sure they’re relevant and actionable. Triage is an important contribution because it allows us to work on the highest priority issues. To learn more, please see the [triaging issues section](docs/contributors/triage.md).

## Guidelines

-   As with all WordPress projects, we want to ensure a welcoming environment for everyone. With that in mind, all contributors are expected to follow our [Code of Conduct](https://make.wordpress.org/handbook/community-code-of-conduct/).

-   Contributors should review the [overall process and best practices for pull requests](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/repository-management.md#pull-requests), adhering to WordPress' [JavaScript coding standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/javascript/) and [accessibility coding standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/accessibility/).

-   Accessibility should be top of mind and thoroughly tested by following the [accessibility testing instructions](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/accessibility-testing.md).

-   The React Native Mobile Editor has been removed from `trunk`. The previous integration was unmaintained and known to be broken following the upgrade to React 19 ([#61521](https://github.com/WordPress/gutenberg/pull/61521)). Fixes for the existing Gutenberg Mobile build should be made by branching from the most recent React Native release — tag [`rnmobile/1.121.0`](https://github.com/WordPress/gutenberg/releases/tag/rnmobile%2F1.121.0) at commit [`e63b8b8`](https://github.com/WordPress/gutenberg/commit/e63b8b8be7bdc5e9dd2781c597e918a7be212fe5) (see [#63744](https://github.com/WordPress/gutenberg/pull/63744)) — and cutting a minor release from there.

-   You maintain copyright over any contribution you make. By submitting a pull request you agree to release that code under [Gutenberg's License](/LICENSE.md).

## Reporting Security Issues

Please see [SECURITY.md](/SECURITY.md).
