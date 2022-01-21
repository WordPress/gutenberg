# WordPress Plugin

A block is added to the block editor using a WordPress plugin. You can create your own plugin, and after installing and activating the plugin use the block. Let's first look at what makes up a WordPress plugin.

## Plugin Details

A WordPress plugin is a set of files within the site's `wp-content/plugins` directory. For our tutorial, we will use the `@wordpress/create-block` package to generate the necessary plugin files.

### Switch to Working Directory

(1A) If you do not plan to use `wp-env`, change to your local WordPress plugin directory. For example in Local it is: `~\Local Sites\mywp\app\public\wp-content\plugins`

-or-

(1B) If using `wp-env start`, you can work from any directory for your project; `wp-env` will map it as a plugin directory for your site.

### Generate Plugin Files

(2) Once in the right directory for your environment, the next step is to run the following command to generate plugin files:

```sh
npx @wordpress/create-block gutenpride
cd gutenpride
```

A new directory `gutenpride` is created with all the necessary plugin files. This tutorial will walk through and explain the plugin files, please explore and become familiar with them also.

The main plugin file created is the PHP file `gutenpride.php`, at the top of this file is the Plugin Header comment block that defines the plugin.

```php
/**
 * Plugin Name:     Gutenpride
 * Description:     Example block
 * Version:         0.1.0
 * Author:          The WordPress Contributors
 * License:         GPL-2.0-or-later
 * License URI:     https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:     gutenpride
 *
 * @package         create-block
 */
```

### Start WordPress

Let's confirm the plugin is loaded and working.

(3A) If you are using Local, or other environment confirm your WordPress site is started.

-or-

(3B) If you are using `wp-env`, see [Development Environment setup](/docs/getting-started/devenv/README.md), then you should now run from inside the `gutenpride` directory:

```sh
wp-env start
```

This will start your local WordPress site and use the current directory as your plugin directory. In your browser, go to http://localhost:8888/wp-admin/ and login, the default username is "admin" and password is "password", no quotes.

### Confirm Plugin Installed

The generated plugin should now be listed on the Plugins admin page in your WordPress install. Switch WordPress to the plugins page and activate.

For more on creating a WordPress plugin see [Plugin Basics](https://developer.wordpress.org/plugins/plugin-basics/), and [Plugin Header requirements](https://developer.wordpress.org/plugins/plugin-basics/header-requirements/) for explanation and additional fields you can include in your plugin header.

## package.json

The `package.json` file defines the JavaScript properties for your project. This is a standard file used by NPM for defining properties and scripts it can run, the file and process is not specific to WordPress.

A `package.json` file was created with the create script, this defines the dependencies and scripts needed. You can install dependencies. The only initial dependency is the `@wordpress/scripts` package that bundles the tools and configurations needed to build blocks.

In `package.json`, there is a `scripts` property that defines what command to run when using `pnpm (cmd)`. In our generated `package.json` file, the two main scripts point to the commands in the `wp-scripts` package:

```json
  "scripts": {
    "build": "wp-scripts build",
    "start": "wp-scripts start"
  },
```

These scripts are run by using: `pnpm build` or `pnpm start`

Use `pnpm build` for running once to create a "production" build. This compresses the code down so it downloads faster, but makes it harder to read using browser tools—good for final deployment but not while developing.

Use `pnpm start` for creating a "development" build, this does not compress the code so it is easier to read using browser tools, plus [source maps](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map) that make debugging easier. Additionally, development build will start a watch process that waits and watches for changes to the file and will rebuild each time it is saved; so you don't have to run the command for each change.

By default, the build scripts looks for `src/index.js` for the JavaScript file to build and will save the built file to `build/index.js`. In the upcoming sections, we will look closer at that script, but first let's make sure it is loaded in WordPress.

## Plugin to Load Script

To load the built script, so it is run within the editor, you need to tell WordPress about the script. This is done in the init action in the `gutenpride.php` file.

```php
function create_block_gutenpride_block_init() {
	register_block_type( __DIR__ );
}
add_action( 'init', 'create_block_gutenpride_block_init' );
```

The `register_block_type` function registers the block we are going to create and specifies the editor script handle registered from the metadata provided in `block.json` file with the `editorScript` field. So now when the editor loads it will load this script.

```json
{
	"apiVersion": 2,
	"name": "create-block/gutenpride",
	"title": "Gutenpride",
	"category": "widgets",
	"icon": "smiley",
	"description": "Example block written with ESNext standard and JSX support – build step required.",
	"supports": {
		"html": false
	},
	"textdomain": "gutenpride",
	"editorScript": "file:./build/index.js",
	"editorStyle": "file:./build/index.css",
	"style": "file:./build/style-index.css"
}
```

For the `editorScript` provided in the block metadata, the build process creates a secondary asset file that contains the list of dependencies and a file version based on the timestamp, this is the `index.asset.php` file.

The `wp_register_script` function used internally registers a name, called the handle, and relates that name to the script file. The dependencies are used to specify if the script requires including other libraries. The version is specified so the browser will reload if the file changed.

The `wp_set_script_translations` function tells WordPress to load translations for this script, if they exist. See more about [translations & internationalization.](/docs/how-to-guides/internationalization.md)

With the above in place, create a new post to load the editor and check your plugin is in the inserter. You can use `/` to search, or click the box with the [+] and search for "Gutenpride" to find the block.

## Troubleshooting

It is a good skill to learn and get comfortable using the web console. This is where JavaScript errors are shown and a nice way to test out snippets of JavaScript. See [Firefox Developer Tools documentation](https://developer.mozilla.org/en-US/docs/Tools).

To open the developer tools in Firefox, use the menu selecting Web Developer : Toggle Tools, on Chrome, select More Tools -> Developers Tools. For both browsers, the keyboard shortcut on Windows is Ctrl+Shift+I, or on Mac Cmd+Shift+I. On Windows & Linux, the F12 key also works. You can then click Console to view logs.

Try running `pnpm start` that will start the watch process for automatic rebuilds. If you then make an update to `src/index.js` file, you will see the build run, and if you reload the WordPress editor you'll see the change.

For more info, see the build section of the [Getting Started with JavaScript tutorial](/docs/how-to-guides/javascript/js-build-setup.md) in the Block Editor Handbook.

## Summary

Hopefully, at this point, you have your plugin created and activated. We have the `package.json` with the `@wordpress/scripts` dependency, that defines the build and start scripts. The basic block is in place and can be added to the editor.

Next Section: [Anatomy of a Block](/docs/getting-started/create-block/block-anatomy.md)
