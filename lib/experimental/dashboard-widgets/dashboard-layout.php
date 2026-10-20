<?php
/**
 * Dashboard Layout: server-side defaults.
 *
 * Allows plugins and themes to register a default dashboard layout
 * that surfaces transparently through the `@wordpress/preferences`
 * store for users who have not customized theirs.
 *
 * @package gutenberg
 */

/**
 * Preferences scope under which the dashboard layout is stored.
 * Mirrors the scope read by the dashboard's JS layer.
 */
const GUTENBERG_DASHBOARD_LAYOUT_SCOPE = 'core/dashboard';

/**
 * Preferences key under `GUTENBERG_DASHBOARD_LAYOUT_SCOPE` that holds
 * the layout record: the widget instances and the geometry their
 * placements count against.
 */
const GUTENBERG_DASHBOARD_LAYOUT_KEY = 'dashboardLayout';

/**
 * Geometry the bundled default layout counts against: four columns of
 * 40px rows, what the wp-admin dashboard renders with. Placements
 * contributed to `gutenberg_dashboard_default_layout` for the bundled
 * dashboard are expressed in it. The record served to the JS layer
 * carries it, so a dashboard rendering with another geometry rescales
 * the default on read.
 */
const GUTENBERG_DASHBOARD_LAYOUT_GEOMETRY = array(
	'columns'   => 4,
	'rowHeight' => 40,
);

/**
 * Identifier of the bundled dashboard, formatted as `<plugin>_<page>`
 * to match the underscore form produced by the wp-build pipeline
 * (mirrors the `{{PREFIX}}_{{PAGE_SLUG_UNDERSCORE}}` pair used in
 * generated page templates).
 *
 * Passed as context to `gutenberg_dashboard_default_layout` and used
 * as the `{name}` segment of the REST default-layout route.
 */
const GUTENBERG_DASHBOARD_NAME = 'gutenberg_dashboard';

/**
 * Constrains a layout geometry to a positive column count and row height.
 *
 * @param mixed $geometry Geometry to check.
 * @return array|null The geometry with its two fields, or null when invalid.
 */
function gutenberg_sanitize_dashboard_layout_geometry( $geometry ) {
	if ( ! is_array( $geometry ) ) {
		return null;
	}

	$columns    = $geometry['columns'] ?? null;
	$row_height = $geometry['rowHeight'] ?? null;

	if ( ! is_numeric( $columns ) || (int) $columns < 1 || ! is_numeric( $row_height ) || $row_height <= 0 ) {
		return null;
	}

	return array(
		'columns'   => (int) $columns,
		'rowHeight' => $row_height + 0,
	);
}

/**
 * Resolves the default layout record of a dashboard: the widget instances
 * registered for it and the geometry their placements count against.
 *
 * @param string $dashboard_name Identifier of the dashboard.
 * @return array The record, with `geometry` and `widgets`; `widgets` is
 *               empty when nothing is registered.
 */
function gutenberg_get_dashboard_default_layout_record( $dashboard_name ) {
	/**
	 * Filters the default dashboard layout served to users who have
	 * not customized theirs.
	 *
	 * Each entry should match the dashboard's widget instance shape:
	 * `uuid`, `type`, optional `attributes`, optional `placement`.
	 * Placements count against the geometry resolved through
	 * `gutenberg_dashboard_default_layout_geometry`.
	 *
	 * @param array  $default_layout Default array of widget instances.
	 * @param string $dashboard_name Identifier of the dashboard
	 *                               receiving the default. Callbacks
	 *                               targeting a specific dashboard
	 *                               should switch on this value.
	 */
	$default = apply_filters( 'gutenberg_dashboard_default_layout', array(), $dashboard_name );

	if ( ! is_array( $default ) ) {
		$default = array();
	}

	/**
	 * Filters the geometry the default layout of a dashboard counts against.
	 *
	 * Placements are relative to a column count and a row height. The
	 * bundled dashboard renders with four columns of 40px rows; a
	 * dashboard that renders with another geometry declares it here, so
	 * the JS layer rescales the default on read.
	 *
	 * @param array  $geometry       Geometry with `columns` and `rowHeight`.
	 * @param string $dashboard_name Identifier of the dashboard.
	 */
	$geometry = apply_filters( 'gutenberg_dashboard_default_layout_geometry', GUTENBERG_DASHBOARD_LAYOUT_GEOMETRY, $dashboard_name );

	return array(
		'geometry' => gutenberg_sanitize_dashboard_layout_geometry( $geometry ) ?? GUTENBERG_DASHBOARD_LAYOUT_GEOMETRY,
		'widgets'  => array_values( $default ),
	);
}

