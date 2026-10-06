# Managing Packages

This repository uses [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces) to manage WordPress packages and [lerna](https://lerna.js.org/) to publish them to [npm](https://www.npmjs.com/). This enforces certain steps in the workflow which are described in details in [packages](https://github.com/WordPress/gutenberg/blob/HEAD/packages/README.md) documentation.

Maintaining dozens of npm packages is difficult—it can be tough to keep track of changes. That's why we use `CHANGELOG.md` files for each package to simplify the release process. As a contributor, you should add an entry to the aforementioned file each time you contribute adding production code as described in [Maintaining Changelogs](https://github.com/WordPress/gutenberg/blob/HEAD/packages/README.md#maintaining-changelogs) section.

Publishing WordPress packages to npm is automated by synchronizing it with the bi-weekly Gutenberg plugin RC1 release. You can learn more about this process and other ways to publish new versions of npm packages in the [Gutenberg Release Process document](/docs/contributors/code/release/README.md#publication-of-packages).

## Internal workspaces (tools and tests)

The repository also contains internal workspaces under `tools/` and `test/` for development tooling and test infrastructure. When you need to add a new tool, script, or dependency for repo-level work, create a workspace under `tools/` (or add to an existing one) instead of adding dependencies to the root `package.json`. See the [Workspace Development guide](/docs/contributors/code/workspace-development.md) for the conversion pattern, CI conventions, and reference examples.

## Supply chain policy

`.npmrc` opts in to the npm v12 defaults that refuse git references (`EALLOWGIT`) and tarball URLs (`EALLOWREMOTE`), and extends that to local tarball files (`EALLOWFILE`). Local directories stay at the npm default, which gates nothing here: the `file:` links between workspaces resolve as workspaces rather than directory dependencies.

Install scripts are opt-in: every dependency that ships one is recorded in `allowScripts` in the root `package.json`, and `strict-allow-scripts` fails the install with `ESTRICTALLOWSCRIPTS` on anything missing from that list. Every entry is `false`, so nothing compiles on install. `test/ai-development` installs with `--prefix`, so it carries its own copy of the policy.

`allowScripts` covers dependencies only. Once it is set, workspace lifecycle scripts are skipped under `install-strategy=linked` with no error ([npm/cli#9982](https://github.com/npm/cli/issues/9982)), so a workspace that must run on install is invoked from the root `postinstall` instead, as `@wordpress/icons` is.

When an install fails that way, read the script, then edit `allowScripts` by hand and commit the `package.json` change. Use the package name on its own to cover every version, or `name@version` to pin an approval to the version you reviewed:

```json
"allowScripts": {
	"some-package": false,
	"another-package@1.2.3": true
}
```

Do not use the `npm install-scripts` subcommands until an npm release ships [npm/cli#9941](https://github.com/npm/cli/pull/9941). All of them read the hoisted layout, so under `install-strategy=linked` they misbehave: `ls` reports covered packages as uncovered, `prune` deletes every entry as unused, and `approve` and `deny` write unusable `node_modules/.store` paths instead of the package name.
