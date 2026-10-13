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
 * Appends the bundled widget instances to the default layout unless an
 * earlier callback in the filter chain already added them.
 *
 * Only contributes to the bundled `gutenberg_dashboard`; other
 * dashboards are left untouched.
 *
 * @param array  $dashboard_layout Default layout produced by previous
 *                                 callbacks on `gutenberg_dashboard_default_layout`.
 * @param string $dashboard_name   Identifier of the dashboard receiving
 *                                 the default.
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
				'height' => 3,
				'order'  => 0,
			),
		);
	}

	if ( ! in_array( 'default-activity-widget-instance', $uuids, true ) ) {
		$dashboard_layout[] = array(
			'uuid'      => 'default-activity-widget-instance',
			'type'      => 'core/activity',
			'placement' => array(
				'width'  => 3,
				'height' => 3,
				'order'  => 1,
			),
		);
	}

	if ( ! in_array( 'default-quick-draft-widget-instance', $uuids, true ) ) {
		$dashboard_layout[] = array(
			'uuid'      => 'default-quick-draft-widget-instance',
			'type'      => 'core/quick-draft',
			'placement' => array(
				'width'  => 4,
				'height' => 3,
				'order'  => 2,
			),
		);
	}

	if ( ! in_array( 'default-site-health-widget-instance', $uuids, true ) ) {
		$dashboard_layout[] = array(
			'uuid'      => 'default-site-health-widget-instance',
			'type'      => 'core/site-health',
			'placement' => array(
				'width'  => 2,
				'height' => 2,
				'order'  => 3,
			),
		);
	}

	if ( ! in_array( 'default-preview-widget-instance', $uuids, true ) ) {
		$dashboard_layout[] = array(
			'uuid'      => 'default-preview-widget-instance',
			'type'      => 'core/site-preview',
			'placement' => array(
				'width'  => 2,
				'height' => 3,
				'order'  => 4,
			),
		);
	}

	return $dashboard_layout;
}

add_filter( 'gutenberg_dashboard_default_layout', 'gutenberg_seed_default_dashboard_layout', 10, 2 );
