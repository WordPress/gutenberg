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
 * Mirrors the scope read by the JS surface.
 */
const GUTENBERG_DASHBOARD_LAYOUT_SCOPE = 'core/dashboard';

/**
 * Preferences key under `GUTENBERG_DASHBOARD_LAYOUT_SCOPE` that holds
 * the layout array.
 */
const GUTENBERG_DASHBOARD_LAYOUT_KEY = 'dashboardLayout';

/**
 * Injects a registered default dashboard layout into the user's
 * `persisted_preferences` read when the stored layout is empty.
 *
 * Hooks into `get_user_metadata` so the default propagates through
 * the same persistence layer the dashboard's JS surface reads from.
 * The JS side stays oblivious: a default and a user-saved layout
 * look identical at the preferences-store boundary.
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
	 * @param array $default_layout Default array of widget instances.
	 */
	$default = apply_filters( 'gutenberg_dashboard_default_layout', array() );

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
