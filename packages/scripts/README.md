# Scripts

Collection of JS scripts for WordPress development.

## Installation

Install the module

```bash
npm install @wordpress/scripts --save-dev
```

## Setup

This is a CLI and exposes a binary called `wp-scripts` so you can call it directly. However this module is designed to be configured using the `scripts` section in the `package.json` file of your project.

_Example:_

```json
{
	"scripts": {
		"check-engines": "wp-scripts check-engines",
		"lint:pkg-json": "wp-scripts lint-pkg-json .",
		"test": "wp-scripts test-unit-js"
	}
}
```

## Available Scripts

### `check-engines`

Check if the current `node`, `npm` (or `yarn`) versions match the given [semantic version](https://semver.org/) ranges. If the given version is not satisfied, information about installing the needed version is printed and the program exits with an error code. It uses [check-node-version](https://www.npmjs.com/package/check-node-version) behind the scenes with the recommended configuration provided. You can specify your own ranges as described in [check-node-version docs](https://www.npmjs.com/package/check-node-version).

_Example:_

```json
{
	"scripts": {
		"check-engines": "wp-scripts check-engines"
	}
}
```

This is how you execute the script with presented setup:
* `npm run check-engines` - checks installed version of `node` and `npm`.


### `wp-scripts lint-js`

Helps enforce coding style guidelines for your JavaScript files. It uses [eslint](https://eslint.org/) with the set of recommended rules defined in [@wordpress/eslint-plugin](https://www.npmjs.com/package/@wordpress/eslint-plugin) npm package. You can override default rules with your own as described in [eslint docs](https://eslint.org/docs/rules/).

_Example:_

```json
{
	"scripts": {
		"lint:js": "wp-scripts lint-js ."
	}
}
```

This is how you execute the script with presented setup:
* `npm run lint:js` - lints JavaScripts files in the whole project's.

### `wp-scripts lint-pkg-json`

Helps enforce standards for your package.json files. It uses [npm-package-json-lint](https://www.npmjs.com/package/npm-package-json-lint) with the set of recommended rules defined in [@wordpress/npm-package-json-lint-config](https://www.npmjs.com/package/@wordpress/npm-package-json-lint-config) npm package. You can override default rules with your own as described in [npm-package-json-lint wiki](https://github.com/tclindner/npm-package-json-lint/wiki).

_Example:_

```json
{
	"scripts": {
		"lint:pkg-json": "wp-scripts lint-pkg-json ."
	}
}
```

This is how you execute those scripts using the presented setup:
* `npm run lint:pkg-json` - lints `package.json` file in the project's root folder.

### `wp-scripts test-unit-js`

_Alias_: `wp-scripts test-unit-jest` 

Launches the test runner. It uses [Jest](https://facebook.github.io/jest/) behind the scenes and you are able to utilize all of its [CLI options](https://facebook.github.io/jest/docs/en/cli.html). You can also run `./node_modules/.bin/wp-scripts test-unit-js --help` or `npm run test:help` (as presented below) to view all of the available options. By default, it uses the set of recommended options defined in [@wordpress/jest-preset-default](https://www.npmjs.com/package/@wordpress/jest-preset-default) npm package. You can override them with your own options as described in [Jest documentation](https://jestjs.io/docs/en/configuration).

_Example:_

```json
{
	"scripts": {
		"test": "wp-scripts test-unit-js",
		"test:help": "wp-scripts test-unit-js --help",
		"test:watch": "wp-scripts test-unit-js --watch"
	}
}
```

This is how you execute those scripts using the presented setup:
* `npm run test` or `npm test` - runs all unit tests.
* `npm run test:help` - prints all available options to configure unit tests runner.
* `npm run test:watch` - runs all unit tests in the watch mode.

### `wp-scripts check-licenses`

Validates that all dependencies of a project are compatible with the project's own license.

_Example:_

```json
{
	"scripts": {
		"check-licenses": "wp-scripts check-licenses --prod --gpl2 --ignore=abab",
	}
}
```

_Flags_:

- `--prod` (or `--production`): When present, validates only `dependencies` and not `devDependencies`
- `--dev` (or `--development`): When present, validates both `dependencies` and `devDependencies`
- `--gpl2`: Validates against [GPLv2 license compatibility](https://www.gnu.org/licenses/license-list.en.html)
- `--ignore=a,b,c`: A comma-separated set of package names to ignore for validation. This is intended to be used primarily in cases where a dependency's `license` field is malformed. It's assumed that any `ignored` package argument would be manually vetted for compatibility by the project owner.

## Inspiration

This is inspired by [react-scripts](https://www.npmjs.com/package/react-scripts) and [kcd-scripts](https://www.npmjs.com/package/kcd-scripts).

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
