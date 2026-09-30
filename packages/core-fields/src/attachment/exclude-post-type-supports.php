<?php
/**
 * Attachments opt out of every field of the `post_supports` collection: the
 * media editor has its own fields.
 *
 * @package WordPress
 */

/**
 * Excludes every default field from attachments.
 *
 * @since 7.2.0
 *
 * @param true|string[] $excluded  The ids of the fields the post type does not
 *                                 get from the collections for every post
 *                                 type, or true for all of them.
 * @param string        $post_type The post type.
 * @return true|string[] The excluded fields, true for attachments.
 */
function exclude_post_type_supports_attachment( $excluded, $post_type ) {
	return 'attachment' === $post_type ? true : $excluded;
}
add_filter( 'fields_api_exclude_post_type_supports', 'exclude_post_type_supports_attachment', 10, 2 );
