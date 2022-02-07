# Setup

We will build the application as a WordPress plugin, which means you need to have WordPress itself installed. One way to do this is by following the instructions on the [Getting Started](/docs/contributors/code/getting-started-with-code-contribution.md) page. Once your setup is complete, you can follow along with the rest of this tutorial.

## Creating a plugin

We'll do all the development inside of a WordPress plugin. Let's start by creating a `wp-content/plugins/my-first-gutenberg-app` directory in your local WordPress environment. We will need to create three files inside that directory:

* my-first-gutenberg-app.php – to create a new admin page
* src/index.js – for our JavaScript application
* style.css – for the minimal stylesheet
* package.json – for the build process

Go ahead and create these files using the following snippets:

**src/index.js:**
```js
import { render } from '@wordpress/element';

function MyFirstApp() {
	return <span>Hello from JavaScript!</span>;
}

window.addEventListener( 'load', function() {
	render(
		<MyFirstApp />,
		document.querySelector( '#my-first-gutenberg-app' )
	);
}, false );
```

**style.css:**
```css
.toplevel_page_my-first-gutenberg-app #wpcontent {
	background: #FFF;
	height: 800px;
}
#my-first-gutenberg-app {
	max-width: 500px;
}
#my-first-gutenberg-app ul,
#my-first-gutenberg-app ul li {
	list-style-type: disc;
}
#my-first-gutenberg-app ul {
	padding-left: 20px;
}
#my-first-gutenberg-app .components-search-control__input {
	height: 36px;
	margin-left: 0;
}
.my-gutenberg-form .form-buttons {
	margin-top: 20px;
	margin-left: 1px;
}
.my-gutenberg-form .form-buttons button {
	margin-right: 4px;
}
```

**my-first-gutenberg-app.php:**
```php
<?php
/**
 * Plugin Name: My first Gutenberg App
 *
 */

function my_admin_menu() {
	// Create a new admin page for our app.
	add_menu_page(
		__( 'My first Gutenberg app', 'gutenberg' ),
		__( 'My first Gutenberg app', 'gutenberg' ),
		'manage_options',
		'my-first-gutenberg-app',
		function () {
			echo '
			<h2>Pages</h2>
			<div id="my-first-gutenberg-app"></div>
		';
		},
		'dashicons-schedule',
		3
	);
}

add_action( 'admin_menu', 'my_admin_menu' );

function load_custom_wp_admin_scripts( $hook ) {
	// Load only on ?page=my-first-gutenberg-app.
	if ( 'toplevel_page_my-first-gutenberg-app' !== $hook ) {
		return;
	}

	// Load the required WordPress packages.

	// Automatically load imported dependencies and assets version.
	$asset_file = include plugin_dir_path( __FILE__ ) . 'build/index.asset.php';

	// Enqueue CSS dependencies.
	foreach ( $asset_file['dependencies'] as $style ) {
		wp_enqueue_style( $style );
	}

	// Load our app.js.
	wp_register_script(
		'my-first-gutenberg-app',
		plugins_url( 'build/index.js', __FILE__ ),
		$asset_file['dependencies'],
		$asset_file['version']
	);
	wp_enqueue_script( 'my-first-gutenberg-app' );

	// Load our style.css.
	wp_register_style(
		'my-first-gutenberg-app',
		plugins_url( 'style.css', __FILE__ )
	);
	wp_enqueue_style( 'my-first-gutenberg-app' );
}

add_action( 'admin_enqueue_scripts', 'load_custom_wp_admin_scripts' );
```

**package.json:**

```json
{
	"name": "05-recipe-card-esnext",
	"version": "1.1.0",
	"private": true,
	"description": "Example: Recipe Card (ESNext).",
	"author": "The WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"WordPress",
		"block"
	],
	"homepage": "https://github.com/WordPress/gutenberg-examples/",
	"repository": "git+https://github.com/WordPress/gutenberg-examples.git",
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg-examples/issues"
	},
	"main": "build/index.js",
	"devDependencies": {
		"@wordpress/scripts": "^18.0.1"
	},
	"scripts": {
		"build": "wp-scripts build",
		"format:js": "wp-scripts format-js",
		"lint:js": "wp-scripts lint-js",
		"packages-update": "wp-scripts packages-update",
		"start": "wp-scripts start"
	}
}
```

## Setting up the build pipeline

This tutorial will proceed assuming the reader is familiar with ESNext syntax and the concept of build tools (like webpack). If that sounds confusing, you may want to review the [Getting started with JavaScript Build Setup](/how-to-guides/javascript/js-build-setup.md) first.

To install the build tool, navigate to the plugin directory using your terminal and run `npm install`.

Once all the dependencies are in place, all that's left is to run `npm start` and voila! A watcher will run in the terminal. You can then edit away in your text editor; after each save, it will automatically build.

## Testing if it worked

If you now go to the Plugins page, you should see a plugin called **My first Gutenberg App**. Go ahead and activate it. A new menu item labeled _My first Gutenberg app_ should show up. Once you click it, you will see a page that says _Hello from JavaScript!_:

![](./media/setup/hello-from-js.jpg)

Congratulations! You are now ready to start building the app!

## What's next?

* Previous part: [Introduction](./README.md)
* Next part: [Building a basic list of pages](./2-building-a-list-of-pages.md)
* (optional) Review the [finished app](https://github.com/WordPress/gutenberg-examples/tree/trunk/09-code-data-basics-esnext) in the gutenberg-examples repository
