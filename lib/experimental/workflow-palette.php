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
	wp_enqueue_script( 'wp-workflow' );
	wp_enqueue_style( 'wp-workflow' );
}

add_action( 'admin_enqueue_scripts', 'gutenberg_enqueue_workflow_palette_assets' );
