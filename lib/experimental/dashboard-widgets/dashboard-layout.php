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
 * the layout array.
 */
const GUTENBERG_DASHBOARD_LAYOUT_KEY = 'dashboardLayout';

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
 *               containing the extended persisted preferences.
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

	$committed = isset( $base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ][ GUTENBERG_DASHBOARD_LAYOUT_KEY ] )
		? $base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ][ GUTENBERG_DASHBOARD_LAYOUT_KEY ]
		: array();

	if ( ! empty( $committed ) ) {
		return $value;
	}

	/**
	 * Filters the default dashboard layout served to users who have
	 * not customized theirs.
	 *
	 * Each entry should match the dashboard's widget instance shape:
	 * `uuid`, `type`, optional `attributes`, optional `placement`.
	 *
	 * @param array  $default_layout Default array of widget instances.
	 * @param string $dashboard_name Identifier of the dashboard
	 *                               receiving the default. Callbacks
	 *                               targeting a specific dashboard
	 *                               should switch on this value.
	 */
	$default = apply_filters( 'gutenberg_dashboard_default_layout', array(), GUTENBERG_DASHBOARD_NAME );

	if ( empty( $default ) || ! is_array( $default ) ) {
		return $value;
	}

	if ( ! isset( $base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ] ) || ! is_array( $base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ] ) ) {
		$base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ] = array();
	}

	$base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ][ GUTENBERG_DASHBOARD_LAYOUT_KEY ] = $default;

	return array( $base );
}

add_filter( 'get_user_metadata', 'gutenberg_inject_dashboard_default_layout', 99, 3 );

/**
 * Returns the default layout registered for a dashboard.
 *
 * Resolves `gutenberg_dashboard_default_layout` for the supplied
 * dashboard name, returning a fresh evaluation of the filter chain
 * each call. Used by the dashboard's JS layer to back a "reset to
 * default" action without depending on the user-meta hydration path.
 *
 * @param WP_REST_Request $request REST request carrying the
 *                                 dashboard name segment.
 * @return WP_REST_Response Response wrapping the default layout
 *                          array.
 */
function gutenberg_get_dashboard_default_layout( $request ) {
	$name    = $request['name'];
	$default = apply_filters( 'gutenberg_dashboard_default_layout', array(), $name );

	if ( ! is_array( $default ) ) {
		$default = array();
	}

	return rest_ensure_response( array_values( $default ) );
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
