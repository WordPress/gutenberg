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

	wp_add_inline_script(
		'wp-workflow',
		sprintf(
			'window.wpWorkflowPaletteEnabled = %s;',
			gutenberg_is_experiment_enabled( 'gutenberg-workflow-palette' ) ? 'true' : 'false'
		),
		'before'
	);
}

add_action( 'admin_enqueue_scripts', 'gutenberg_enqueue_workflow_palette_assets' );
