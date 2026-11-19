<?php
/**
 * Plugin Name: Gutenberg Test Site Editor Read-Only Navigation Permissions
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-site-editor-read-only-navigation-permissions
 */

const GUTENBERG_TEST_READ_ONLY_NAVIGATION_ROLE = 'gutenberg_test_read_only_navigation_administrator';

/**
 * Adds a copy of the Administrator role that denies Navigation Menu writes.
 *
 * Users with the role keep `edit_theme_options`, so they can use the Site
 * Editor. The Navigation Menu capabilities are stored as `false` on the role,
 * which is how role editors record a denial, so the `edit_theme_options`
 * compatibility bridge leaves them denied.
 */
function gutenberg_test_add_read_only_navigation_role() {
	if ( get_role( GUTENBERG_TEST_READ_ONLY_NAVIGATION_ROLE ) ) {
		return;
	}

	$administrator = get_role( 'administrator' );
	if ( ! $administrator ) {
		return;
	}

	$denied_capabilities = array(
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

	add_role(
		GUTENBERG_TEST_READ_ONLY_NAVIGATION_ROLE,
		'Administrator (read-only Navigation Menus)',
		array_merge(
			$administrator->capabilities,
			array_fill_keys( $denied_capabilities, false )
		)
	);
}
add_action( 'init', 'gutenberg_test_add_read_only_navigation_role' );

register_deactivation_hook(
	__FILE__,
	static function () {
		remove_role( GUTENBERG_TEST_READ_ONLY_NAVIGATION_ROLE );
	}
);
