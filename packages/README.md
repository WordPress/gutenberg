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
			"@babel/runtime": "^7.0.0"
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

Maintaining dozens of npm packages is difficult—it can be tough to keep track of changes. That's why we use `CHANGELOG.md` files for each package to simplify the release process. All packages should follow the [Semantic Versioning (`semver`) specification](https://semver.org/).

The developer who proposes a change (pull request) is responsible for choosing the correct version increment (`major`, `minor`, or `patch`) according to the following guidelines:

- Major version X (X.y.z | X > 0) should be changed with any backward incompatible/"breaking" change. This will usually occur at the final stage of deprecating and removing of a feature.
- Minor version Y (x.Y.z | x > 0) should be changed when you add functionality or change functionality in a backward compatible manner. It must be incremented if any public API functionality is marked as deprecated.
- Patch version Z (x.y.Z | x > 0) should be incremented when you make backward compatible bug fixes.

When in doubt, refer to [Semantic Versioning specification](https://semver.org/).

_Example:_

```md
## v1.2.2 (Unreleased)

### Bug Fix

- ...
- ...
```

- If you need to add something considered a bug fix, you add the item to `Bug Fix` section and leave the version as 1.2.2.
- If it's a new feature, you add the item to `New Feature` section and change version to 1.3.0.
- If it's a breaking change you want to introduce, add the item to `Breaking Change` section and bump the version to 2.0.0.
- If you struggle to classify a change as one of the above, then it might be not necessary to include it.

The version bump is only necessary if one of the following applies:
 - There are no other unreleased changes.
 - The type of change you're introducing is incompatible (more severe) than the other unreleased changes.

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

Run the following command to release a dev version of the outdated packages, replacing `123456` with your 2FA code. Make sure you're using a freshly generated 2FA code, rather than one that's about to timeout. This is a little cumbersome but helps to prevent the release process from dying mid-deploy.

```bash
NPM_CONFIG_OTP=123456 npm run publish:dev
```

Lerna will ask you which version number you want to choose for each package. For a `dev` release, you'll more likely want to choose the "prerelease" option. Repeat the same for all the outdated packages and confirm your version updates.

Lerna will then publish to [npm], commit the `package.json` changes and create the git tags.

#### Production Release

To release a production version for the outdated packages, run the following command, replacing `123456` with your (freshly generated, as above) 2FA code:

```bash
NPM_CONFIG_OTP=123456 npm run publish:prod
```

Choose the correct version based on `CHANGELOG.md` files, confirm your choices and let Lerna do its magic.

[lerna]: https://lernajs.io/
[npm]: https://www.npmjs.com/
