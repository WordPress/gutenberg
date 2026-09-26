# Managing Packages

This repository uses [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces) to manage WordPress packages and [lerna](https://lerna.js.org/) to publish them to [npm](https://www.npmjs.com/). This enforces certain steps in the workflow which are described in details in [packages](https://github.com/WordPress/gutenberg/blob/HEAD/packages/README.md) documentation.

Maintaining dozens of npm packages is difficult—it can be tough to keep track of changes. That's why we use `CHANGELOG.md` files for each package to simplify the release process. As a contributor, you should add an entry to the aforementioned file each time you contribute adding production code as described in [Maintaining Changelogs](https://github.com/WordPress/gutenberg/blob/HEAD/packages/README.md#maintaining-changelogs) section.

Publishing WordPress packages to npm is automated by synchronizing it with the bi-weekly Gutenberg plugin RC1 release. You can learn more about this process and other ways to publish new versions of npm packages in the [Gutenberg Release Process document](/docs/contributors/code/release/README.md#publication-of-packages).

## Internal workspaces (tools and tests)

The repository also contains internal workspaces under `tools/` and `test/` for development tooling and test infrastructure. When you need to add a new tool, script, or dependency for repo-level work, create a workspace under `tools/` (or add to an existing one) instead of adding dependencies to the root `package.json`. See the [Workspace Development guide](/docs/contributors/code/workspace-development.md) for the conversion pattern, CI conventions, and reference examples.
