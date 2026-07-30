<?php
/**
 * Widget-owned icons.
 *
 * Icons the in-tree widgets reference declaratively but that are not
 * part of the public `core` collection are registered here, under a
 * collection the widgets own. `widget.json` references them by name
 * (`dashboard-widgets/drafts`) and hosts resolve them through the
 * Icons API like any other registered icon.
 *
 * @package gutenberg
 */

/**
 * Registers the dashboard widgets icon collection and its icons.
 *
 * Icon content is sourced from the `@wordpress/icons` library files, so
 * a widget's declarative reference renders the same asset its metadata
 * module would import.
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
