<?php
/**
 * Server-side rendering of the `core/video` block.
 *
 * @package gutenberg
 */

function register_core_video_block() {
	wp_register_script( 'core-video-block', gutenberg_url( '/build/blocks/library/video.js' ) );

	wp_register_style(
		'core-video-block',
		gutenberg_url( '/build/blocks/library/video.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/blocks/library/video.css' )
	);

	wp_style_add_data( 'core-video-block', 'rtl', 'replace' );

	wp_register_style(
		'core-video-block-editor',
		gutenberg_url( '/build/blocks/library/video_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/blocks/library/video_editor.css' )
	);
	
	wp_style_add_data( 'core-video-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/video', array(
		'style' => 'core-video-block',
		'editor_style' => 'core-video-block-editor',
		'editor_script' => 'core-video-block',
	) );
}

add_action( 'init', 'register_core_video_block' );
