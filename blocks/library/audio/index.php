<?php
/**
 * Server-side rendering of the `core/audio` block.
 *
 * @package gutenberg
 */

function register_core_audio_block() {
	wp_register_script( 'core-audio-block', gutenberg_url( '/build/__block_audio.js' ) );

	register_block_type( 'core/audio', array(
		'editor_script' => 'core-audio-block',
	) );
}

add_action( 'init', 'register_core_audio_block' );
