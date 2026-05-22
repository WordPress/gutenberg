<?php
/**
 * Dashboard Layout: starter content shipped with the experiment.
 *
 * Registers a small default layout under `gutenberg_dashboard_default_layout`
 * so the dashboard renders something meaningful the first time a user opens
 * it. Plugins and themes can layer their own callback on top of the same
 * filter to extend or replace this set.
 *
 * @package gutenberg
 */

/**
 * Appends the bundled `core/hello-world` instance to the default layout
 * unless something earlier in the filter chain already added it.
 *
 * Only contributes to the bundled `gutenberg_dashboard` surface; other
 * dashboards are left untouched.
 *
 * @param array  $dashboard_layout Default layout produced by previous
 *                                 callbacks on `gutenberg_dashboard_default_layout`.
 * @param string $dashboard_name   Identifier of the dashboard surface
 *                                 receiving the default.
 * @return array The layout extended with the bundled widget instance.
 */
function gutenberg_seed_default_dashboard_layout( $dashboard_layout, $dashboard_name = '' ) {
	if ( 'gutenberg_dashboard' !== $dashboard_name ) {
		return $dashboard_layout;
	}

	$uuids = array_column( $dashboard_layout, 'uuid' );

	if ( ! in_array( 'default-welcome-widget-instance', $uuids, true ) ) {
		$dashboard_layout[] = array(
			'uuid'      => 'default-welcome-widget-instance',
			'type'      => 'core/welcome',
			'placement' => array(
				'width'  => 'full',
				'height' => 2,
				'order'  => 0,
			),
		);
	}

	if ( ! in_array( 'default-hello-world-widget-instance', $uuids, true ) ) {
		$dashboard_layout[] = array(
			'uuid'      => 'default-hello-world-widget-instance',
			'type'      => 'core/hello-world',
			'placement' => array(
				'width'  => 2,
				'height' => 1,
				'order'  => 1,
			),
		);
	}

	return $dashboard_layout;
}

add_filter( 'gutenberg_dashboard_default_layout', 'gutenberg_seed_default_dashboard_layout', 10, 2 );
