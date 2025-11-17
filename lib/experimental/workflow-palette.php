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
	$version = defined( 'GUTENBERG_VERSION' ) && ! SCRIPT_DEBUG ? GUTENBERG_VERSION : time();

	wp_register_style(
		'wp-workflow',
		gutenberg_url( 'build/styles/workflow/style.css' ),
		array(),
		$version
	);
	wp_style_add_data( 'wp-workflow', 'rtl', 'replace' );
	wp_enqueue_style( 'wp-workflow' );

	wp_enqueue_script_module( '@wordpress/workflow' );
}

add_action( 'admin_enqueue_scripts', 'gutenberg_enqueue_workflow_palette_assets' );
