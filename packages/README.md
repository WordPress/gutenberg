## Managing Packages

This repository uses [lerna] to manage Gutenberg modules and publish them as packages to [npm].

### Creating a New Package

When creating a new package, you need to provide at least the following:

1. `package.json` based on the template:
	```json
	{
		"name": "@wordpress/package-name",
		"version": "1.0.0-beta.0",
		"description": "Package description.",
		"author": "The WordPress Contributors",
		"license": "GPL-2.0-or-later",
		"keywords": [
			"wordpress"
		],
		"homepage": "https://github.com/WordPress/gutenberg/tree/master/packages/package-name/README.md",
		"repository": {
			"type": "git",
			"url": "https://github.com/WordPress/gutenberg.git"
		},
		"bugs": {
			"url": "https://github.com/WordPress/gutenberg/issues"
		},
		"main": "build/index.js",
		"module": "build-module/index.js",
		"react-native": "src/index",
		"dependencies": {
			"@babel/runtime": "^7.4.4"
		},
		"publishConfig": {
			"access": "public"
		}
	}
	```
	This assumes that your code is located in the `src` folder and will be transpiled with `Babel`.
2. `.npmrc` file which disables creating `package-lock.json` file for the package:
	```
	package-lock=false
	```
3. `README.md` file containing at least:
	- Package name
	- Package description
	- Installation details
	- Usage example
	- `Code is Poetry` logo (`<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>`)

### Maintaining Changelogs

In maintaining dozens of npm packages, it can be tough to keep track of changes. To simplify the release process, each package includes a `CHANGELOG.md` file which details all published releases and the unreleased ("Master") changes, if any exist.

For each pull request, you should always include relevant changes in a "Master" heading at the top of the file. You should add the heading if it doesn't already exist.

_Example:_

```md
## Master

### Bug Fix

- Fixed an off-by-one error with the `sum` function.
```

There are a number of common release subsections you can follow. Each is intended to align to a specific meaning in the context of the [Semantic Versioning (`semver`) specification](https://semver.org/) the project adheres to. It is important that you describe your changes accurately, since this is used in the packages release process to help determine the version of the next release.

- "Breaking Change" - A backwards-incompatible change which requires specific attention of the impacted developers to reconcile (requires a major version bump).
- "New Feature" - The addition of a new backwards-compatible function or feature to the existing public API (requires a minor verison bump).
- "Enhancement" - Backwards-compatible improvements to existing functionality (requires a minor version bump).
- "Bug Fix" - Resolutions to existing buggy behavior (requires a patch version bump).
- "Internal" - Changes which do not have an impact on the public interface or behavior of the module (requires a patch version bump).

While other section naming can be used when appropriate, it's important that are expressed clearly to avoid confusion for both the packages releaser and third-party consumers.

When in doubt, refer to [Semantic Versioning specification](https://semver.org/).

If you are publishing new versions of packages, note that there are versioning recommendations outlined in the [Gutenberg Release Process document](https://github.com/WordPress/gutenberg/blob/master/docs/contributors/release.md) which prescribe _minimum_ version bumps for specific types of releases. The chosen version should be the greater of the two between the semantic versioning and Gutenberg release minimum version bumps.

### Releasing Packages

Lerna automatically releases all outdated packages. To check which packages are outdated and will be released, type `npm run publish:check`.

If you have the ability to publish packages, you _must_ have [2FA enabled](https://docs.npmjs.com/getting-started/using-two-factor-authentication) on your [npm account][npm].

#### Before Releasing

Confirm that you're logged in to [npm], by running `npm whoami`. If you're not logged in, run `npm adduser` to login.

If you're publishing a new package, ensure that its `package.json` file contains the correct `publishConfig` settings:

```json
{
	"publishConfig": {
		"access": "public"
	}
}
```

You can check your package configs by running `npm run lint-pkg-json`.

#### Development Release

Run the following command to release a dev version of the outdated packages.

```bash
npm run publish:dev
```

Lerna will ask you which version number you want to choose for each package. For a `dev` release, you'll more likely want to choose the "prerelease" option. Repeat the same for all the outdated packages and confirm your version updates.

Lerna will then publish to [npm], commit the `package.json` changes and create the git tags.

#### Production Release

To release a production version for the outdated packages, run the following command:

```bash
npm run publish:prod
```

Choose the correct version based on `CHANGELOG.md` files, confirm your choices and let Lerna do its magic.

[lerna]: https://lerna.js.org/
[npm]: https://www.npmjs.com/
