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
	$args['variation_callback'] = 'build_navigation_link_block_variations';
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
function block_core_navigation_link_register_post_type_variation( $post_type, $post_type_object ) { // phpcs:ignore Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration
	_deprecated_function( __FUNCTION__, '6.5.0', 'WP_Block_Type::get_variations' );
	if ( $post_type_object->show_in_nav_menus ) {
		$variation = build_variation_for_navigation_link( $post_type_object, 'post-type' );
		block_core_navigation_link_register_variation( $variation );
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
function block_core_navigation_link_register_taxonomy_variation( $taxonomy, $object_type, $args ) { // phpcs:ignore Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration
	_deprecated_function( __FUNCTION__, '6.5.0', 'WP_Block_Type::get_variations' );
	if ( isset( $args['show_in_nav_menus'] ) && $args['show_in_nav_menus'] ) {
		$variation = build_variation_for_navigation_link( (object) $args, 'post-type' );
		block_core_navigation_link_register_variation( $variation );
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
function block_core_navigation_link_unregister_post_type_variation( $post_type ) { // phpcs:ignore Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration
	_deprecated_function( __FUNCTION__, '6.5.0', 'WP_Block_Type::get_variations' );
	block_core_navigation_link_unregister_variation( $post_type );
}

/**
 * Unregisters a custom taxonomy variation for navigation link on taxonomy unregistration.
 *
 * @since 6.5.0
 * @deprecated 6.5.0 Use WP_Block_Type::get_variations / get_block_type_variations filter instead.
 *
 * @param string $taxonomy The taxonomy name passed from unregistered_taxonomy action hook.
 */
function block_core_navigation_link_unregister_taxonomy_variation( $taxonomy ) { // phpcs:ignore Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration
	_deprecated_function( __FUNCTION__, '6.5.0', 'WP_Block_Type::get_variations' );
	block_core_navigation_link_unregister_variation( $taxonomy );
}
