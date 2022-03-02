# Scripts

This is a collection of reusable scripts tailored for WordPress development. For convenience, every tool provided in this package comes with an integrated recommended configuration.

When working seamlessly, sophisticated command-line interfaces help to turn work with a project into a more pleasant experience. However, it’s a misleading assumption that developers can easily pick the proper tools in the first place and then ensure that they play along with each other, including all their extensions. Besides, it’s still not enough because developers are left on their own to keep all configurations and dependent tools up to date. This problem multiplies when they support more than one project which shares the same setup.

Fortunately, there is a pattern that can simplify maintainers life – reusable scripts. The idea boils down to moving all the necessary configurations and scripts to one single tool dependency. In most cases, it should be possible to accomplish all tasks using the default settings, but some customization is allowed, too. With all that in place, updating all projects should become a very straightforward task.

_This package is inspired by [react-scripts](https://www.npmjs.com/package/react-scripts) and [kcd-scripts](https://www.npmjs.com/package/kcd-scripts)._

## Installation

You only need to install one npm module:

```bash
npm install @wordpress/scripts --save-dev
```

**Note**: This package requires Node.js 12.13.0 or later, and `npm` 6.9.0 or later. It is not compatible with older versions.

## Setup

This package offers a command-line interface and exposes a binary called `wp-scripts` so you can call it directly with `npx` – an npm package runner. However, this module is designed to be configured using the `scripts` section in the `package.json` file of your project. This comprehensive example demonstrates the most of the capabilities included.

_Example:_

```json
{
	"scripts": {
		"build": "wp-scripts build",
		"check-engines": "wp-scripts check-engines",
		"check-licenses": "wp-scripts check-licenses",
		"format": "wp-scripts format",
		"lint:css": "wp-scripts lint-style",
		"lint:js": "wp-scripts lint-js",
		"lint:md:docs": "wp-scripts lint-md-docs",
		"lint:md:js": "wp-scripts lint-md-js",
		"lint:pkg-json": "wp-scripts lint-pkg-json",
		"packages-update": "wp-scripts packages-update",
		"plugin-zip": "wp-scripts plugin-zip",
		"start": "wp-scripts start",
		"test:e2e": "wp-scripts test-e2e",
		"test:unit": "wp-scripts test-unit-js"
	}
}
```

It might also be a good idea to get familiar with the [JavaScript Build Setup tutorial](https://github.com/WordPress/gutenberg/tree/HEAD/docs/how-to-guides/javascript/js-build-setup.md) for setting up a development environment to use ESNext syntax. It gives a very in-depth explanation of how to use the [build](#build) and [start](#start) scripts.

## Updating to New Release

To update an existing project to a new version of `@wordpress/scripts`, open the [changelog](https://github.com/WordPress/gutenberg/blob/HEAD/packages/scripts/CHANGELOG.md), find the version you’re currently on (check `package.json` in the top-level directory of your project), and apply the migration instructions for the newer versions.

In most cases bumping the `@wordpress/scripts` version in `package.json` and running `npm install` in the root folder of your project should be enough, but it’s good to check the [changelog](https://github.com/WordPress/gutenberg/blob/HEAD/packages/scripts/CHANGELOG.md) for potential breaking changes. There is also `packages-update` script included in this package that aims to automate the process of updating WordPress dependencies in your projects.

We commit to keeping the breaking changes minimal so you can upgrade `@wordpress/scripts` as seamless as possible.

## Available Scripts

### `build`

Transforms your code according the configuration provided so it’s ready for production and optimized for the best performance. The entry points for your project get detected by scanning all script fields in `block.json` files located in the `src` directory. The script fields in `block.json` should pass relative paths to `block.json` in the same folder.

_Example:_

```json
{
	"editorScript": "file:index.js",
	"editorStyle": "file:editor.css",
	"style": "file:style.css"
}
```

The fallback entry point is `src/index.js` (other supported extensions: `.jsx`, `.ts`, and `.tsx`) in case there is no `block.json` file found. The output generated will be written to `build/index.js`. This script exits after producing a single build. For incremental builds, better suited for development, see the [start](#start) script.

_Example:_

```json
{
	"scripts": {
		"build": "wp-scripts build",
		"build:custom": "wp-scripts build entry-one.js entry-two.js --output-path=custom",
		"build:copy-php": "wp-scripts build --webpack-copy-php"
	}
}
```

This is how you execute the script with presented setup:

-   `npm run build` - builds the code for production.
-   `npm run build:custom` - builds the code for production with two entry points and a custom output folder. Paths for custom entry points are relative to the project root.
-   `npm run build:copy-php` - builds the code for production and opts into copying PHP files from src src and its subfolders to the dist directory.

This script automatically use the optimized config but sometimes you may want to specify some custom options:

-   `--webpack-no-externals` – disables scripts' assets generation, and omits the list of default externals.
-   `--webpack-bundle-analyzer` – enables visualization for the size of webpack output files with an interactive zoomable treemap.
-   `--webpack-copy-php` – enables copying PHP files from src and its subfolders to the dist directory.

#### Advanced information

This script uses [webpack](https://webpack.js.org/) behind the scenes. It’ll look for a webpack config in the top-level directory of your package and will use it if it finds one. If none is found, it’ll use the default config provided by `@wordpress/scripts` packages. Learn more in the [Advanced Usage](#advanced-usage) section.

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

-   `npm run check-engines` - checks installed version of `node` and `npm`.

#### Advanced information

It uses [check-node-version](https://www.npmjs.com/package/check-node-version) behind the scenes with the recommended configuration provided. The default requirements are set to the same Node.js and npm versions as listed in the [installation](#installation) section for this package. You can specify your own ranges as described in [check-node-version docs](https://www.npmjs.com/package/check-node-version). Learn more in the [Advanced Usage](#advanced-usage) section.

### `check-licenses`

Validates that all dependencies of a project are compatible with the project’s own license.

_Example:_

```json
{
	"scripts": {
		"check-licenses": "wp-scripts check-licenses --prod --gpl2 --ignore=abab"
	}
}
```

_Flags_:

-   `--prod` (or `--production`): When present, validates only `dependencies` and not `devDependencies`
-   `--dev` (or `--development`): When present, validates only `devDependencies` and not `dependencies`
-   `--gpl2`: Validates against [GPLv2 license compatibility](https://www.gnu.org/licenses/license-list.en.html)
-   `--ignore=a,b,c`: A comma-separated set of package names to ignore for validation. This is intended to be used primarily in cases where a dependency’s `license` field is malformed. It’s assumed that any `ignored` package argument would be manually vetted for compatibility by the project owner.

### `format`

It helps to enforce coding style guidelines for your files (JavaScript, YAML) by formatting source code in a consistent way.

_Example:_

```json
{
	"scripts": {
		"format": "wp-scripts format",
		"format:src": "wp-scripts format ./src"
	}
}
```

This is how you execute the script with presented setup:

-   `npm run format` - formats files in the entire project’s directories.
-   `npm run format:src` - formats files in the project’s `src` subfolder’s directories.

When you run commands similar to the `npm run format:src` example above, you can provide a file, a directory, or `glob` syntax or any combination of them.

By default, files located in `build`, `node_modules`, and `vendor` folders are ignored. You can customize the list of ignored files and directories by adding them to a `.prettierignore` file in your project.

### `lint-js`

Helps enforce coding style guidelines for your JavaScript and TypeScript files.

_Example:_

```json
{
	"scripts": {
		"lint:js": "wp-scripts lint-js",
		"lint:js:src": "wp-scripts lint-js ./src"
	}
}
```

This is how you execute the script with presented setup:

-   `npm run lint:js` - lints JavaScript and TypeScript files in the entire project’s directories.
-   `npm run lint:js:src` - lints JavaScript and TypeScript files in the project’s `src` subfolder’s directories.

When you run commands similar to the `npm run lint:js:src` example above, you can provide a file, a directory, or `glob` syntax or any combination of them. See [more examples](https://eslint.org/docs/user-guide/command-line-interface).

By default, files located in `build`, `node_modules`, and `vendor` folders are ignored.

#### Advanced information

It uses [eslint](https://eslint.org/) with the set of recommended rules defined in [@wordpress/eslint-plugin](https://www.npmjs.com/package/@wordpress/eslint-plugin) npm package. You can override default rules with your own as described in [eslint docs](https://eslint.org/docs/rules/). Learn more in the [Advanced Usage](#advanced-usage) section.

### `lint-pkg-json`

Helps enforce standards for your `package.json` files.

_Example:_

```json
{
	"scripts": {
		"lint:pkg-json": "wp-scripts lint-pkg-json",
		"lint:pkg-json:src": "wp-scripts lint-pkg-json ./src"
	}
}
```

This is how you execute those scripts using the presented setup:

-   `npm run lint:pkg-json` - lints `package.json` file in the entire project’s directories.
-   `npm run lint:pkg-json:src` - lints `package.json` file in the project’s `src` subfolder’s directories.

When you run commands similar to the `npm run lint:pkg-json:src` example above, you can provide one or multiple directories to scan as well. See [more examples](https://github.com/tclindner/npm-package-json-lint/blob/HEAD/README.md#examples).

By default, files located in `build`, `node_modules`, and `vendor` folders are ignored.

#### Advanced information

It uses [npm-package-json-lint](https://www.npmjs.com/package/npm-package-json-lint) with the set of recommended rules defined in [@wordpress/npm-package-json-lint-config](https://www.npmjs.com/package/@wordpress/npm-package-json-lint-config) npm package. You can override default rules with your own as described in [npm-package-json-lint wiki](https://github.com/tclindner/npm-package-json-lint/wiki). Learn more in the [Advanced Usage](#advanced-usage) section.

### `lint-md-docs`

Uses markdownlint to lint the markup of markdown files to enforce standards.

_Example:_

```json
{
	"scripts": {
		"lint:md:docs": "wp-scripts lint-md-docs"
	}
}
```

This is how you execute the script with presented setup:

-   `npm run lint:md:docs` - lints markdown files in the entire project’s directories.

By default, files located in `build`, `node_modules`, and `vendor` folders are ignored.

#### Advanced information

It uses [markdownlint](https://github.com/DavidAnson/markdownlint) with the [.markdownlint.json](https://github.com/WordPress/gutenberg/blob/HEAD/packages/scripts/config/.markdownlint.json) configuration. This configuration tunes the linting rules to match WordPress standard, you can override with your own config, see [markdownlint-cli](https://github.com/igorshubovych/markdownlint-cli/) for command-line parameters.

### `lint-md-js`

Uses ESLint to lint the source included in markdown files to enforce standards for JS code.

_Example:_

```json
{
	"scripts": {
		"lint:md:js": "wp-scripts lint-md-js"
	}
}
```

This is how you execute the script with presented setup:

-   `npm run lint:md:js` - lints markdown files in the entire project’s directories.

By default, files located in `build`, `node_modules`, and `vendor` folders are ignored.

#### Advanced information

It uses [eslint-plugin-markdown](https://github.com/eslint/eslint-plugin-markdown) with the [.eslintrc-md.js](https://github.com/WordPress/gutenberg/blob/HEAD/packages/scripts/config/.eslintrc-md.js) configuration. This configuration tunes down the linting rules since documentation often includes just snippets of code. It is recommended to use the markdown linting as a check, but not necessarily a blocker since it might report more false errors.

### `lint-style`

Helps enforce coding style guidelines for your style files.

_Example:_

```json
{
	"scripts": {
		"lint:style": "wp-scripts lint-style",
		"lint:css:src": "wp-scripts lint-style 'src/**/*.css'"
	}
}
```

This is how you execute the script with presented setup:

-   `npm run lint:style` - lints CSS and SCSS files in the entire project’s directories.
-   `npm run lint:css:src` - lints only CSS files in the project’s `src` subfolder’s directories.

When you run commands similar to the `npm run lint:css:src` example above, be sure to include the quotation marks around file globs. This ensures that you can use the powers of [globby](https://github.com/sindresorhus/globby) (like the `**` globstar) regardless of your shell. See [more examples](https://github.com/stylelint/stylelint/blob/HEAD/docs/user-guide/cli.md#examples).

By default, files located in `build`, `node_modules`, and `vendor` folders are ignored.

#### Advanced information

It uses [stylelint](https://github.com/stylelint/stylelint) with the [@wordpress/stylelint-config](https://www.npmjs.com/package/@wordpress/stylelint-config) configuration per the [WordPress CSS Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/css/). You can override them with your own rules as described in [stylelint user guide](https://stylelint.io/user-guide/configure). Learn more in the [Advanced Usage](#advanced-usage) section.

### `packages-update`

Updates the WordPress packages used in the project to their latest version.

_Example:_

```json
{
	"scripts": {
		"packages-update": "wp-scripts packages-update",
		"postpackages-update": "npm run build"
	}
}
```

#### Advanced information

The command checks which packages whose name starts with `@wordpress/` are used in the project by reading the package.json file, and then executes `npm install @wordpress/package1@latest @wordpress/package2@latest ... --save` to change the package versions to the latest one.

### `plugin-zip`

Creates a zip file for a WordPress plugin.

_Example:_

```json
{
	"scripts": {
		"plugin-zip": "wp-scripts plugin-zip"
	}
}
```

By default, it uses [Plugin Handbook best practices](https://developer.wordpress.org/plugins/plugin-basics/best-practices/#file-organization) to discover files.

#### Advanced information

In the case where the plugin author wants to customize the files included in the zip file, they can provide the `files` field in the `package.json` file as documented in the [`npm-packlist`](https://www.npmjs.com/package/npm-packlist) package, example:

```json
{
	"files": [ "dir" ]
}
```

It reuses the same logic as `npm pack` command to create an npm package tarball.

### `start`

Transforms your code according the configuration provided so it’s ready for development. The script will automatically rebuild if you make changes to the code, and you will see the build errors in the console. The entry points for your project get detected by scanning all script fields in `block.json` files located in the `src` directory. The script fields in `block.json` should pass relative paths to `block.json` in the same folder.

_Example:_

```json
{
	"editorScript": "file:index.js",
	"editorStyle": "file:editor.css",
	"style": "file:style.css"
}
```

The fallback entry point is `src/index.js` (other supported extensions: `.jsx`, `.ts`, and `.tsx`) in case there is no `block.json` file found. The output generated will be written to `build/index.js`. For single builds, better suited for production, see the [build](#build) script.

_Example:_

```json
{
	"scripts": {
		"start": "wp-scripts start",
		"start:hot": "wp-scripts start --hot",
		"start:custom": "wp-scripts start entry-one.js entry-two.js --output-path=custom",
		"start:copy-php": "wp-scripts start"
	}
}
```

This is how you execute the script with presented setup:

-   `npm start` - starts the build for development.
-   `npm run start:hot` - starts the build for development with "Fast Refresh". The page will automatically reload if you make changes to the files.
-   `npm run start:custom` - starts the build for development which contains two entry points and a custom output folder. Paths for custom entry points are relative to the project root.
-   `npm run start:copy-php` - starts the build for development and opts into copying PHP files from src src and its subfolders to the dist directory.

This script automatically use the optimized config but sometimes you may want to specify some custom options:

-   `--hot` – enables "Fast Refresh". The page will automatically reload if you make changes to the code. _For now, it requires that WordPress has the [`SCRIPT_DEBUG`](https://wordpress.org/support/article/debugging-in-wordpress/#script_debug) flag enabled and the [Gutenberg](https://wordpress.org/plugins/gutenberg/) plugin installed._
-   `--webpack-no-externals` – disables scripts' assets generation, and omits the list of default externals.
-   `--webpack-bundle-analyzer` – enables visualization for the size of webpack output files with an interactive zoomable treemap.
-   `--webpack--devtool` – controls how source maps are generated. See options at https://webpack.js.org/configuration/devtool/#devtool.
-   `--webpack-copy-php` – enables copying PHP files from src and its subfolders to the dist directory.

#### Advanced information

This script uses [webpack](https://webpack.js.org/) behind the scenes. It’ll look for a webpack config in the top-level directory of your package and will use it if it finds one. If none is found, it’ll use the default config provided by `@wordpress/scripts` packages. Learn more in the [Advanced Usage](#advanced-usage) section.

### `test-e2e`

Launches the End-To-End (E2E) test runner. Writing tests can be done using the [Jest API](https://jestjs.io/docs/en/api) in combination with the [Puppeteer API](https://github.com/GoogleChrome/puppeteer/blob/HEAD/docs/api.md):

> [Jest](https://jestjs.io/) is a delightful JavaScript Testing Framework with a focus on simplicity.

> [Puppeteer](https://pptr.dev/) is a Node library which provides a high-level API to control Chrome or Chromium over the [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). Puppeteer runs [headless](https://developers.google.com/web/updates/2017/04/headless-chrome) by default, but can be configured to run full (non-headless) Chrome or Chromium.

_Example:_

```json
{
	"scripts": {
		"test:e2e": "wp-scripts test-e2e",
		"test:e2e:help": "wp-scripts test-e2e --help",
		"test:e2e:debug": "wp-scripts --inspect-brk test-e2e --puppeteer-devtools"
	}
}
```

This is how you execute those scripts using the presented setup:

-   `npm run test:e2e` - runs all e2e tests.
-   `npm run test:e2e:help` - prints all available options to configure e2e test runner.
-   `npm run test-e2e -- --puppeteer-interactive` - runs all e2e tests interactively.
-   `npm run test-e2e FILE_NAME -- --puppeteer-interactive` - runs one test file interactively.
-   `npm run test-e2e:watch -- --puppeteer-interactive` - runs all tests interactively and watch for changes.
-   `npm run test-e2e:debug` - runs all tests interactively and enables [debugging tests](#debugging-e2e-tests).

Jest will look for test files with any of the following popular naming conventions:

-   Files with `.js` (other supported extensions: `.jsx`, `.ts`, and `.tsx`) suffix at any level of depth in `spec` folders.
-   Files with `.spec.js` (other supported extensions: `.jsx`, `.ts`, and `.tsx`) suffix.

This script automatically detects the best config to start Puppeteer but sometimes you may need to specify custom options:

-   You can add a `jest-puppeteer.config.js` at the root of the project or define a custom path using `JEST_PUPPETEER_CONFIG` environment variable. Check [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer#jest-puppeteerconfigjs) for more details.

We enforce that all tests run serially in the current process using [--runInBand](https://jestjs.io/docs/en/cli#runinband) Jest CLI option to avoid conflicts between tests caused by the fact that they share the same WordPress instance.

#### Failed Test Artifacts

When tests fail, both a screenshot and an HTML snapshot will be taken of the page and stored in the `artifacts/` directory at the root of your project. These snapshots may help debug failed tests during development or when running tests in a CI environment.

The `artifacts/` directory can be customized by setting the `WP_ARTIFACTS_PATH` environment variable to the relative path of the desired directory within your project's root. For example: to change the default directory from `artifacts/` to `my/custom/artifacts`, you could use `WP_ARTIFACTS_PATH=my/custom/artifacts npm run test:e2e`.

#### Advanced information

It uses [Jest](https://jestjs.io/) behind the scenes and you are able to use all of its [CLI options](https://jestjs.io/docs/en/cli.html). You can also run `./node_modules/.bin/wp-scripts test:e2e --help` or `npm run test:e2e:help` (as mentioned above) to view all of the available options. Learn more in the [Advanced Usage](#advanced-usage) section.

Should there be any situation where you want to provide your own Jest config, you can do so.

-   the command receives a `--config` argument. Example: `wp-scripts test-e2e --config my-jest-config.js`.
-   there is a file called `jest-e2e.config.js`, `jest-e2e.config.json`, `jest.config.js`, or `jest.config.json` in the top-level directory of your package (at the same level than your `package.json`).
-   a `jest` object can be provided in the `package.json` file with the test configuration.

### `test-unit-js`

_Alias_: `test-unit-jest`

Launches the unit test runner. Writing tests can be done using the [Jest API](https://jestjs.io/docs/en/api).

_Example:_

```json
{
	"scripts": {
		"test:unit": "wp-scripts test-unit-js",
		"test:unit:help": "wp-scripts test-unit-js --help",
		"test:unit:watch": "wp-scripts test-unit-js --watch",
		"test:unit:debug": "wp-scripts --inspect-brk test-unit-js --runInBand --no-cache"
	}
}
```

This is how you execute those scripts using the presented setup:

-   `npm run test:unit` - runs all unit tests.
-   `npm run test:unit:help` - prints all available options to configure unit tests runner.
-   `npm run test:unit:watch` - runs all unit tests in the watch mode.
-   `npm run test:unit:debug` - runs all unit tests in [debug mode](#debugging-tests).

Jest will look for test files with any of the following popular naming conventions:

-   Files with `.js` (other supported extensions: `.jsx`, `.ts`, and `.tsx`) suffix located at any level of depth in `__tests__` folders.
-   Files with `.js` (other supported extensions: `.jsx`, `.ts`, and `.tsx`) suffix directly located in `test` folders.
-   Files with `.test.js` (other supported extensions: `.jsx`, `.ts`, and `.tsx`) suffix.

#### Advanced information

It uses [Jest](https://jestjs.io/) behind the scenes and you are able to use all of its [CLI options](https://jestjs.io/docs/en/cli.html). You can also run `./node_modules/.bin/wp-scripts test:unit --help` or `npm run test:unit:help` (as mentioned above) to view all of the available options. By default, it uses the set of recommended options defined in [@wordpress/jest-preset-default](https://www.npmjs.com/package/@wordpress/jest-preset-default) npm package. You can override them with your own options as described in [Jest documentation](https://jestjs.io/docs/en/configuration). Learn more in the [Advanced Usage](#advanced-usage) section.

Should there be any situation where you want to provide your own Jest config, you can do so.

-   the command receives a `--config` argument. Example: `wp-scripts test-unit --config my-jest-config.js`.
-   there is a file called `jest-unit.config.js`, `jest-unit.config.json`, `jest.config.js`, or `jest.config.json` in the top-level directory of your package (at the same level than your `package.json`).
-   a `jest` object can be provided in the `package.json` file with the test configuration.

## Passing Node.js options

`wp-scripts` supports the full array of [Node.js CLI options](https://nodejs.org/api/cli.html). They can be passed after the `wp-scripts` command and before the script name.

```sh
wp-scripts [NODE_OPTIONS] script
```

### Debugging tests

One common use-case for passing Node.js options is debugging your tests.

Tests can be debugged by any [inspector client](https://nodejs.org/en/docs/guides/debugging-getting-started/#inspector-clients) that supports the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

Follow the instructions for debugging Node.js with your favorite supported browser or IDE. When the instructions say to use `node --inspect script.js` or `node --inspect-brk script.js`, simply use `wp-scripts --inspect script` or `wp-scripts --inspect-brk script` instead.

Google Chrome and Visual Studio Code are used as examples below.

#### Debugging in Google Chrome

Place `debugger;` statements in any test and run `wp-scripts --inspect-brk test-unit-js --runInBand --no-cache` (or `npm run test:unit:debug` from above).

Then open `about:inspect` in Google Chrome and select `inspect` on your process.

A breakpoint will be set at the first line of the script (this is done to give you time to open the developer tools and to prevent Jest from executing before you have time to do so). Click the resume button in the upper right panel of the dev tools to continue execution. When Jest executes the test that contains the debugger statement, execution will pause and you can examine the current scope and call stack.

#### Debugging in Visual Studio Code

Debugging npm scripts is supported out of the box for Visual Studio Code as of [version 1.23](https://code.visualstudio.com/blogs/2018/07/12/introducing-logpoints-and-auto-attach#_npm-scripts-and-debugging) and can be used to debug Jest unit tests.

Make sure `wp-scripts --inspect-brk test-unit-js --runInBand --no-cache` is saved as `test:unit:debug` in your `package.json` file to run tests in Visual Studio Code.

When debugging, set a breakpoint in your tests by clicking on a line in the editor’s left margin by the line numbers.

Then open npm scripts in the explorer or run `Explorer: Focus on NPM Scripts View` in the command palette to see the npm scripts. To start the tests, click the debug icon next to `test:unit:debug`.

The tests will start running, and execution will pause on your selected line so you can inspect the current scope and call stack within the editor.

See [Debugging in Visual Studio Code](https://code.visualstudio.com/Docs/editor/debugging) for more details on using the Visual Studio Code debugger.

#### Debugging e2e tests

Since e2e tests run both in the node context _and_ the (usually headless) browser context, not all lines of code can have breakpoints set within the inspector client—only the node context is debugged in the inspector client.

The code executed in the node context includes all of the test files _excluding_ code within `page.evaluate` functions. The `page.evaluate` functions and the rest of your app code is executed within the browser context.

Test code (node context) can be debugged normally using the instructions above.

To also debug the browser context, run `wp-scripts --inspect-brk test-e2e --puppeteer-devtools`. The `--puppeteer-devtools` option (or the `PUPPETEER_DEVTOOLS="true"` environment variable when used with `PUPPETEER_HEADLESS="false"`) will disable headless mode and launch the browser with the devtools already open. Breakpoints can then be set in the browser context using these devtools.

For more e2e debugging tips check out the [Puppeteer debugging docs](https://developers.google.com/web/tools/puppeteer/debugging).

## Advanced Usage

In general, this package should be used with the set of recommended config files. While it’s possible to override every single config file provided, if you have to do it, it means that your use case is far more complicated than anticipated. If that happens, it would be better to avoid using the whole abstraction layer and set up your project with full control over tooling used.

### Working with build scripts

The `build` and `start` commands use [webpack](https://webpack.js.org/) behind the scenes. webpack is a tool that helps you transform your code into something else. For example: it can take code written in ESNext and output ES5 compatible code that is minified for production.

#### Default webpack config

`@wordpress/scripts` bundles the default webpack config used as a base by the WordPress editor. These are the defaults:

-   [Entry](https://webpack.js.org/configuration/entry-context/#entry): the entry points for your project get detected by scanning all script fields in `block.json` files located in the `src` directory. The fallback entry point is `src/index.js` (other supported extensions: `.jsx`, `.ts`, and `.tsx`) in case there is no `block.json` file found.
-   [Output](https://webpack.js.org/configuration/output): `build/[name].js`, for example: `build/index.js`, or `build/my-block/index.js`.
-   [Loaders](https://webpack.js.org/loaders/):
    -   [`babel-loader`](https://webpack.js.org/loaders/babel-loader/) allows transpiling JavaScript and TypeScript files using Babel and webpack.
    -   [`@svgr/webpack`](https://www.npmjs.com/package/@svgr/webpack) and [`url-loader`](https://webpack.js.org/loaders/url-loader/) makes it possible to handle SVG files in JavaScript code.
    -   [`css-loader`](https://webpack.js.org/loaders/css-loader/) chained with [`postcss-loader`](https://webpack.js.org/loaders/postcss-loader/) and [sass-loader](https://webpack.js.org/loaders/sass-loader/) let webpack process CSS, SASS or SCSS files referenced in JavaScript files.
-   [Plugins](https://webpack.js.org/configuration/plugins) (among others):
    -   [`CopyWebpackPlugin`](https://webpack.js.org/plugins/copy-webpack-plugin/) copies all `block.json` files discovered in the `src` directory to the build directory.
    -   [`MiniCssExtractPlugin`](https://webpack.js.org/plugins/mini-css-extract-plugin/) extracts CSS into separate files. It creates a CSS file per JavaScript entry point which contains CSS.
    -   [`@wordpress/dependency-extraction-webpack-plugin`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/dependency-extraction-webpack-plugin/README.md) is used with the default configuration to ensure that WordPress provided scripts are not included in the built bundle.

#### Using CSS

_Example:_

```scss
// index.scss
$body-color: red;

.wp-block-my-block {
	color: $body-color;
}
```

```css
/* style.css */
.wp-block-my-block {
	background-color: black;
}
```

```js
// index.js
import './index.scss';
import './style.css';
```

When you run the build using the default command `wp-scripts build` (also applies to `start`) in addition to the JavaScript file `index.js` generated in the `build` folder, you should see two more files:

1. `index.css` – all imported CSS files are bundled into one chunk named after the entry point, which defaults to `index.js`, and thus the file created becomes `index.css`. This is for styles used only in the editor.
2. `style-index.css` – imported `style.css` file(s) (applies to SASS and SCSS extensions) get bundled into one `style-index.css` file that is meant to be used both on the front-end and in the editor.

You can also have multiple entry points as described in the docs for the script:

```bash
wp-scripts start entry-one.js entry-two.js --output-path=custom
```

If you do so, then CSS files generated will follow the names of the entry points: `entry-one.css` and `entry-two.css`.

Avoid using `style` keyword in an entry point name, this might break your build process.

You can also bundle CSS modules by prefixing `.module` to the extension, e.g. `style.module.scss`. Otherwise, these files are handled like all other `style.scss`. They will also be extracted into `style-index.css`.

#### Using fonts and images

It is possible to reference font (`woff`, `woff2`, `eot`, `ttf` and `otf`) and image (`bmp`, `png`, `jpg`, `jpeg` and `gif`) files from CSS that is controlled by webpack as explained in the previous section.

_Example:_

```css
/* style.css */
@font-face {
	font-family: Gilbert;
	src: url( ../assets/gilbert-color.otf );
}
.wp-block-my-block {
	background-color: url( ../assets/block-background.png );
	font-family: Gilbert;
}
```

#### Using SVG

_Example:_

```js
import starUrl, { ReactComponent as Star } from './star.svg';

const App = () => (
	<div>
		<img src={ starUrl } alt="star" />
		<Star />
	</div>
);
```

#### Provide your own webpack config

Should there be any situation where you want to provide your own webpack config, you can do so. The `build` and `start` commands will use your provided file when:

-   the command receives a `--config` argument. Example: `wp-scripts build --config my-own-webpack-config.js`.
-   there is a file called `webpack.config.js` or `webpack.config.babel.js` in the top-level directory of your project (at the same level as `package.json`).

##### Extending the webpack config

To extend the provided webpack config, or replace subsections within the provided webpack config, you can provide your own `webpack.config.js` file, `require` the provided `webpack.config.js` file, and use the [`spread` operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) to import all of or part of the provided configuration.

In the example below, a `webpack.config.js` file is added to the root folder extending the provided webpack config to include custom logic to parse module's source and convert it to a JavaScript object using [`toml`](https://www.npmjs.com/package/toml). It may be useful to import toml or other non-JSON files as JSON, without specific loaders:

```javascript
const toml = require( 'toml' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			{
				test: /.toml/,
				type: 'json',
				parser: {
					parse: toml.parse,
				},
			},
		],
	},
};
```

If you follow this approach, please, be aware that future versions of this package may change what webpack and Babel plugins we bundle, default configs, etc. Should those changes be necessary, they will be registered in the [package’s CHANGELOG](https://github.com/WordPress/gutenberg/blob/HEAD/packages/scripts/CHANGELOG.md), so make sure to read it before upgrading.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
