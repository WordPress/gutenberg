<?php
/** Plugin Name: Theme compatibility fixture */
add_action( 'admin_menu', function () {
	add_management_page( 'Theme compatibility', 'Theme compatibility', 'manage_options', 'theme-compatibility', function () {
		echo '<div class="wrap"><h1>Theme compatibility</h1><div id="theme-compatibility"></div></div>';
	} );
} );
add_action( 'admin_enqueue_scripts', function ( $hook ) {
	if ( 'tools_page_theme-compatibility' !== $hook ) {
		return;
	}
	$bundle = isset( $_GET['bundle'] ) && 'old' === $_GET['bundle'] ? 'old' : 'new';
	$asset = require __DIR__ . '/build/' . $bundle . '/index.asset.php';
	wp_enqueue_style( 'wp-theme' );
	wp_enqueue_script( 'theme-compatibility', plugins_url( 'build/' . $bundle . '/index.js', __FILE__ ), $asset['dependencies'], $asset['version'], true );
} );
