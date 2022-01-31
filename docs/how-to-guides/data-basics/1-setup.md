## Setup

We will build the application as a WordPress plugin, which means you need to have the WordPress itself installed. One way to do it is by following the instructions on [Getting Started](/docs/contributors/code/getting-started-with-code-contribution.md) page. Once your setup is finished, you can follow along with the rest of this tutorial.

## Creating a plugin

We'll do all the development inside of a WordPress plugin. Let's start by creating a `wp-content/plugins/first-gutenberg-app` directory in your local WordPress environment. We will need to create three files inside that directory:

* first-gutenberg-app.php – to create a new admin page
* script.js – for our JavaScript application
* style.css – for the minimal stylesheet

Go ahead and create these files using the following snippets:

**app.js:**
```js
function MyFirstApp() {
	return wp.element.createElement('span', {}, 'Hello from JavaScript!');
}

window.addEventListener( 'load', function() {
	wp.element.render(
		wp.element.createElement( MyFirstApp ),
		document.querySelector( '#my-first-gutenberg-app' )
	);
}, false );
```

**style.css:**
```css
.toplevel_page_my-first-gutenberg-app #wpcontent {
	background: #FFF;
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
```

**first-gutenberg-app.php:**
```php
<?php
/**
 * Plugin Name: My first Gutenberg App
 *
 */

function my_admin_menu() {
	// Create a new admin page for our app
	add_menu_page(
		__( 'My first Gutenberg app', 'my-textdomain' ),
		__( 'My first Gutenberg app', 'my-textdomain' ),
		'manage_options',
		'my-first-gutenberg-app',
		function() {
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
	// Load only on ?page=my-first-gutenberg-app
	if ( $hook !== 'toplevel_page_my-first-gutenberg-app' ) {
		return;
	}

	// Load the required WordPress packages:

	// wp-components is a library of generic WordPress components
	// used for building consistent user interfaces across the board.
	wp_enqueue_style( 'wp-components' );
	wp_enqueue_script( 'wp-components' );

	// wp-data provides data management backbone such as the Redux
	// implementation or data resolution mechanisms.
	wp_enqueue_script( 'wp-data' );

	// wp-core-data is a glue between WordPress Core and wp-data.
	// It provides a Redux store with a number of selectors and actions to
	// power common tasks such as loading the data from the WordPress REST API,
	// editing it in the browser, and persisting the changes back to the REST API.
	wp_enqueue_script( 'wp-core-data' );

	// Load our app.js
	wp_register_script(
		'my-first-gutenberg-app',
		plugins_url( 'my-first-gutenberg-app/app.js' ),
		array( 'wp-components', 'wp-data', 'wp-core-data' ),
	);
	wp_enqueue_script( 'my-first-gutenberg-app' );

	// Load our style.css
	wp_register_style( 'my-first-gutenberg-app', plugins_url( 'my-first-gutenberg-app/style.css' ) );
	wp_enqueue_style( 'my-first-gutenberg-app' );
}

add_action( 'admin_enqueue_scripts', 'load_custom_wp_admin_scripts' );
```

If you now go to the Plugins page, you should see a plugin called **My first Gutenberg App**. Go ahead and activate it. A new menu item labeled _My first Gutenberg app_ should show up. Once you click it, you will see a page that says _Hello from JavaScript!_:

![](./media/setup/hello-from-js.jpg)

Congratulations! You are now ready to start building the app!

## Readability vs Convenience

You don’t need a build tool to complete this tutorial, but using one will make your core look nicer.

The examples in this tutorial use the JSX syntax:

```js
function MyFirstApp() {
	return <span> Hello from JavaScript! </span>;
}
```

It is concise and readable, but the payoff is you need a build tool like webpack to use it. If that's what you prefer, the [Getting Started with JavaScript](/how-to-guides/javascript/) tutorial will guide you through setting up the build tool.

There's also another way. If you'd like to start building your app right away, every JSX snippet is followed by a compiled version that works as-is:

```js
function MyFirstApp() {
	return wp.element.createElement('span', {}, 'Hello from JavaScript!');
}
```

You can safely ignore the JSX snippets and rely on their compiled versions – they will just work even when pasted to your browser's developer tools.

Previous part: [Introduction](./README.md)
Next part: [Building a basic list of pages](./2-building-a-list-of-pages.md)
