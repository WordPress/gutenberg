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
 * @since 7.1.0
 */
function gutenberg_register_featured_media_post_meta() {
	$args = array(
		'type'          => 'integer',
		'single'        => true,
		'show_in_rest'  => true,
		'default'       => 0,
		'auth_callback' => static function () {
			return current_user_can( 'edit_posts' );
		},
	);

	// Empty string registers for all post types.
	register_post_meta( '', '_featured_video_id', $args );
	register_post_meta( '', '_featured_audio_id', $args );
}
add_action( 'init', 'gutenberg_register_featured_media_post_meta' );