/**
 * Injects a registered default dashboard layout into the user's
 * `persisted_preferences` read when the stored layout is empty.
 *
 * Hooks into `get_user_metadata` so the default propagates through
 * the same persistence layer the dashboard's JS layer reads from.
 * The JS side stays oblivious: a default and a user-saved layout
 * look identical at the preferences-store boundary.
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @param mixed  $value    The pre-fetched value, or null to let the
 *                         meta API resolve normally.
 * @param int    $user_id  User ID.
 * @param string $meta_key Meta key being read.
 * @return mixed The original value, or a single-element array
 *               containing the extended persisted preferences, where
 *               the layout is a record of `geometry` and `widgets`.
 */
function gutenberg_inject_dashboard_default_layout( $value, $user_id, $meta_key ) {
	global $wpdb;

	$expected_key = $wpdb->get_blog_prefix() . 'persisted_preferences';
	if ( $meta_key !== $expected_key ) {
		return $value;
	}

	// Avoid recursion when reading the user meta.
	remove_filter( 'get_user_metadata', __FUNCTION__, 99 );
	$base = get_user_meta( $user_id, $meta_key, true );
	add_filter( 'get_user_metadata', __FUNCTION__, 99, 3 );

	if ( ! is_array( $base ) ) {
		$base = array();
	}

	$committed = $base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ][ GUTENBERG_DASHBOARD_LAYOUT_KEY ] ?? array();

	if ( ! empty( $committed ) ) {
		return $value;
	}

	$record = gutenberg_get_dashboard_default_layout_record( GUTENBERG_DASHBOARD_NAME );

	if ( empty( $record['widgets'] ) ) {
		return $value;
	}

	if ( ! isset( $base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ] ) || ! is_array( $base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ] ) ) {
		$base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ] = array();
	}

	$base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ][ GUTENBERG_DASHBOARD_LAYOUT_KEY ] = $record;

	return array( $base );
}

add_filter( 'get_user_metadata', 'gutenberg_inject_dashboard_default_layout', 99, 3 );

/**
 * Returns the default layout record registered for a dashboard.
 *
 * Resolves the filter chain for the supplied dashboard name on each
 * call. Used by the dashboard's JS layer to back a "reset to default"
 * action without depending on the user-meta hydration path.
 *
 * @param WP_REST_Request $request REST request carrying the
 *                                 dashboard name segment.
 * @return WP_REST_Response Response wrapping the record of `geometry`
 *                          and `widgets`.
 */
function gutenberg_get_dashboard_default_layout( $request ) {
	return rest_ensure_response( gutenberg_get_dashboard_default_layout_record( $request['name'] ) );
}

/**
 * Registers the REST route that exposes per-dashboard default layouts.
 */
function gutenberg_register_dashboard_default_layout_route() {
	register_rest_route(
		'wp/v2',
		'/dashboards/(?P<name>[a-z][a-z0-9]*(?:_[a-z0-9]+)+)/default-layout',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'gutenberg_get_dashboard_default_layout',
			'permission_callback' => function () {
				return current_user_can( 'read' );
			},
			'args'                => array(
				'name' => array(
					'description' => __( 'Dashboard identifier as produced by the build pipeline.', 'gutenberg' ),
					'type'        => 'string',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_dashboard_default_layout_route' );
