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
 * only for post types that support `post-thumbnails`. A post type that opts
 * out of featured images shouldn't surface featured video/audio either, and
 * keeping the registration scoped avoids polluting the REST attachment payload
 * for unrelated post types.
 *
 * The auth callback gates writes on the per-post `edit_post` capability,
 * matching how core's `_wp_check_thumbnail_meta_cap` protects `_thumbnail_id`.
 * Using the global `edit_posts` capability would let any contributor write
 * featured-media meta to any post, including ones they don't own.
 *
 * Runs at priority 20 so post types registered at the default priority of 10
 * are visible by the time we iterate.
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

	$post_types = get_post_types( array( 'show_in_rest' => true ) );
	foreach ( $post_types as $post_type ) {
		if ( ! post_type_supports( $post_type, 'thumbnail' ) ) {
			continue;
		}
		register_post_meta( $post_type, '_featured_video_id', $args );
		register_post_meta( $post_type, '_featured_audio_id', $args );
	}
}
add_action( 'init', 'gutenberg_register_featured_media_post_meta', 20 );
