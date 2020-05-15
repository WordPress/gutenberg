# Managing Packages

This repository uses [lerna] to manage WordPress modules and publish them as packages to [npm].

## Creating a New Package

When creating a new package, you need to provide at least the following:

1. `package.json` based on the template:
    ```json
    {
    	"name": "@wordpress/package-name",
    	"version": "1.0.0-prerelease",
    	"description": "Package description.",
    	"author": "The WordPress Contributors",
    	"license": "GPL-2.0-or-later",
    	"keywords": [ "wordpress" ],
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
    		"@babel/runtime": "^7.9.2"
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
4. `CHANGELOG.md` file containing at least:
    ```
    <!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/master/packages#maintaining-changelogs. -->

	## Unreleased

	Initial release.
    ```

## Managing Dependencies

There are two types of dependencies that you might want to add to one of the existing WordPress packages.

### Production Dependencies

Production dependencies are stored in the `dependencies` section of the package’s `package.json` file.

#### Adding New Dependencies

The simplest way to add a production dependency to one of the packages is to run a very convenient [lerna add](https://github.com/lerna/lerna/tree/master/commands/add#readme) command from the root of the project.

_Example:_

```bash
lerna add lodash packages/a11y
```

This command adds the latest version of `lodash` as a dependency to the `@wordpress/a11y` package, which is located in `packages/a11y` folder.

#### Removing Existing Dependencies

Removing a dependency from one of the WordPress packages requires some manual work. You need to remove the line in the corresponding `dependencies` section of the `package.json` file.

_Example:_

```diff
+++ b/packages/scripts/package.json
@@ -43,7 +43,6 @@
                "check-node-version": "^3.1.1",
                "cross-spawn": "^5.1.0",
                "eslint": "^6.8.0",
-               "jest": "^25.3.0",
                "jest-puppeteer": "^4.4.0",
                "minimist": "^1.2.0",
                "npm-package-json-lint": "^3.6.0",
```

Next, you need to run `npm install` in the root of the project to ensure that `package-lock.json` file gets properly regenerated.

#### Updating Existing Dependencies

This is the most confusing part of working with [lerna] which causes a lot of hassles for contributors. The most successful strategy so far is to do the following:
 1. First, remove the existing dependency as described in the previous section.
 2. Next, add the same dependency back as described in the first section of this chapter. This time it wil get the latest version applied unless you enforce a different version explicitly.

### Development Dependencies

In contrast to production dependencies, development dependencies shouldn't be stored in individual WordPress packages. Instead they should be installed in the project's `package.json` file using the usual `npm install` command. In effect, all development tools are configured to work with every package at the same time to ensure they share the same characteristics and integrate correctly with each other.

_Example:_

```bash
npm install glob --save-dev
```

This commands adds the latest version of `glob` as a development dependency to the `package.json` file. It has to be executed from the root of the project.

## Maintaining Changelogs

In maintaining dozens of npm packages, it can be tough to keep track of changes. To simplify the release process, each package includes a `CHANGELOG.md` file which details all published releases and the unreleased ("Unreleased") changes, if any exist.

For each pull request, you should always include relevant changes in a "Unreleased" heading at the top of the file. You should add the heading if it doesn't already exist.

_Example:_

```md
<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/master/packages#maintaining-changelogs. -->

## Unreleased

### Bug Fix

-   Fixed an off-by-one error with the `sum` function.
```

There are a number of common release subsections you can follow. Each is intended to align to a specific meaning in the context of the [Semantic Versioning (`semver`) specification](https://semver.org/) the project adheres to. It is important that you describe your changes accurately, since this is used in the packages release process to help determine the version of the next release.

-   "Breaking Change" - A backwards-incompatible change which requires specific attention of the impacted developers to reconcile (requires a major version bump).
-   "New Feature" - The addition of a new backwards-compatible function or feature to the existing public API (requires a minor version bump).
-   "Enhancement" - Backwards-compatible improvements to existing functionality (requires a minor version bump).
-   "Bug Fix" - Resolutions to existing buggy behavior (requires a patch version bump).
-   "Internal" - Changes which do not have an impact on the public interface or behavior of the module (requires a patch version bump).

While other section naming can be used when appropriate, it's important that are expressed clearly to avoid confusion for both the packages releaser and third-party consumers.

When in doubt, refer to [Semantic Versioning specification](https://semver.org/).

If you are publishing new versions of packages, note that there are versioning recommendations outlined in the [Gutenberg Release Process document](https://github.com/WordPress/gutenberg/blob/master/docs/contributors/release.md) which prescribe _minimum_ version bumps for specific types of releases. The chosen version should be the greater of the two between the semantic versioning and Gutenberg release minimum version bumps.

## Releasing Packages

Lerna automatically releases all outdated packages. To check which packages are outdated and will be released, type `npm run publish:check`.

If you have the ability to publish packages, you _must_ have [2FA enabled](https://docs.npmjs.com/getting-started/using-two-factor-authentication) on your [npm account][npm].

### Before Releasing

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

### Development Release

Run the following command to release a dev version of the outdated packages.

```bash
npm run publish:dev
```

Lerna will ask you which version number you want to choose for each package. For a `dev` release, you'll more likely want to choose the "prerelease" option. Repeat the same for all the outdated packages and confirm your version updates.

Lerna will then publish to [npm], commit the `package.json` changes and create the git tags.

### Production Release

To release a production version for the outdated packages, run the following command:

```bash
npm run publish:prod
```

Choose the correct version based on `CHANGELOG.md` files, confirm your choices and let Lerna do its magic.

### Legacy Patch Release

To release a patch for the older major or minor version of packages, run the following command:

```bash
npm run publish:patch
```

This is usually necessary when adding bug fixes or security patches to the earlier versions of WordPress. This will publish only a patch version of the built packages. This is useful for backpublishing certain packages to WordPress.

## TypeScript

The [TypeScript](http://www.typescriptlang.org/) language is a typed superset of JavaScript that compiles to plain JavaScript.
Gutenberg does not use the TypeScript language, however TypeScript has powerful tooling that can be applied to JavaScript projects.

Gutenberg uses TypeScript for several reasons, including:

-   Powerful editor integrations improve developer experience.
-   Type system can detect some issues and lead to more robust software.
-   Type declarations can be produced to allow other projects to benefit from these advantages as well.

### Using TypeScript

Gutenberg uses TypeScript by running the TypeScript compiler (`tsc`) on select packages.
These packages benefit from type checking and produced type declarations in the published packages.

To opt-in to TypeScript tooling, packages should include a `tsconfig.json` file in the package root and add an entry to the root `tsconfig.json` references.
The changes will indicate that the package has opted-in and will be included in the TypeScript build process.

A `tsconfig.json` file should look like the following (comments are not necessary):

```jsonc
{
	// Extends a base configuration common to most packages
	"extends": "../../tsconfig.base.json",

	// Options for the TypeScript compiler
	// We'll usually set our `rootDir` and `declarationDir` as follows, which is specific
	// to each project.
	"compilerOptions": {
		"rootDir": "src",
		"declarationDir": "build-types"
	},

	// Which source files should be included
	"include": [ "src/**/*" ],

	// Other WordPress package dependencies that have opted-in to TypeScript should be listed
	// here. In this case, our package depends on `@wordpress/dom-ready`.
	"references": [ { "path": "../dom-ready" } ]
}
```

Type declarations will be produced in the `build-types` which should be included in the published package.
For consumers to use the published type declarations, we'll set the `types` field in `package.json`:

```json
{
	"main": "build/index.js",
	"main-module": "build-module/index.js",
	"types": "build-types"
}
```

Ensure that the `build-types` directory will be included in the published package, for example if a `files` field is declared.

[lerna]: https://lerna.js.org/
[npm]: https://www.npmjs.com/

## Side effects

### What are side effects?

Many `@wordpress` packages make use of side effects in their code. A side effect, in an ES module context, is code that performs some externally-visible behavior (that is, behavior which is visible outside the module) when the module is loaded.

Here is an example:

```js
import { registerStore } from '@wordpress/data';

