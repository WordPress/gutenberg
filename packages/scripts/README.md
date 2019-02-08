# Scripts

Collection of reusable scripts for WordPress development.

Command-line interfaces help to turn working with an app into a pleasant experience, but it is still not enough to keep it easy to maintain in the long run. Developers are left on their own to keep all configurations and dependent tools up to date. This problem multiplies when they own more than one project which shares the same setup. Fortunately, there is a pattern that can simplify maintainers life – reusable scripts. This idea boils down to moving all the necessary configurations and scripts to one single tool dependency. In most cases, it should be possible to accomplish all tasks using the default settings, but some customization is allowed, too. With all that in place updating all projects should become a very straightforward task.

_This package is inspired by [react-scripts](https://www.npmjs.com/package/react-scripts) and [kcd-scripts](https://www.npmjs.com/package/kcd-scripts)._

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
		"check-licenses": "wp-scripts check-licenses --production",
		"lint:css": "wp-scripts lint-style '**/*.css'",
		"lint:js": "wp-scripts lint-js .",
		"lint:pkg-json": "wp-scripts lint-pkg-json .",
		"test:e2e": "wp-scripts test-e2e",
		"test:unit": "wp-scripts test-unit-js"
	}
}
```

## Available Scripts

### `build`

Builds the code to the designated `build` folder in the configuration file. It correctly bundles code in production mode and optimizes the build for the best performance. Your code is ready to be deployed. It uses [Webpack](https://webpack.js.org/) behind the scenes and you still need to provide your own config as described in the [documentation](https://webpack.js.org/concepts/configuration/).

_Example:_

```json
{
	"scripts": {
		"build": "wp-scripts build"
	}
}
```

This is how you execute the script with presented setup:
* `npm run build` - builds the code for production.


### `check-engines`

Checks if the current `node`, `npm` (or `yarn`) versions match the given [semantic version](https://semver.org/) ranges. If the given version is not satisfied, information about installing the needed version is printed and the program exits with an error code. It uses [check-node-version](https://www.npmjs.com/package/check-node-version) behind the scenes with the recommended configuration provided. You can specify your own ranges as described in [check-node-version docs](https://www.npmjs.com/package/check-node-version).

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

### `check-licenses`

Validates that all dependencies of a project are compatible with the project's own license.

_Example:_

```json
{
	"scripts": {
		"check-licenses": "wp-scripts check-licenses --prod --gpl2 --ignore=abab"
	}
}
```

_Flags_:

- `--prod` (or `--production`): When present, validates only `dependencies` and not `devDependencies`
- `--dev` (or `--development`): When present, validates both `dependencies` and `devDependencies`
- `--gpl2`: Validates against [GPLv2 license compatibility](https://www.gnu.org/licenses/license-list.en.html)
- `--ignore=a,b,c`: A comma-separated set of package names to ignore for validation. This is intended to be used primarily in cases where a dependency's `license` field is malformed. It's assumed that any `ignored` package argument would be manually vetted for compatibility by the project owner.

### `lint-js`

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
* `npm run lint:js` - lints JavaScript files in the entire project's directories.

### `lint-pkg-json`

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

### `lint-style`

Helps enforce coding style guidelines for your style files. It uses [stylelint](https://github.com/stylelint/stylelint) with the [stylelint-config-wordpress](https://github.com/WordPress-Coding-Standards/stylelint-config-wordpress) configuration per the [WordPress CSS Coding Standards](https://make.wordpress.org/core/handbook/best-practices/coding-standards/css/). You can override them with your own rules as described in [stylelint user guide](https://github.com/stylelint/stylelint/docs/user-guide.md).

_Example:_

```json
{
	"scripts": {
		"lint:css": "wp-scripts lint-style '**/*.css'"
	}
}
```

This is how you execute the script with presented setup:
* `npm run lint:css` - lints CSS files in the whole project's directory.

### `start`

Builds the code for development to the designated `build` folder in the configuration file. The script will automatically rebuild if you make changes to the code. You will see the build errors in the console. It uses [Webpack](https://webpack.js.org/) behind the scenes and you still need to provide your own config as described in the [documentation](https://webpack.js.org/concepts/configuration/).

_Example:_

```json
{
	"scripts": {
		"start": "wp-scripts start"
	}
}
```

This is how you execute the script with presented setup:
* `npm start` - starts the build for development.

### `test-e2e`

Launches the End-To-End (E2E) test runner. It uses [Jest](https://jestjs.io/) behind the scenes and you are able to utilize all of its [CLI options](https://jestjs.io/docs/en/cli.html). You can also run `./node_modules/.bin/wp-scripts test:e2e --help` or `npm run test:e2e:help` (as presented below) to view all of the available options.

Writing tests can be done using Puppeteer API:
 
> [Puppeteer](https://pptr.dev/) is a Node library which provides a high-level API to control Chrome or Chromium over the [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). Puppeteer runs [headless](https://developers.google.com/web/updates/2017/04/headless-chrome) by default, but can be configured to run full (non-headless) Chrome or Chromium.

_Example:_

```json
{
	"scripts": {
		"test:e2e": "wp-scripts test-e2e",
		"test:e2e:help": "wp-scripts test-e2e --help"
	}
}
```

This is how you execute those scripts using the presented setup:
* `npm run test:e2e` - runs all unit tests.
* `npm run test:e2e:help` - prints all available options to configure unit tests runner.

This script automatically detects the best config to start Puppeteer but sometimes you may need to specify custom options:
 - You can add a `jest-puppeteer.config.js` at the root of the project or define a custom path using `JEST_PUPPETEER_CONFIG` environment variable. Check [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer#jest-puppeteerconfigjs) for more details.

We enforce that all tests run serially in the current process using [--runInBand](https://jestjs.io/docs/en/cli#runinband) Jest CLI option to avoid conflicts between tests caused by the fact that they share the same WordPress instance.

### `test-unit-js`

_Alias_: `test-unit-jest` 

Launches the unit test runner. It uses [Jest](https://jestjs.io/) behind the scenes and you are able to utilize all of its [CLI options](https://jestjs.io/docs/en/cli.html). You can also run `./node_modules/.bin/wp-scripts test-unit-js --help` or `npm run test:unit:help` (as presented below) to view all of the available options. By default, it uses the set of recommended options defined in [@wordpress/jest-preset-default](https://www.npmjs.com/package/@wordpress/jest-preset-default) npm package. You can override them with your own options as described in [Jest documentation](https://jestjs.io/docs/en/configuration).

_Example:_

```json
{
	"scripts": {
		"test:unit": "wp-scripts test-unit-js",
		"test:unit:help": "wp-scripts test-unit-js --help",
		"test:unit:watch": "wp-scripts test-unit-js --watch"
	}
}
```

This is how you execute those scripts using the presented setup:
* `npm run test:unit` - runs all unit tests.
* `npm run test:unit:help` - prints all available options to configure unit tests runner.
* `npm run test:unit:watch` - runs all unit tests in the watch mode.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
