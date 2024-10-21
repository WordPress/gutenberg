# Managing Packages

This repository uses [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces) to manage WordPress packages and [lerna](https://lerna.js.org/) to publish them with to [npm](https://www.npmjs.com/).

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
    	"homepage": "https://github.com/WordPress/gutenberg/tree/HEAD/packages/package-name/README.md",
    	"repository": {
    		"type": "git",
    		"url": "https://github.com/WordPress/gutenberg.git",
    		"directory": "packages/package-name"
    	},
    	"bugs": {
    		"url": "https://github.com/WordPress/gutenberg/issues"
    	},
    	"main": "build/index.js",
    	"module": "build-module/index.js",
    	"react-native": "src/index",
    	"dependencies": {
    		"@babel/runtime": "7.25.7"
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
    - API documentation, if applicable ([more info](#maintaining-api-documentation))
    - A link to the contributing guidelines ([here's an example](https://github.com/WordPress/gutenberg/tree/HEAD/packages/a11y/README.md#contributing-to-this-package) from the a11y package)
    - `Code is Poetry` logo (`<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>`)
4. `CHANGELOG.md` file containing at least:

    ```
    <!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

    ## Unreleased

    Initial release.
    ```

To ensure your package is recognized, you should also _manually_ add your new package to the root `package.json` file and then run `npm install` to update the dependencies.

## Managing Dependencies

There are two types of dependencies that you might want to add to one of the existing WordPress packages.

### Production Dependencies

Production dependencies are stored in the `dependencies` section of the package’s `package.json` file.

#### Adding New Dependencies

The simplest way to add a production dependency to one of the packages is to run a command like the following from the root of the project.

_Example:_

```bash
npm install change-case -w packages/a11y
```

This command adds the latest version of `change-case` as a dependency to the `@wordpress/a11y` package, which is located in `packages/a11y` folder.

#### Removing Existing Dependencies

Removing a dependency from one of the WordPress packages requires some manual work. You need to remove the line in the corresponding `dependencies` section of the `package.json` file.

_Example:_

```diff
+++ b/packages/scripts/package.json
@@ -43,7 +43,6 @@
                "check-node-version": "^4.1.0",
                "cross-spawn": "^5.1.0",
                "eslint": "^7.1.0",
-               "jest": "^29.6.2",
                "minimist": "^1.2.0",
                "npm-package-json-lint": "^6.4.0",
```

Next, you need to run `npm install` in the root of the project to ensure that `package-lock.json` file gets properly regenerated.

#### Updating Existing Dependencies

This is the most confusing part of working with [monorepo] which causes a lot of hassles for contributors. The most successful strategy so far is to do the following:

1.  First, remove the existing dependency as described in the previous section.
2.  Next, add the same dependency back as described in the first section of this chapter. This time it will get the latest version applied unless you enforce a different version explicitly.

### Development Dependencies

In contrast to production dependencies, development dependencies shouldn't be stored in individual WordPress packages. Instead they should be installed in the project's `package.json` file using the usual `npm install` command. In effect, all development tools are configured to work with every package at the same time to ensure they share the same characteristics and integrate correctly with each other.

_Example:_

```bash
npm install glob --save-dev
```

This commands adds the latest version of `glob` as a development dependency to the `package.json` file. It has to be executed from the root of the project.

## Maintaining API documentation

Each public API change needs to be reflected in the corresponding API documentation. To ensure that code and documentation are in sync automatically, Gutenberg has developed a few utilities.

Packages can add the following HTML comment within their top-level `README.md`:

```markdown
<!-- START TOKEN(Autogenerated API docs) -->

Content within the HTML comment will be replaced by the generated documentation.

<!-- END TOKEN(Autogenerated API docs) -->`.
```

Each time there is a commit to the public API of the package the `README.md` will be updated and kept in sync.

The above snippet within the package's `README.md` signals the Gutenberg utilities to go to `src/index.js` and extract the JSDoc comments of the export statements into a more friendly format.

Packages may want to use a different source file or add the exports of many files into the same `README.md` (see `packages/core-data/README.md` as an example); they can do so by adding the relative path to be used as source into the HTML comment:

```markdown
<!-- START TOKEN(Autogenerated API docs|src/actions.js) -->

Content within the HTML comment will be replaced by the generated documentation.

<!-- END TOKEN(Autogenerated API docs|src/actions.js) -->`.
```

## Maintaining a Public API

It's very important to have a good plan for what a new package will include. All constants, methods, and components exposed from the package will ultimately become part of the public API in WordPress core (exposed via the `wp` global - eg: `wp.blockEditor`) and as such will need to be supported indefinitely. You should be very selective in what is exposed by your package and [ensure it is well documented](#maintaining-api-documentation).

## Maintaining Changelogs

When maintaining dozens of npm packages, it can be tough to keep track of changes. To simplify the release process, each package includes a `CHANGELOG.md` file which details all published releases and the unreleased ("Unreleased") changes, if any exist.

For each pull request, you should always include relevant changes under an "Unreleased" heading at the top of the file. You should add the heading if it doesn't already exist.

_Example:_

```md
<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Bug Fix

-   Fixed an off-by-one error with the `sum` function.
```

There are a number of common release subsections you can follow. Each is intended to align to a specific meaning in the context of the [Semantic Versioning (`semver`) specification](https://semver.org/) the project adheres to. It is important that you describe your changes accurately, since this is used in the packages release process to help determine the version of the next release.

-   "Breaking Changes" - A backwards-incompatible change which requires specific attention of the impacted developers to reconcile (requires a major version bump).
-   "New Features" - The addition of a new backwards-compatible function or feature to the existing public API (requires a minor version bump).
-   "Enhancements" - Backwards-compatible improvements to existing functionality (requires a minor version bump).
-   "Deprecations" - Deprecation notices. These do not impact the public interface or behavior of the module (requires a minor version bump).
-   "Bug Fixes" - Resolutions to existing buggy behavior (requires a patch version bump).
-   "Internal" - Changes which do not have an impact on the public interface or behavior of the module (requires a patch version bump).

While other section naming can be used when appropriate, it's important that are expressed clearly to avoid confusion for both the packages releaser and third-party consumers.

When in doubt, refer to [Semantic Versioning specification](https://semver.org/).

If you are publishing new versions of packages, note that there are versioning recommendations outlined in the [Gutenberg Release Process document](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/release.md) which prescribe _minimum_ version bumps for specific types of releases. The chosen version should be the greater of the two between the semantic versioning and Gutenberg release minimum version bumps.

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
The changes will indicate that the package has opted in and will be included in the TypeScript build process.

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

## Optimizing for bundlers

In order for bundlers to tree-shake packages effectively, they often need to know whether a package includes side effects in its code. This is done through the `sideEffects` field in the package's `package.json`.

If your package has no side effects, simply set the field to `false`:

```json
{
	"name": "package",
	"sideEffects": false
}
```

If your package includes a few files with side effects, you can list them instead:

```json
{
	"name": "package",
	"sideEffects": [
		"file-with-side-effects.js",
		"another-file-with-side-effects.js"
	]
}
```

Please consult the [side effects documentation](https://github.com/WordPress/gutenberg/blob/HEAD/packages/side-effects.md) for more information on identifying and declaring side effects.

## Publishing to npm

Publishing WordPress packages to npm is automated by synchronizing it with the bi-weekly Gutenberg plugin RC1 release. You can learn more about this process and other ways to publish new versions of npm packages in the [Gutenberg Release Process document](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/release.md#packages-releases-to-npm-and-wordpress-core-updates).
