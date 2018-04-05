<?php
/**
 * Server-side rendering of the `core/video` block.
 *
 * @package gutenberg
 */

function register_core_video_block() {
	wp_register_script( 'core-video-block', gutenberg_url( '/build/__block_video.js' ) );

	wp_register_style(
		'core-video-block',
		gutenberg_url( '/build/__block_video.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_video.css' )
	);

	wp_style_add_data( 'core-video-block', 'rtl', 'replace' );

	register_block_type( 'core/video', array(
		'style' => 'core-video-block',
		'editor_script' => 'core-video-block',
	) );
}

add_action( 'init', 'register_core_video_block' );
