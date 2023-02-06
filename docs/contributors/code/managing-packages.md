# Managing Packages

This repository uses [monorepo] to manage WordPress modules and publish them with [lerna] as packages to [npm]. This enforces certain steps in the workflow which are described in details in [packages](https://github.com/WordPress/gutenberg/blob/HEAD/packages/README.md) documentation.

Maintaining dozens of npm packages is difficult—it can be tough to keep track of changes. That's why we use `CHANGELOG.md` files for each package to simplify the release process. As a contributor, you should add an entry to the aforementioned file each time you contribute adding production code as described in [Maintaining Changelogs](https://github.com/WordPress/gutenberg/blob/HEAD/packages/README.md#maintaining-changelogs) section.

Publishing WordPress packages to npm is automated by synchronizing it with the bi-weekly Gutenberg plugin RC1 release. You can learn more about this process and other ways to publish new versions of npm packages in the [Gutenberg Release Process document](/docs/contributors/code/release.md#packages-releases-to-npm-and-wordpress-core-updates).

[lerna]: https://lerna.js.org/
[monorepo]: https://monorepo.tools
[npm]: https://www.npmjs.com/
