<?php
/**
 * Server-side rendering of the `core/video` block.
 *
 * @package gutenberg
 */

function register_core_video_block() {
	wp_register_script( 'core-video-block', gutenberg_url( '/build/__block_video.js' ) );

	register_block_type( 'core/video', array(
		'editor_script' => 'core-video-block',
	) );
}

add_action( 'init', 'register_core_video_block' );
