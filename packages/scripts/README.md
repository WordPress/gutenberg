# Scripts

Collection of reusable scripts for WordPress development. For convenience, every tool provided in this package comes with a recommended configuration.

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
		"build": "wp-scripts build",
		"check-engines": "wp-scripts check-engines",
		"check-licenses": "wp-scripts check-licenses --production",
		"lint:css": "wp-scripts lint-style '**/*.css'",
		"lint:js": "wp-scripts lint-js .",
		"lint:pkg-json": "wp-scripts lint-pkg-json .",
		"start": "wp-scripts start",
		"test:e2e": "wp-scripts test-e2e",
		"test:unit": "wp-scripts test-unit-js"
	}
}
```

It might also be a good idea to get familiar with the [JavaScript Build Setup tutorial](/docs/designers-developers/developers/tutorials/javascript/js-build-setup.md) for setting up a development environment to use ESNext syntax. It gives a very in-depth explanation of how to use the [build](#build) and [start](#start) scripts.

## Available Scripts

### `build`

Transforms your code according the configuration provided so it's ready for production and optimized for the best performance. The entry point for your project's code should be located in `src/index.js`. The output generated will be written to `build/index.js`. This script exits after producing a single build. For incremental builds, better suited for development, see the [start](#start) script.

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

#### Advanced information

This script uses [webpack](https://webpack.js.org/) behind the scenes. It'll look for a webpack config in the top-level directory of your package and will use it if it finds one. If none is found, it'll use the default config provided by `@wordpress/scripts` packages. Learn more in the [Advanced Usage](#advanced-usage) section.

### `check-engines`

Checks if the current `node`, `npm` (or `yarn`) versions match the given [semantic version](https://semver.org/) ranges. If the given version is not satisfied, information about installing the needed version is printed and the program exits with an error code.

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

#### Advanced information

It uses [check-node-version](https://www.npmjs.com/package/check-node-version) behind the scenes with the recommended configuration provided. You can specify your own ranges as described in [check-node-version docs](https://www.npmjs.com/package/check-node-version). Learn more in the [Advanced Usage](#advanced-usage) section.

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

Helps enforce coding style guidelines for your JavaScript files.

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

#### Advanced information

It uses [eslint](https://eslint.org/) with the set of recommended rules defined in [@wordpress/eslint-plugin](https://www.npmjs.com/package/@wordpress/eslint-plugin) npm package. You can override default rules with your own as described in [eslint docs](https://eslint.org/docs/rules/). Learn more in the [Advanced Usage](#advanced-usage) section.

### `lint-pkg-json`

Helps enforce standards for your `package.json` files.

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

#### Advanced information

It uses [npm-package-json-lint](https://www.npmjs.com/package/npm-package-json-lint) with the set of recommended rules defined in [@wordpress/npm-package-json-lint-config](https://www.npmjs.com/package/@wordpress/npm-package-json-lint-config) npm package. You can override default rules with your own as described in [npm-package-json-lint wiki](https://github.com/tclindner/npm-package-json-lint/wiki). Learn more in the [Advanced Usage](#advanced-usage) section.

### `lint-style`

Helps enforce coding style guidelines for your style files.

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

#### Advanced information

It uses [stylelint](https://github.com/stylelint/stylelint) with the [stylelint-config-wordpress](https://github.com/WordPress-Coding-Standards/stylelint-config-wordpress) configuration per the [WordPress CSS Coding Standards](https://make.wordpress.org/core/handbook/best-practices/coding-standards/css/). You can override them with your own rules as described in [stylelint user guide](https://github.com/stylelint/stylelint/docs/user-guide.md). Learn more in the [Advanced Usage](#advanced-usage) section.

### `start`

Transforms your code according the configuration provided so it's ready for development. The script will automatically rebuild if you make changes to the code, and you will see the build errors in the console. The entry point for your project's code should be located in `src/index.js`. The output generated will be written to `build/index.js`. For single builds, better suited for production, see the [build](#build) script.

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

#### Advanced information

This script uses [webpack](https://webpack.js.org/) behind the scenes. It'll look for a webpack config in the top-level directory of your package and will use it if it finds one. If none is found, it'll use the default config provided by `@wordpress/scripts` packages. Learn more in the [Advanced Usage](#advanced-usage) section.

### `test-e2e`

Launches the End-To-End (E2E) test runner. Writing tests can be done using the [Jest API](https://jestjs.io/docs/en/api) in combination with the [Puppeteer API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md):

> [Jest](https://jestjs.io/) is a delightful JavaScript Testing Framework with a focus on simplicity.

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
* `npm run test-e2e -- --puppeteer-interactive` - runs all unit tests interactively.
* `npm run test-e2e FILE_NAME -- --puppeteer-interactive ` - runs one test file interactively.
* `npm run test-e2e:watch -- --puppeteer-interactive` - runs all tests interactively and watch for changes.

This script automatically detects the best config to start Puppeteer but sometimes you may need to specify custom options:
 - You can add a `jest-puppeteer.config.js` at the root of the project or define a custom path using `JEST_PUPPETEER_CONFIG` environment variable. Check [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer#jest-puppeteerconfigjs) for more details.

We enforce that all tests run serially in the current process using [--runInBand](https://jestjs.io/docs/en/cli#runinband) Jest CLI option to avoid conflicts between tests caused by the fact that they share the same WordPress instance.

#### Advanced information

It uses [Jest](https://jestjs.io/) behind the scenes and you are able to use all of its [CLI options](https://jestjs.io/docs/en/cli.html). You can also run `./node_modules/.bin/wp-scripts test:e2e --help` or `npm run test:e2e:help` (as mentioned above) to view all of the available options. Learn more in the [Advanced Usage](#advanced-usage) section.

### `test-unit-js`

_Alias_: `test-unit-jest`

Launches the unit test runner. Writing tests can be done using the [Jest API](https://jestjs.io/docs/en/api).

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

#### Advanced information

It uses [Jest](https://jestjs.io/) behind the scenes and you are able to use all of its [CLI options](https://jestjs.io/docs/en/cli.html). You can also run `./node_modules/.bin/wp-scripts test:unit --help` or `npm run test:unit:help` (as mentioned above) to view all of the available options. By default, it uses the set of recommended options defined in [@wordpress/jest-preset-default](https://www.npmjs.com/package/@wordpress/jest-preset-default) npm package. You can override them with your own options as described in [Jest documentation](https://jestjs.io/docs/en/configuration). Learn more in the [Advanced Usage](#advanced-usage) section.

## Advanced Usage

In general, this package should be used with the set of recommended config files. While it is possible to override every single config file provided, if you have to do it, it means that your use case is more complex than anticipated. If that happens, it would be better to avoid using the whole abstraction layer and set up your project with full control over tooling used.

### Webpack config

The `build` and `start` commands use [webpack](https://webpack.js.org/) behind the scenes. webpack is a tool that helps you transform your code into something else. For example: it can take code written in ESNext and output ES5 compatible code that is minified for production.

#### Default webpack config

`@wordpress/scripts` bundles the default webpack config used as a base by the WordPress editor. These are the defaults:

* [Entry](https://webpack.js.org/configuration/entry-context/#entry): `src/index.js`
* [Output](https://webpack.js.org/configuration/output): `build/index.js`
* [Externals](https://webpack.js.org/configuration/externals). These are libraries that are to be found in the global scope:

Package | Input syntax | Output
--- | --- | ---
React | `import x from React;` | `var x = window.React.x;`
ReactDOM | `import x from ReactDOM;` | `var x = window.ReactDOM.x;`
moment | `import x from moment;` | `var x = window.moment.x;`
jQuery | `import x from jQuery;` | `var x = window.jQuery.x;`
lodash | `import x from lodash;` | `var x = window.lodash.x;`
lodash-es | `import x from lodash-es;` | `var x = window.lodash.x;`
WordPress packages | `import x from '@wordpress/package-name` | `var x = window.wp.packageName.x`

