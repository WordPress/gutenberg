<?php
/**
 * Registers the field collections of WordPress core through the Fields API,
 * like a plugin registers its own.
 *
 * Each collection is a folder next to this file, see
 * wp_register_field_collection() for its format. A collection whose post
 * type opts out of fields of the `post_supports` collection does it in its
 * `exclude-post-type-supports.php`, on the
 * `fields_api_exclude_post_type_supports` filter.
 *
 * @package WordPress
 */

require __DIR__ . '/attachment/exclude-post-type-supports.php';
require __DIR__ . '/wp_template/exclude-post-type-supports.php';
require __DIR__ . '/wp_template_part/exclude-post-type-supports.php';

/**
 * Registers the field collections of WordPress core.
 *
 * Hooked at priority 0, so a plugin hooking `fields_api_init` at the
 * default priority sees the core fields registered.
 *
 * @since 7.2.0
 *
 * @param WP_Fields_Registry $registry The registry being read.
 */
function register_core_field_collections( $registry ) {
	wp_register_field_collection( $registry, __DIR__ . '/post_supports' );
	wp_register_field_collection( $registry, __DIR__ . '/wp_template' );
	wp_register_field_collection( $registry, __DIR__ . '/wp_template_part' );
	wp_register_field_collection( $registry, __DIR__ . '/attachment' );
}
add_action( 'fields_api_init', 'register_core_field_collections', 0 );
