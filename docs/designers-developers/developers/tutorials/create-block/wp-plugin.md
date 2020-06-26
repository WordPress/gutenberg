# WordPress Plugin

A new block in the WordPress block editor is added by creating a WordPress plugin, installing, and activating the plugin. This page covers the details of a WordPress plugin if you are not already familiar.

## Plugin Details

A WordPress plugin is a set of files in a directory within the site's `wp-content/plugins` directory. For this example, we will use the `create-block` package to generate the necessary plugin files.

### Switch to Working Directory

(1A) If you do not plan to use `wp-env` change to your local WordPress plugin directory. For example in Local it is: `~\Local Sites\mywp\wp-content\plugins`

-or-

(1B) If you do use `wp-env` start, you can start from any directory for your project. `wp-env` will use it as a plugin directory for your site.

### Generate Plugin Files

(2) Once in the right directory for your environment, the next step is to
Regardless of environment, run the Run the following command to generate plugin files:

```
npx @wordpress/create-block gutenpride
cd gutenpride
```

All of the plugin files we develop will be in this `gutenpride` directory.

The script created a PHP file `gutenpride.php` that is the main plugin file. At the top of this file is the appropriate Plugin Header comment block which defines the plugin.

```php
/**
 * Plugin Name:     Gutenpride
 * Description:     Example block
 * Version:         0.1.0
 * Author:          The WordPress Contributors
 * License:         GPL-2.0-or-later
 * License URI:     https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:     create-block
 *
 * @package         create-block
 */
```

### Start WordPress

(3A) If you are using Local, or other environment confirm it is started and running.

-or-

(3B) If you are using `wp-env`, see [Development Environment setup](devenv.md), then you should now run from inside the `gutenpride` directory:

```
wp-env start
```

This will start your local WordPress site and use the current directory as your plugin directory. In your browser, go to https://localhost:8888/wp-admin/ and login, the default username is "admin" and password is "password", no quotes.

### Confirm Plugin Installed

The generated plugin should now be listed on the Plugins admin page in your WordPress install. Switch WorPress to the plugins page and activate.

For more on creating a WordPress plugin see [Plugin Basics](https://developer.wordpress.org/plugins/plugin-basics/), and [Plugin Header requirements](https://developer.wordpress.org/plugins/plugin-basics/header-requirements/) for explanation and additional fields you can include in your plugin
header.

## package.json

The package.json file defines the JavaScript properties for your project. This is a standard file used by NPM for defining properties and scripts it can run, the file and process is not specific to WordPress.

A package.json file was created with the create script, this defines the dependecies and scripts needed. you can install dependencies. The only initial dependency is the `@wordpress/scripts` package which bundles the tools and configurations needed to build blocks.

To use the scripts package, the `scripts` property of package.json defines the parameter called and what to run, the two main scripts are:

```json
  "scripts": {
    "build": "wp-scripts build",
    "start": "wp-scripts start"
  },
```

These are run using: `npm run build` or `npm run start` which will call the appropriate binary and command we need.

Use `npm run build` for running once to create a production build.

Use `npm run start` for creating a development build that also starts a watch process that waits and watches for changes to the file and will rebuild each time it is saved.

By default, the build scripts looks for `src/index.js` for the JavaScript file to build and will save the built file to `build/index.js`.

## Plugin to Load Script

To load the built script, so it is run within the editor, you need to tell WordPress about the script. This done in the init action in the `gutenpride.php` file.

```php
function create_block_gutenpride_block_init() {
	$dir = dirname( __FILE__ );

	$script_asset_path = "$dir/build/index.asset.php";
	if ( ! file_exists( $script_asset_path ) ) {
		throw new Error(
			'You need to run `npm start` or `npm run build` for the "create-block/gutenpride" block first.'
		);
	}
	$index_js     = 'build/index.js';
	$script_asset = require( $script_asset_path );
	wp_register_script(
		'create-block-gutenpride-block-editor',
		plugins_url( $index_js, __FILE__ ),
		$script_asset['dependencies'],
		$script_asset['version']
	);

	$editor_css = 'editor.css';
	wp_register_style(
		'create-block-gutenpride-block-editor',
		plugins_url( $editor_css, __FILE__ ),
		array(),
		filemtime( "$dir/$editor_css" )
	);

	$style_css = 'style.css';
	wp_register_style(
		'create-block-gutenpride-block',
		plugins_url( $style_css, __FILE__ ),
		array(),
		filemtime( "$dir/$style_css" )
	);

	register_block_type( 'create-block/gutenpride', array(
		'editor_script' => 'create-block-gutenpride-block-editor',
		'editor_style'  => 'create-block-gutenpride-block-editor',
		'style'         => 'create-block-gutenpride-block',
	) );
}
add_action( 'init', 'create_block_gutenpride_block_init' );
```

The build process creates a secondary asset file that contains the list of dependencies and a file version based on the timestamp, this is the `index.asset.php` file.

The `wp_register_script` function registers a name, called the handle, and relates that name to the script file. The dependencies are used to specify if the script requires including other libraries. The version is specified so the browser will reload if the file changed.

The `register_block_type` function registers the block we are going to create and specifies the editor_script file handle registered. So now when the editor loads it will load this script.

With the above in place, create a new post to load the editor and check the you can add the block in the inserter. You can use `/` to search, or click the box with the [+] and search for "Gutenpride" to find the block.

## Troubleshooting

It is a good skill to learn and get comfortable using the web console. This is where JavaScript errors are shown and a nice way to test out snippets of JavaScript. See [Firefox Developer Tools documentation](https://developer.mozilla.org/en-US/docs/Tools).

To open the developer tools in Firefox, use the menu selecting Web Developer : Toggle Tools, on Chrome, select More Tools -> Developers Tools. For both browers, the keyboard shortcut on Windows is Ctrl+Shift+I, or on Mac Cmd+Shift+I. On Windows & Linux, the F12 key also works. You can then click Console to view logs.

Try running `npm run start` that will start the watch process for automatic rebuilds. If you then make an update to `src/index.js` file, you will see the build run, and if you reload the WordPress editor you'll see the change.

For more info, see the build section of the [Getting Started with JavaScript tutorial](/docs/designers-developers/developers/tutorials/javascript/js-build-setup.md) in the WordPress Handbook.

## Summary

Hopefully, at this point, you have your plugin created and activated. We have the package.json with the `@wordpress/scripts` dependency, that defines the build and start scripts. The basic block is in place and can be added to the editor.

Next Section: [ESNext Syntax](esnext-js.md)
