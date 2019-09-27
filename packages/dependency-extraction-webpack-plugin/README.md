# Dependency Extraction Webpack Plugin

This webpack plugin serves two purposes:

- Externalize dependencies that are available as script dependencies on modern WordPress sites.
- Add an asset file for each entry point that declares an object with the list of WordPress script dependencies for the
  entry point. The asset file also contains the current version calculated for the current source code.

This allows JavaScript bundles produced by webpack to leverage WordPress style dependency sharing
without an error-prone process of manually maintaining a dependency list.

Consult the [webpack website](https://webpack.js.org) for additional information on webpack concepts.

## Installation

Install the module

```bash
npm install @wordpress/dependency-extraction-webpack-plugin --save-dev
```

## Usage

### Webpack

Use this plugin as you would other webpack plugins:

```js
// webpack.config.js
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

module.exports = {
  // …snip
  plugins: [
    new DependencyExtractionWebpackPlugin(),
  ]
}
```

**Note:** Multiple instances of the plugin are not supported and may produced unexpected results. If
you plan to extend the webpack configuration from `@wordpress/scripts` with your own `DependencyExtractionWebpackPlugin`, be sure to
remove the default instance of the plugin:

```js
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const config = {
  ...defaultConfig,
  plugins: [
    ...defaultConfig.plugins.filter(
      plugin => plugin.constructor.name !== 'DependencyExtractionWebpackPlugin',
    ),
    new DependencyExtractionWebpackPlugin( {
      injectPolyfill: true,
      requestToExternal(request) {
        /* My externals */
      },
    } ),
  ],
};
```

Each entry point in the webpack bundle will include an asset file that declares the WordPress script dependencies that should be enqueued. Such file also contains the unique version hash calculated based on the file content.

For example:

```
// Source file entrypoint.js
import { Component } from '@wordpress/element';

// Webpack will produce the output output/entrypoint.js
/* bundled JavaScript output */

// Webpack will also produce output/entrypoint.asset.php declaring script dependencies
<?php return array('dependencies' => array('wp-element'), 'version' => 'dd4c2dc50d046ed9d4c063a7ca95702f');
```

By default, the following module requests are handled:

| Request | Global | Script handle |
| --- | --- | --- |
| `@babel/runtime/regenerator` | `regeneratorRuntime` | `wp-polyfill` |
| `@wordpress/*` | `wp['*']` | `wp-*` |
| `jquery` | `jQuery` | `jquery` |
| `lodash-es` | `lodash` | `lodash` |
| `lodash` | `lodash` | `lodash` |
| `moment` | `moment` | `moment` |
| `react-dom` | `ReactDOM` | `react-dom` |
| `react` | `React` | `react` |

**Note:** This plugin overlaps with the functionality provided by [webpack
`externals`](https://webpack.js.org/configuration/externals). This plugin is intended to extract
script handles from bundle compilation so that a list of script dependencies does not need to be
manually maintained. If you don't need to extract a list of script dependencies, use the `externals`
option directly.

This plugin is compatible with `externals`, but they may conflict. For example, adding
`{ externals: { '@wordpress/blob': 'wp.blob' } }` to webpack configuration will effectively hide the
`@wordpress/blob` module from the plugin and it will not be included in dependency lists.

#### Options

An object can be passed to the constructor to customize the behavior, for example:

```js
module.exports = {
  plugins: [
    new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
  ]
}
```

##### `outputFormat`

- Type: string
- Default: `php`

The output format for the generated asset file. There are two options available: 'php' or 'json'.

##### `useDefaults`

- Type: boolean
- Default: `true`

Pass `useDefaults: false` to disable the default request handling.

##### `injectPolyfill`

- Type: boolean
- Default: `false`

Force `wp-polyfill` to be included in each entry point's dependency list. This would be the same as
adding `import '@wordpress/polyfill';` to each entry point.

##### `requestToExternal`

- Type: function

`requestToExternal` allows the module handling to be customized. The function should accept a
module request string and may return a string representing the global variable to use. An array of
strings may be used to access globals via an object path, e.g. `wp.i18n` may be represented as `[
'wp', 'i18n' ]`.

`requestToExternal` provided via configuration has precedence over default external handling.
Unhandled requests will be handled by the default unless `useDefaults` is set to `false`.

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
  plugins: [
    new DependencyExtractionWebpackPlugin( { requestToExternal } ),
  ]
}
```

##### `requestToHandle`

- Type: function

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
  plugins: [
    new DependencyExtractionWebpackPlugin( { requestToExternal } ),
  ]
}
```

##### `requestToExternal` and `requestToHandle`

The functions `requestToExternal` and `requestToHandle` allow this module to handle arbitrary
modules. `requestToExternal` is necessary to handle any module and maps a module request to a global
name. `requestToHandle` maps the same module request to a script handle, the strings that will be
included in the `entrypoint.asset.php` files.

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

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
