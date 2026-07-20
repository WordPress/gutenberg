<?php
/**
 * Plugin compatibility layer for block Navigation Menu capabilities.
 *
 * @package gutenberg
 */

/**
 * Returns the `wp_navigation` post type capability mapping used by Gutenberg.
 *
 * The block Navigation system stores menus as `wp_navigation` posts. These
 * capabilities are intentionally separate from Classic Menus (`nav_menu` terms
 * and `nav_menu_item` posts).
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
 * Returns the block Navigation Menu capability names.
 *
 * @return string[] Capability names.
 */
function gutenberg_get_wp_navigation_menu_capability_names() {
	$capabilities = array_values( gutenberg_get_wp_navigation_post_type_capabilities() );

	return array_values(
		array_filter(
			array_unique( $capabilities ),
			static function ( $capability ) {
				return 'read' !== $capability;
			}
		)
	);
}

/**
 * Checks whether Gutenberg should replace Core's current `wp_navigation` caps.
 *
 * The override is intentionally conservative: if Core or another plugin has
 * already moved any relevant `wp_navigation` primitive capability away from
 * Core's current mapping, Gutenberg leaves the mapping alone.
 *
 * @param array $args Post type registration arguments.
 * @return bool Whether Gutenberg should replace the capability mapping.
 */
function gutenberg_should_override_wp_navigation_post_type_capabilities( $args ) {
	$capabilities = isset( $args['capabilities'] ) && is_array( $args['capabilities'] )
		? $args['capabilities']
		: array();

	// Only override when Core is still using the legacy edit_theme_options mapping.
	if ( empty( $capabilities ) || empty( $capabilities['edit_posts'] ) || 'edit_theme_options' !== $capabilities['edit_posts'] ) {
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
 * Updates the `wp_navigation` post type capabilities.
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
		isset( $args['capabilities'] ) && is_array( $args['capabilities'] )
			? $args['capabilities']
			: array(),
		gutenberg_get_wp_navigation_post_type_capabilities()
	);

	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_filter_wp_navigation_post_type_args', 10, 2 );

/**
 * Grants block Navigation Menu capabilities to users who can edit theme options.
 *
 * This preserves existing behavior without adding the new capabilities to roles
 * in the database. Sites can still grant the new capabilities independently.
 *
 * @param bool[]   $allcaps Array of key/value pairs where keys represent a capability name and boolean values
 *                          represent whether the user has that capability.
 * @param string[] $caps    Required primitive capabilities for the requested capability.
 * @return bool[] Filtered user capabilities.
 */
function gutenberg_maybe_grant_wp_navigation_menu_caps( $allcaps, $caps ) {
	if ( empty( $allcaps['edit_theme_options'] ) ) {
		return $allcaps;
	}

	$navigation_menu_caps = gutenberg_get_wp_navigation_menu_capability_names();

	if ( ! array_intersect( $caps, $navigation_menu_caps ) ) {
		return $allcaps;
	}

	foreach ( $navigation_menu_caps as $capability ) {
		$allcaps[ $capability ] = true;
	}

	return $allcaps;
}
add_filter( 'user_has_cap', 'gutenberg_maybe_grant_wp_navigation_menu_caps', 10, 2 );
