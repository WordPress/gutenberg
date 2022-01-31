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
