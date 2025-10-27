<?php
/**
 * Enqueues the assets required for the Workflow Palette.
 *
 * @package gutenberg
 */

/**
 * Enqueue workflow palette assets on all admin pages when the experiment is enabled.
 */
function gutenberg_enqueue_workflow_palette_assets() {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-workflow-palette' ) ) {
		return;
	}

	wp_enqueue_script( 'wp-workflow' );
	wp_enqueue_style( 'wp-workflow' );

	wp_add_inline_script(
		'wp-workflow',
		'( function() {
			if ( window.wp && window.wp.workflow && window.wp.workflow.WorkflowMenu ) {
				var root = document.createElement( "div" );
				document.body.appendChild( root );
				var WorkflowMenu = window.wp.workflow.WorkflowMenu;
				if ( window.wp.element && window.wp.element.createRoot ) {
					window.wp.element.createRoot( root ).render(
						window.wp.element.createElement( WorkflowMenu )
					);
				}
			}
		} )();'
	);
}

add_action( 'admin_enqueue_scripts', 'gutenberg_enqueue_workflow_palette_assets' );
