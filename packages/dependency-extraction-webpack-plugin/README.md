# Dependency Extraction Webpack Plugin

This webpack plugin serves two purposes:

-   Externalize dependencies that are available as shared scripts or modules on WordPress sites.
-   Add an asset file for each entry point that declares an object with the list of WordPress script or module dependencies for the entry point. The asset file also contains the current version calculated for the current source code.

This allows JavaScript bundles produced by webpack to leverage WordPress style dependency sharing without an error-prone process of manually maintaining a dependency list.

Version 5 of this plugin adds support for module bundling. [Webpack's `output.module` option](https://webpack.js.org/configuration/output/#outputmodule) should
be used to opt-in to this behavior. This plugin will adapt it's behavior based on the
`output.module` option, producing an asset file suitable for use with the WordPress Module API.

Consult the [webpack website](https://webpack.js.org) for additional information on webpack concepts.

## Installation

Install the module

```bash
npm install @wordpress/dependency-extraction-webpack-plugin --save-dev
```

**Note**: This package requires Node.js 18.0.0 or later. It also requires webpack 5.0.0 or newer. It is not compatible with older versions.

## Usage

### Webpack

Use this plugin as you would other webpack plugins:

```js
// webpack.config.js
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

module.exports = {
	// …snip
	plugins: [ new DependencyExtractionWebpackPlugin() ],
};
```

**Note:** Multiple instances of the plugin are not supported and may produced unexpected results. If you plan to extend the webpack configuration from `@wordpress/scripts` with your own `DependencyExtractionWebpackPlugin`, be sure to remove the default instance of the plugin:

```js
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const webpackConfig = {
	...defaultConfig,
	plugins: [
		...defaultConfig.plugins.filter(
			( plugin ) =>
				plugin.constructor.name !== 'DependencyExtractionWebpackPlugin'
		),
		new DependencyExtractionWebpackPlugin( {
			injectPolyfill: true,
			requestToExternal( request ) {
				/* My externals */
			},
		} ),
	],
};
```

### Behavior with scripts

Each entry point in the webpack bundle will include an asset file that declares the WordPress script dependencies that should be enqueued. This file also contains the unique version hash calculated based on the file content.

For example:

```
// Source file entrypoint.js
import { Component } from 'react';

// Webpack will produce the output output/entrypoint.js
/* bundled JavaScript output */

// Webpack will also produce output/entrypoint.asset.php declaring script dependencies
<?php return array('dependencies' => array('react'), 'version' => 'dd4c2dc50d046ed9d4c063a7ca95702f');
```

By default, the following module requests are handled:

| Request                      | Global               | Script handle |
| ---------------------------- | -------------------- | ------------- |
| `@babel/runtime/regenerator` | `regeneratorRuntime` | `wp-polyfill` |
| `@wordpress/*`               | `wp['*']`            | `wp-*`        |
| `jquery`                     | `jQuery`             | `jquery`      |
| `lodash-es`                  | `lodash`             | `lodash`      |
| `lodash`                     | `lodash`             | `lodash`      |
| `moment`                     | `moment`             | `moment`      |
| `react-dom`                  | `ReactDOM`           | `react-dom`   |
| `react`                      | `React`              | `react`       |

**Note:** This plugin overlaps with the functionality provided by [webpack `externals`](https://webpack.js.org/configuration/externals). This plugin is intended to extract script handles from bundle compilation so that a list of script dependencies does not need to be manually maintained. If you don't need to extract a list of script dependencies, use the `externals` option directly.

This plugin is compatible with `externals`, but they may conflict. For example, adding `{ externals: { '@wordpress/blob': 'wp.blob' } }` to webpack configuration will effectively hide the `@wordpress/blob` module from the plugin and it will not be included in dependency lists.

### Behavior with script modules

**Warning:** Script modules support is considered experimental at this time.

This section describes the behavior of this package to bundle ECMAScript modules and generate asset
files suitable for use with the WordPress Script Modules API.

Some of this plugin's options change, and webpack requires configuration to output script modules. Refer to
[webpack's documentation](https://webpack.js.org/configuration/output/#outputmodule) for up-to-date details.

```js
const webpackConfig = {
	...defaultConfig,

	// These lines are necessary to enable module compilation at time-of-writing:
	output: { module: true },
	experiments: { outputModule: true },

	plugins: [
		...defaultConfig.plugins.filter(
			( plugin ) =>
				plugin.constructor.name !== 'DependencyExtractionWebpackPlugin'
		),
		new DependencyExtractionWebpackPlugin( {
			// With modules, use `requestToExternalModule`:
			requestToExternalModule( request ) {
				if ( request === 'my-registered-module' ) {
					return request;
				}
			},
		} ),
	],
};
```

Each entry point in the webpack bundle will include an asset file that declares the WordPress script module dependencies that should be enqueued. This file also contains the unique version hash calculated based on the file content.

For example:

```
// Source file entrypoint.js
import { store, getContext } from '@wordpress/interactivity';

// Webpack will produce the output output/entrypoint.js
/* bundled JavaScript output */

// Webpack will also produce output/entrypoint.asset.php declaring script dependencies
<?php return array('dependencies' => array('@wordpress/interactivity'), 'version' => 'dd4c2dc50d046ed9d4c063a7ca95702f');
```

By default, the following script module requests are handled:

| Request                      |
| ---------------------------- |
| `@wordpress/interactivity  ` |

(`@wordpress/interactivity` is currently the only available WordPress script module.)

**Note:** This plugin overlaps with the functionality provided by [webpack `externals`](https://webpack.js.org/configuration/externals). This plugin is intended to extract script module identifiers from bundle compilation so that a list of script module dependencies does not need to be manually maintained. If you don't need to extract a list of script module dependencies, use the `externals` option directly.

This plugin is compatible with `externals`, but they may conflict. For example, adding `{ externals: { '@wordpress/blob': 'wp.blob' } }` to webpack configuration will effectively hide the `@wordpress/blob` module from the plugin and it will not be included in dependency lists.

#### Options

An object can be passed to the constructor to customize the behavior, for example:

```js
module.exports = {
	plugins: [
		new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
	],
};
```

##### `outputFormat`

-   Type: string
-   Default: `php`

The output format for the generated asset file. There are two options available: 'php' or 'json'.

##### `outputFilename`

-   Type: string | function
-   Default: null

The filename for the generated asset file. Accepts the same values as the Webpack `output.filename` option.

##### `combineAssets`

-   Type: boolean
-   Default: `false`

By default, one asset file is created for each entry point. When this flag is set to `true`, all information about assets is combined into a single `assets.(json|php)` file generated in the output directory.

##### `combinedOutputFile`

-   Type: string
-   Default: `null`

This option is useful only when the `combineAssets` option is enabled. It allows providing a custom output file for the generated single assets file. It's possible to provide a path that is relative to the output directory.

##### `useDefaults`

-   Type: boolean
-   Default: `true`

Pass `useDefaults: false` to disable the default request handling.

##### `injectPolyfill`

-   Type: boolean
-   Default: `false`

Force `wp-polyfill` to be included in each entry point's dependency list. This would be the same as adding `import '@wordpress/polyfill';` to each entry point.

**Note**: This option is not available with script modules.

##### `externalizedReport`

-   Type: boolean | string
-   Default: `false`

Report all externalized dependencies as an array in JSON format. It could be used for further manual or automated inspection.
You can provide a filename, or set it to `true` to report to a default `externalized-dependencies.json`.

##### `requestToExternal`

**Note**: This option is not available with script modules. See [`requestToExternalModule`](#requestToExternalModule) for module usage.

-   Type: function

`requestToExternal` allows the module handling to be customized. The function should accept a module request string and may return a string representing the global variable to use. An array of strings may be used to access globals via an object path, e.g. `wp.i18n` may be represented as `[ 'wp', 'i18n' ]`.

`requestToExternal` provided via configuration has precedence over default external handling. Unhandled requests will be handled by the default unless `useDefaults` is set to `false`.

```js
/**
 * Externalize 'my-module'
 *
 * @param {string} request Requested module
 *
 * @return {(string|undefined)} Script global
 */
function requestToExternal( request ) {
	// Handle imports like `import myModule from 'my-module'`
	if ( request === 'my-module' ) {
		// Expect to find `my-module` as myModule in the global scope:
		return 'myModule';
	}
}

module.exports = {
	plugins: [ new DependencyExtractionWebpackPlugin( { requestToExternal } ) ],
};
```

##### `requestToExternalModule`

**Note**: This option is only available with script modules. See [`requestToExternal`](#requestToExternal) for script usage.

-   Type: function

`requestToExternalModule` allows the script module handling to be customized. The function should accept a script module request string and may return a string representing the script module to use. Often, the script module will have the same name.

`requestToExternalModule` provided via configuration has precedence over default external handling. Unhandled requests will be handled by the default unless `useDefaults` is set to `false`.

```js
/**
 * Externalize 'my-module'
 *
 * @param {string} request Requested script module
 *
 * @return {(string|boolean|undefined)} Script module ID
 */
function requestToExternalModule( request ) {
	// Handle imports like `import myModule from 'my-module'`
	if ( request === 'my-module' ) {
		// Import should be of the form `import { something } from "myModule";` in the final bundle.
		return 'myModule';
	}

	// If the script module ID in source is the same as the external script module, `true` can be returned.
	return request === 'external-module-id-no-change-required';
}

module.exports = {
	plugins: [
		new DependencyExtractionWebpackPlugin( { requestToExternalModule } ),
	],
};
```

##### `requestToHandle`

**Note**: This option is not available with script modules. It has no corresponding module configuration.

-   Type: function

All of the external modules handled by the plugin are expected to be WordPress script dependencies
and will be added to the dependency list. `requestToHandle` allows the script handle included in the dependency list to be customized.

If no string is returned, the script handle is assumed to be the same as the request.

`requestToHandle` provided via configuration has precedence over the defaults. Unhandled requests will be handled by the default unless `useDefaults` is set to `false`.

```js
/**
 * Map 'my-module' request to 'my-module-script-handle'
 *
 * @param {string} request Requested module
 *
 * @return {(string|undefined)} Script global
 */
function requestToHandle( request ) {
	// Handle imports like `import myModule from 'my-module'`
	if ( request === 'my-module' ) {
		// `my-module` depends on the script with the 'my-module-script-handle' handle.
		return 'my-module-script-handle';
	}
}

module.exports = {
	plugins: [ new DependencyExtractionWebpackPlugin( { requestToHandle } ) ],
};
```

##### `requestToExternal` and `requestToHandle`

The functions `requestToExternal` and `requestToHandle` allow this module to handle arbitrary modules.

`requestToExternal` is necessary to handle any module and maps a module request to a global name.

`requestToHandle` maps the same module request to a script handle, the strings that will be included in the `entrypoint.asset.php` files.

### WordPress

Enqueue your script as usual and read the script dependencies dynamically:

```php
$script_path       = 'path/to/script.js';
$script_asset_path = 'path/to/script.asset.php';
$script_asset      = file_exists( $script_asset_path )
	? require( $script_asset_path )
	: array( 'dependencies' => array(), 'version' => filemtime( $script_path ) );
$script_url = plugins_url( $script_path, __FILE__ );
wp_enqueue_script( 'script', $script_url, $script_asset['dependencies'], $script_asset['version'] );
```

Or with modules (the Script Module API is only available in WordPress > 6.5):

```php
$module_path       = 'path/to/module.js';
$module_asset_path = 'path/to/module.asset.php';
$module_asset      = file_exists( $module_asset_path )
	? require( $module_asset_path )
	: array( 'dependencies' => array(), 'version' => filemtime( $module_path ) );
$module_url = plugins_url( $module_path, __FILE__ );
wp_register_script_module( 'my-module', $module_url, $module_asset['dependencies'], $module_asset['version'] );
wp_enqueue_script_module( 'my-module' );
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
