<?php
/**
 * Post meta registration for featured video and audio.
 *
 * @package gutenberg
 */

/**
 * Registers post meta for featured video and featured audio.
 *
 * These meta keys parallel `_thumbnail_id` (featured image) and are registered
 * for all post types that support post meta. Exposing them via the REST API
 * allows the block editor to read and write them through `editPost( { meta: ... } )`.
 *
 * The auth callback gates writes on the per-post `edit_post` capability,
 * matching how core's `_wp_check_thumbnail_meta_cap` protects `_thumbnail_id`.
 * Using the global `edit_posts` capability would let any contributor write
 * featured-media meta to any post, including ones they don't own.
 *
 * @since 7.1.0
 */
function gutenberg_register_featured_media_post_meta() {
	$args = array(
		'type'          => 'integer',
		'single'        => true,
		'show_in_rest'  => true,
		'default'       => 0,
		'auth_callback' => static function ( $allowed, $meta_key, $object_id ) {
			return current_user_can( 'edit_post', $object_id );
		},
	);

	// Empty string registers for all post types.
	register_post_meta( '', '_featured_video_id', $args );
	register_post_meta( '', '_featured_audio_id', $args );
}
add_action( 'init', 'gutenberg_register_featured_media_post_meta' );