#### Provide your own webpack config

Should there be any situation where you want to provide your own webpack config, you can do so. The `build` and `start` commands will use your provided file when:

* the command receives a `--config` argument. Example: `wp-scripts build --config my-own-webpack-config.js`.
* there is a file called `webpack.config.js` or `webpack.config.babel.js` in the top-level directory of your package (at the same level than your `package.json`).

##### Extending the webpack config

To extend the provided webpack config, or replace subsections within the provided webpack config, you can provide your own `webpack.config.js` file, `require` the provided `webpack.config.js` file, and use the [`spread` operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) to import all of or part of the provided configuration.

In the example below, a `webpack.config.js` file is added to the root folder extending the provided webpack config to include [`@svgr/webpack`](https://www.npmjs.com/package/@svgr/webpack) and [`url-loader`](https://github.com/webpack-contrib/url-loader):

```javascript
const defaultConfig = require("./node_modules/@wordpress/scripts/config/webpack.config");

module.exports = {
  ...defaultConfig,
  module: {
    ...defaultConfig.module,
    rules: [
      ...defaultConfig.module.rules,
      {
        test: /\.svg$/,
        use: ["@svgr/webpack", "url-loader"]
      }
    ]
  }
};
```
If you follow this approach, please, be aware that future versions of this package may change what webpack and Babel plugins we bundle, default configs, etc. Should those changes be necessary, they will be registered in the [package's CHANGELOG](https://github.com/WordPress/gutenberg/blob/master/packages/scripts/CHANGELOG.md), so make sure to read it before upgrading.
<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
