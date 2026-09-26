<?php
/**
 * Plugin Name: Gutenberg Test Site Editor Read-Only Navigation Permissions
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-site-editor-read-only-navigation-permissions
 */

/**
 * Denies Navigation Menu write capabilities for the E2E test user.
 *
 * The user deliberately retains the Administrator role and its
 * `edit_theme_options` capability. Running after Gutenberg's compatibility
 * bridge models a permissions plugin that makes only Navigation Menu entities
 * read-only for a user who can otherwise use the Site Editor.
 *
 * @param bool[]  $allcaps All capabilities for the user.
 * @param string[] $caps    Primitive capabilities required by the check.
 * @param mixed[]  $args    Arguments that accompany the capability check.
 * @param WP_User  $user    User object.
 * @return bool[] Filtered capabilities.
 */
function gutenberg_test_deny_navigation_caps_for_site_editor_user( $allcaps, $caps, $args, $user ) {
	if ( 'site-editor-user-with-navigation-write-denied' !== $user->user_login ) {
		return $allcaps;
	}

	$navigation_capabilities = array(
		'create_navigation_menus',
		'delete_others_navigation_menus',
		'delete_navigation_menus',
		'delete_private_navigation_menus',
		'delete_published_navigation_menus',
		'edit_others_navigation_menus',
		'edit_navigation_menus',
		'edit_private_navigation_menus',
		'edit_published_navigation_menus',
		'publish_navigation_menus',
		'read_private_navigation_menus',
	);

	foreach ( $navigation_capabilities as $capability ) {
		$allcaps[ $capability ] = false;
	}

	return $allcaps;
}
add_filter( 'user_has_cap', 'gutenberg_test_deny_navigation_caps_for_site_editor_user', 20, 4 );
