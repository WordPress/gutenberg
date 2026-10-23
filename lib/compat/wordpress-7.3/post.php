<?php
/**
 * WordPress 7.3 compatibility functions for the Gutenberg
 * editor plugin changes related to post types.
 *
 * @package gutenberg
 */

/**
 * Adds the `item_draft_saved` label to post types registered on WordPress
 * versions that don't define it yet.
 *
 * @param string       $post_type        Post type key.
 * @param WP_Post_Type $post_type_object Registered post type object.
 */
function gutenberg_add_item_draft_saved_post_type_label( $post_type, $post_type_object ) {
	if ( isset( $post_type_object->labels->item_draft_saved ) ) {
		return;
	}

	$post_type_object->labels->item_draft_saved = 'wp_block' === $post_type
		? __( 'Pattern draft saved.', 'gutenberg' )
		: __( 'Draft saved.', 'gutenberg' );
}
add_action( 'registered_post_type', 'gutenberg_add_item_draft_saved_post_type_label', 10, 2 );
