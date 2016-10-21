<?php

// Minimum functions.php to pass unit tests

function default_widgets_init() {
	register_sidebar( array( 'id' => 'sidebar-1' ) );
}
add_action( 'widgets_init', 'default_widgets_init' );

function default_after_setup_theme() {
	add_theme_support( 'post-thumbnails' );

	// Don't call it after wp_loaded has happened, for tests that manually re-run load actions.
	if( ! did_action( 'wp_loaded' ) ) {
		add_theme_support( 'title-tag' );
	}
}
add_action( 'after_setup_theme', 'default_after_setup_theme' );
