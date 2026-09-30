<?php
/**
 * Registers the fields of the `wp_template_part` collection: the fields
 * template parts have instead of the defaults.
 *
 * Template parts support authors, so they get the default author field of
 * the `post_supports` collection like any other post type. Yet they have
 * their own author field, declared client-side in
 * packages/fields/src/fields/template-author/index.tsx, which reads the
 * theme or plugin that provides them instead of the post author. The
 * collection has no fields of its own yet: it only removes the default
 * author field.
 *
 * @package WordPress
 */

/**
 * Removes the default author field of template parts.
 *
 * It runs right after the default fields are registered, on
 * `fields_api_init` at priority 9, so a plugin hooking the action at the
 * default priority sees the final defaults.
 *
 * @param WP_Fields_Registry $registry The registry being read.
 */
function register_core_fields_wp_template_part( $registry ) {
	$registry->unregister( 'postType', 'wp_template_part', array( 'author' ) );
}
add_action( 'fields_api_init', 'register_core_fields_wp_template_part', 9 );
