<?php
/**
 * WordPress 7.3 compatibility functions for the dedicated block Navigation
 * Menu (`wp_navigation`) capabilities.
 *
 * @package gutenberg
 */

/**
 * Returns the `wp_navigation` post type capability mapping.
 *
 * The block Navigation system stores menus as `wp_navigation` posts. These
 * capabilities are intentionally separate from Classic Menus (`nav_menu` terms
 * and `nav_menu_item` posts), which keep using `edit_theme_options`.
 *
 * @return string[] Capability mapping keyed by post type capability name.
 */
function gutenberg_get_wp_navigation_post_type_capabilities() {
	return array(
		'create_posts'           => 'create_navigation_menus',
		'delete_others_posts'    => 'delete_others_navigation_menus',
		'delete_posts'           => 'delete_navigation_menus',
		'delete_private_posts'   => 'delete_private_navigation_menus',
		'delete_published_posts' => 'delete_published_navigation_menus',
		'edit_others_posts'      => 'edit_others_navigation_menus',
		'edit_posts'             => 'edit_navigation_menus',
		'edit_private_posts'     => 'edit_private_navigation_menus',
		'edit_published_posts'   => 'edit_published_navigation_menus',
		'publish_posts'          => 'publish_navigation_menus',
		'read'                   => 'read',
		'read_private_posts'     => 'read_private_navigation_menus',
	);
}

/**
 * Returns the block Navigation Menu primitive capability names.
 *
 * @return string[] Capability names, excluding the shared `read` capability.
 */
function gutenberg_get_wp_navigation_menu_capability_names() {
	return array_values(
		array_diff(
			array_unique( gutenberg_get_wp_navigation_post_type_capabilities() ),
			array( 'read' )
		)
	);
}

/**
 * Checks whether Gutenberg should replace Core's current `wp_navigation` caps.
 *
 * The override is intentionally conservative: if Core or another plugin has
 * already moved any relevant `wp_navigation` primitive capability away from
 * Core's `edit_theme_options` mapping, Gutenberg leaves the mapping alone.
 *
 * @param array $args Post type registration arguments.
 * @return bool Whether Gutenberg should replace the capability mapping.
 */
function gutenberg_should_override_wp_navigation_post_type_capabilities( $args ) {
	$capabilities = isset( $args['capabilities'] ) && is_array( $args['capabilities'] )
		? $args['capabilities']
		: array();

	// Only override when Core is still using the legacy edit_theme_options mapping.
	if ( empty( $capabilities['edit_posts'] ) || 'edit_theme_options' !== $capabilities['edit_posts'] ) {
		return false;
	}

	foreach ( gutenberg_get_wp_navigation_post_type_capabilities() as $capability_name => $mapped_capability ) {
		$core_capability = 'read' === $mapped_capability ? 'read' : 'edit_theme_options';

		if (
			isset( $capabilities[ $capability_name ] ) &&
			$core_capability !== $capabilities[ $capability_name ]
		) {
			return false;
		}
	}

	return true;
}

/**
 * Maps the `wp_navigation` post type to the block Navigation Menu capabilities.
 *
 * @param array  $args      Post type registration arguments.
 * @param string $post_type Post type name.
 * @return array Filtered post type registration arguments.
 */
function gutenberg_filter_wp_navigation_post_type_args( $args, $post_type ) {
	if ( 'wp_navigation' !== $post_type ) {
		return $args;
	}

	if ( ! gutenberg_should_override_wp_navigation_post_type_capabilities( $args ) ) {
		return $args;
	}

	$args['map_meta_cap'] = true;
	/*
	 * Core migration: replace the capabilities array on the
	 * register_post_type( 'wp_navigation', ... ) call in wp-includes/post.php,
	 * inside create_initial_post_types().
	 */
	$args['capabilities'] = array_merge(
		$args['capabilities'],
		gutenberg_get_wp_navigation_post_type_capabilities()
	);

	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_filter_wp_navigation_post_type_args', 10, 2 );

/**
 * Filters the user capabilities to grant the block Navigation Menu capabilities
 * as necessary.
 *
 * A user with `edit_theme_options` qualifies for every block Navigation Menu
 * capability, which keeps the access they had before the capabilities were
 * split out, without writing the new capabilities to roles in the database.
 *
 * Only capabilities that have no value for the user are granted. A capability
 * stored as `false` on one of the user's roles, or on the user, is how role
 * editors record a denial, and is kept.
 *
 * Runs at priority 1, like Core's `wp_maybe_grant_*` filters, so that
 * `user_has_cap` filters at the default priority see the granted capabilities
 * and can still deny them.
 *
 * Core migration: becomes `wp_maybe_grant_navigation_menu_caps()` in
 * wp-includes/capabilities.php, hooked in wp-includes/default-filters.php.
 *
 * @param bool[]   $allcaps An array of all the user's capabilities.
 * @param string[] $caps    Required primitive capabilities for the requested capability.
 * @return bool[] Filtered array of the user's capabilities.
 */
function gutenberg_maybe_grant_navigation_menu_caps( $allcaps, $caps ) {
	if ( empty( $allcaps['edit_theme_options'] ) ) {
		return $allcaps;
	}

	$navigation_menu_caps = gutenberg_get_wp_navigation_menu_capability_names();

	// Most checks don't involve Navigation Menus, so skip them cheaply.
	if ( ! array_intersect( (array) $caps, $navigation_menu_caps ) ) {
		return $allcaps;
	}

	foreach ( $navigation_menu_caps as $capability ) {
		if ( ! array_key_exists( $capability, $allcaps ) ) {
			$allcaps[ $capability ] = true;
		}
	}

	return $allcaps;
}

if ( ! function_exists( 'wp_maybe_grant_navigation_menu_caps' ) ) {
	add_filter( 'user_has_cap', 'gutenberg_maybe_grant_navigation_menu_caps', 1, 2 );
}