const store = registerStore( STORE_KEY, {
  // ...
} );
```

`registerStore` is being called at the top level, which means that it will run as soon as the module first gets imported. These changes are visible externally, since things are being modified in an external store, that lives in another module. Other examples of side effects include setting globals on `window`, or adding browser behavior through polyfills.

However, if this were to happen inside of an `init` function that doesn't get called on module load, then that would no longer be a side effect:

```js
import { registerStore } from '@wordpress/data';

export function init() {
  const store = registerStore( STORE_KEY, {
		// ...
	} );
}

// `init` doesn't get called at the top level of the module,
// therefore importing the module doesn't cause side effects.
```

Declaring a variable or performing any modification at the top level that only affects the current module isn't a side effect either, since it's contained to the module:

```js
import list from './list';

// Not a side effect.
let localVariable = [];
// Not a side effect, either.
for ( const entry of list ) {
	localVariable.push( processListEntry( entry ) );
}
```

### The influence of side effects on bundling

Modern bundlers have the concept of tree-shaking, where unused code is removed from the final bundles, as it's not necessary. This becomes important in libraries that offer a lot of different functionality, since consumers of that library may only be using a small portion of it, and don't want their bundles to be larger than necessary.

These libraries should thus take steps to ensure they can indeed be correctly tree-shaken, and `@wordpress` packages are no exception.

This brings us back to side effects. As we've seen, side effects are code that runs simply by virtue of importing a module, and has an external influence of some sort. This means that the code cannot be tree-shaken away; it needs to run, because it changes things outside of the module that may be needed elsewhere.

Unfortunately, side effects are hard to determine automatically, and some bundlers err on the side of caution, assuming that every module potentially has side effects. This becomes a problem for `index` modules which re-export things from other modules, as that effectively means everything in there must now be bundled together:

```js
// index.js

export { a, b } from './module1';
export { c, d, e } from './module2';
export { f } from './module3';

// Nothing can be tree-shaken away, because the bundler doesn't know if
// this or the re-exported modules have any side effects.
```

### Telling bundlers about side effects

Since bundlers can't figure out side effects for themselves, we need to explicitly declare them. That's done in a package's `package.json`. For example, if a package has no side effects, it can simply set `sideEffects` to `false`:

```json
{
	"name": "package",
	"sideEffects": false
}
```

If it has a few files with side effects, it can list them:

```json
{
	"name": "package",
	"sideEffects": [ "dist/store/index.js", "dist/polyfill/index.js" ]
}
```

This allows the bundler to assume that only the modules that were declared have side effects, and *nothing else does*. Of course, this means that we need to be careful to include everything that *does* have side effects, or problems can arise in applications that make use of the package.

### The approach in `@wordpress`

In order to reduce maintenance cost and minimize the chance of breakage, we opted for using inverse globs for a number of `@wordpress` packages, where we list the paths that *do not* include side effects, leaving the bundler to assume that everything else does. Here's an example:

```json
{
		"sideEffects": [
			"!((src|build|build-module)/(components|utils)/**)"
		],
}
```

The above means that the bundler should assume that anything outside the `components` and `utils` directories contains side effects, and nothing in those directories does. These directories can be inside of a `src`, `build`, or `build-module` top-level directory in the package, due to the way `@wordpress` packages are built.

This approach should guarantee that everything in `components` and `utils` can be tree-shaken. It will only potentially cause problems if one of the files in there uses side effects, which would be a bad practice for a component or utility file.
