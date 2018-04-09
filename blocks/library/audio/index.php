<?php
/**
 * Server-side rendering of the `core/audio` block.
 *
 * @package gutenberg
 */

function register_core_audio_block() {
	wp_register_script( 'core-audio-block', gutenberg_url( '/build/blocks/library/audio.js' ) );

	wp_register_style(
		'core-audio-block',
		gutenberg_url( '/build/blocks/library/audio.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/blocks/library/audio.css' )
	);
	
	wp_style_add_data( 'core-audio-block', 'rtl', 'replace' );

	wp_register_style(
		'core-audio-block-editor',
		gutenberg_url( '/build/blocks/library/audio_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/blocks/library/audio_editor.css' )
	);
	
	wp_style_add_data( 'core-audio-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/audio', array(
		'style' => 'core-audio-block',
		'editor_style' => 'core-audio-block-editor',
		'editor_script' => 'core-audio-block',
	) );
}

add_action( 'init', 'register_core_audio_block' );