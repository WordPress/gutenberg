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
	wp_enqueue_script_module( '@wordpress/workflow' );
}

add_action( 'admin_enqueue_scripts', 'gutenberg_enqueue_workflow_palette_assets' );
