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
 * Appends the bundled widget instances to the default layout, skipping any
 * entry whose `uuid` was already added by an earlier callback in the chain.
 *
 * @param array $dashboard_layout Default layout produced by previous
 *                                callbacks on `gutenberg_dashboard_default_layout`.
 * @return array The layout extended with the bundled widget instances.
 */
function gutenberg_seed_default_dashboard_layout( $dashboard_layout ) {
	$seeds = array(
		array(
			'uuid'      => 'default-welcome-widget-instance',
			'type'      => 'core/welcome',
			'placement' => array(
				'width'  => 'full',
				'height' => 1,
			),
		),
		array(
			'uuid'      => 'default-site-preview-widget-instance',
			'type'      => 'core/site-preview',
			'placement' => array(
				'width'  => 2,
				'height' => 2,
			),
		),
		array(
			'uuid'      => 'default-site-health-widget-instance',
			'type'      => 'core/site-health',
			'placement' => array(
				'width'  => 1,
				'height' => 2,
			),
		),
		array(
			'uuid'      => 'default-quick-draft-widget-instance',
			'type'      => 'core/quick-draft',
			'placement' => array(
				'width'  => 1,
				'height' => 2,
			),
		),
		array(
			'uuid'      => 'default-activity-widget-instance',
			'type'      => 'core/activity',
			'placement' => array(
				'width'  => 1,
				'height' => 3,
			),
		),
		array(
			'uuid'      => 'default-news-widget-instance',
			'type'      => 'core/news',
			'placement' => array(
				'width'  => 1,
				'height' => 2,
			),
		),
		array(
			'uuid'      => 'default-events-widget-instance',
			'type'      => 'core/events',
			'placement' => array(
				'width'  => 1,
				'height' => 2,
			),
		),
		array(
			'uuid'      => 'default-hello-dolly-widget-instance',
			'type'      => 'core/hello-dolly',
			'placement' => array(
				'width'  => 1,
				'height' => 1,
			),
		),
	);

	$existing_uuids = array_column( $dashboard_layout, 'uuid' );

	foreach ( $seeds as $seed ) {
		if ( ! in_array( $seed['uuid'], $existing_uuids, true ) ) {
			$dashboard_layout[] = $seed;
		}
	}

	return $dashboard_layout;
}

add_filter( 'gutenberg_dashboard_default_layout', 'gutenberg_seed_default_dashboard_layout' );
