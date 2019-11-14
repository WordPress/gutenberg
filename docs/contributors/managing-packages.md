# Managing Packages

This repository uses [lerna] to manage Gutenberg modules and publish them as packages to [npm]. This enforces certain steps in the workflow which are described in details in [packages](/packages/README.md) documentation.

Maintaining dozens of npm packages is difficult—it can be tough to keep track of changes. That's why we use `CHANGELOG.md` files for each package to simplify the release process. As a contributor you should add an entry to the aforementioned file each time you contribute adding production code as described in [Maintaining Changelogs](/packages/README.md#maintaining-changelogs) section.

[lerna]: https://lerna.js.org
[npm]: https://www.npmjs.com/
