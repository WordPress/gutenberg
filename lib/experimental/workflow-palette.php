<?php
/**
 * Enqueues the assets required for the Workflow Palette.
 *
 * @package gutenberg
 */

/**
 * Enqueue workflow palette assets on all admin pages.
 */
function gutenberg_enqueue_workflow_palette_assets() {
	// When in production, use the plugin's version as the asset version;
	// else (for development or test) default to use the current time.
	$version = defined( 'GUTENBERG_VERSION' ) && ! SCRIPT_DEBUG ? GUTENBERG_VERSION : time();

	// Register and enqueue the workflow style.
	wp_register_style(
		'wp-workflow',
		gutenberg_url( 'build/styles/workflow/style.css' ),
		array(),
		$version
	);
	wp_style_add_data( 'wp-workflow', 'rtl', 'replace' );
	wp_enqueue_style( 'wp-workflow' );

	// Enqueue the workflow script module.
	wp_enqueue_script_module( '@wordpress/workflow' );
}

add_action( 'admin_enqueue_scripts', 'gutenberg_enqueue_workflow_palette_assets' );
