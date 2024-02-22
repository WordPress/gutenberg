<?php

/**
 * Workaround for Core versions < 6.5 to register navigation link variations on registration
 *
 * @param array $args The block type arguments.
 * @return array The updated block type arguments.
 */
function gutenberg_navigation_link_variations_compat( $args ) {

	if ( 'core/navigation-link' !== $args['name'] || ! empty( $args['variation_callback'] ) ) {
		return $args;
	}
	$args['variation_callback'] = 'gutenberg_block_core_navigation_link_build_variations';
	return $args;
}

if ( ! method_exists( 'WP_Block_Type', 'get_variations' ) ) {
	add_filter( 'register_block_type_args', 'gutenberg_navigation_link_variations_compat', 9 );
}

/**
 * Registers custom post type variations for navigation link on post type registration
 * Handles all post types registered after the block is registered in register_navigation_link_post_type_variations
 *
 * @since 6.5.0
 * @deprecated 6.5.0 Use WP_Block_Type::get_variations / get_block_type_variations filter instead.
 *
 * @param string       $post_type The post type name passed from registered_post_type action hook.
 * @param WP_Post_Type $post_type_object The post type object passed from registered_post_type.
 */
function gutenberg_block_core_navigation_link_register_post_type_variation( $post_type, $post_type_object ) {
	_deprecated_function( __FUNCTION__, '6.5.0', 'WP_Block_Type::get_variations' );
	if ( $post_type_object->show_in_nav_menus ) {
		$variation = build_variation_for_navigation_link( $post_type_object, 'post-type' );
		gutenberg_block_core_navigation_link_register_variation( $variation );
	}
}

/**
 * Registers a custom taxonomy variation for navigation link on taxonomy registration
 * Handles all taxonomies registered after the block is registered in register_navigation_link_post_type_variations
 *
 * @since 6.5.0
 * @deprecated 6.5.0 Use WP_Block_Type::get_variations / get_block_type_variations filter instead.
 *
 * @param string       $taxonomy Taxonomy slug.
 * @param array|string $object_type Object type or array of object types.
 * @param array        $args Array of taxonomy registration arguments.
 */
function gutenberg_block_core_navigation_link_register_taxonomy_variation( $taxonomy, $object_type, $args ) {
	_deprecated_function( __FUNCTION__, '6.5.0', 'WP_Block_Type::get_variations' );
	if ( isset( $args['show_in_nav_menus'] ) && $args['show_in_nav_menus'] ) {
		$variation = build_variation_for_navigation_link( (object) $args, 'post-type' );
		gutenberg_block_core_navigation_link_register_variation( $variation );
	}
}

/**
 * Unregisters a custom post type variation for navigation link on post type unregistration.
 *
 * @since 6.5.0
 * @deprecated 6.5.0 Use WP_Block_Type::get_variations / get_block_type_variations filter instead.
 *
 * @param string $post_type The post type name passed from unregistered_post_type action hook.
 */
function gutenberg_block_core_navigation_link_unregister_post_type_variation( $post_type ) {
	_deprecated_function( __FUNCTION__, '6.5.0', 'WP_Block_Type::get_variations' );
	gutenberg_block_core_navigation_link_unregister_variation( $post_type );
}

/**
 * Unregisters a custom taxonomy variation for navigation link on taxonomy unregistration.
 *
 * @since 6.5.0
 * @deprecated 6.5.0 Use WP_Block_Type::get_variations / get_block_type_variations filter instead.
 *
 * @param string $taxonomy The taxonomy name passed from unregistered_taxonomy action hook.
 */
function gutenberg_block_core_navigation_link_unregister_taxonomy_variation( $taxonomy ) {
	_deprecated_function( __FUNCTION__, '6.5.0', 'WP_Block_Type::get_variations' );
	gutenberg_block_core_navigation_link_unregister_variation( $taxonomy );
}

/**
 * Registers a variation for a post type / taxonomy for the navigation link block.
 *
 * @since 6.5.0
 * @deprecated 6.5.0 Use WP_Block_Type::get_variations / get_block_type_variations filter instead.
 *
 * @param array $variation Variation array from build_variation_for_navigation_link.
 */
function gutenberg_block_core_navigation_link_register_variation( $variation ) {
	_deprecated_function( __FUNCTION__, '6.5.0', 'WP_Block_Type::get_variations' );
	/*
	 * Directly set the variations on the registered block type
	 * because there's no server side registration for variations (see #47170).
	 */
	$navigation_block_type = WP_Block_Type_Registry::get_instance()->get_registered( 'core/navigation-link' );
	/*
	 * If the block is not registered yet, bail early.
	 * Variation will be registered in register_block_core_navigation_link then.
	 */
	if ( ! $navigation_block_type ) {
		return;
	}

	$navigation_block_type->variations = array_merge(
		$navigation_block_type->variations,
		array( $variation )
	);
}

/**
 * Unregisters a variation for a post type / taxonomy for the navigation link block.
 *
 * @since 6.5.0
 * @deprecated 6.5.0 Use WP_Block_Type::get_variations / get_block_type_variations filter instead.
 *
 * @param string $name Name of the post type / taxonomy (which was used as variation name).
 */
function gutenberg_block_core_navigation_link_unregister_variation( $name ) {
	_deprecated_function( __FUNCTION__, '6.5.0', 'WP_Block_Type::get_variations' );
	/*
	 * Directly get the variations from the registered block type
	 * because there's no server side (un)registration for variations (see #47170).
	 */
	$navigation_block_type = WP_Block_Type_Registry::get_instance()->get_registered( 'core/navigation-link' );
	// If the block is not registered (yet), there's no need to remove a variation.
	if ( ! $navigation_block_type || empty( $navigation_block_type->variations ) ) {
		return;
	}
	$variations = $navigation_block_type->variations;
	// Search for the variation and remove it from the array.
	foreach ( $variations as $i => $variation ) {
		if ( $variation['name'] === $name ) {
			unset( $variations[ $i ] );
			break;
		}
	}
	// Reindex array after removing one variation.
	$navigation_block_type->variations = array_values( $variations );
}
