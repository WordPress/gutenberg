<?php
/**
 * Template parts opt out of the default author field of the `post_supports`
 * collection: they declare their own client-side.
 *
 * @package WordPress
 */

/**
 * Excludes the default author field from template parts.
 *
 * @since 7.2.0
 *
 * @param true|string[] $excluded  The ids of the fields the post type does not
 *                                 get from the collections for every post
 *                                 type, or true for all of them.
 * @param string        $post_type The post type.
 * @return true|string[] The excluded fields, with `author` for template parts.
 */
function exclude_post_type_supports_wp_template_part( $excluded, $post_type ) {
	if ( 'wp_template_part' !== $post_type || true === $excluded ) {
		return $excluded;
	}

	$excluded   = is_array( $excluded ) ? $excluded : array();
	$excluded[] = 'author';
	return $excluded;
}
add_filter( 'fields_api_exclude_post_type_supports', 'exclude_post_type_supports_wp_template_part', 10, 2 );
