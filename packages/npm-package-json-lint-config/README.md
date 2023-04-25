# NPM Package.json Lint Config

WordPress [npm-package-json-lint](https://github.com/tclindner/npm-package-json-lint) shareable configuration.

## Installation

Install the module

```shell
$ npm install @wordpress/npm-package-json-lint-config
```

**Note**: This package requires Node.js 14.0.0 or later. It is not compatible with older versions.

## Usage

Add this to your `package.json` file:

```json
"npmpackagejsonlint": {
	"extends": "@wordpress/npm-package-json-lint-config",
},
```

Or to a `.npmpackagejsonlintrc.json` file in the root of your repo:

```json
{
	"extends": "@wordpress/npm-package-json-lint-config"
}
```

To add, modify, or override any [npm-package-json-lint](https://github.com/tclindner/npm-package-json-lint/wiki) rules add this to your `package.json` file:

```json
"npmpackagejsonlint": {
	"extends": "@wordpress/npm-package-json-lint-config",
	"rules": {
		"valid-values-author": [
			"error",
			[
				"WordPress"
			]
		]
	}
},
```

Or to a `.npmpackagejsonlintrc.json` file in the root of your repo:

```json
{
	"extends": "@wordpress/npm-package-json-lint-config",
	"rules": {
		"require-publishConfig": "error",
		"valid-values-author": [ "error", [ "WordPress" ] ]
	}
}
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
