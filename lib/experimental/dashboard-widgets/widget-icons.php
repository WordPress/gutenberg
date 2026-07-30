<?php
/**
 * Widget-owned icons.
 *
 * Icons the widgets reference declaratively but that are not public in
 * the `core` collection, registered under a collection the widgets own.
 *
 * @package gutenberg
 */

/**
 * Registers the dashboard widgets icon collection and its icons.
 *
 * Content is sourced from the `@wordpress/icons` library files.
 */
function gutenberg_register_dashboard_widget_icons() {
	if ( ! function_exists( 'wp_register_icon_collection' ) ) {
		return;
	}

	// Register widget-dashboard icon collection
	wp_register_icon_collection(
		'dashboard-widgets',
		array(
			'label'       => __( 'Dashboard Widgets', 'gutenberg' ),
			'description' => __( 'Icons owned by the dashboard widgets.', 'gutenberg' ),
		)
	);

	// Register temporary draft icon since it's still a core private icon
	wp_register_icon(
		'dashboard-widgets/drafts',
		array(
			'label'     => __( 'Drafts', 'gutenberg' ),
			'file_path' => gutenberg_dir_path() . 'packages/icons/src/library/drafts.svg',
		)
	);

	// Register temporary WordPress icon since it's still a core private icon
	wp_register_icon(
		'dashboard-widgets/wordpress',
		array(
			'label'     => __( 'WordPress', 'gutenberg' ),
			'file_path' => gutenberg_dir_path() . 'packages/icons/src/library/wordpress.svg',
		)
	);

	// Register temporary site logo icon since it's still a core private icon
	wp_register_icon(
		'dashboard-widgets/site-logo',
		array(
			'label'     => __( 'Site Logo', 'gutenberg' ),
			'file_path' => gutenberg_dir_path() . 'packages/icons/src/library/site-logo.svg',
		)
	);
}
add_action( 'init', 'gutenberg_register_dashboard_widget_icons' );
