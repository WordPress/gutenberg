<?php
/**
 * Server-side registration of the `core/playlist-waveform` block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/playlist-waveform` block on server.
 *
 * @since 6.9.0
 */
function register_block_core_playlist_waveform() {
	register_block_type_from_metadata(
		__DIR__ . '/playlist-waveform',
		array(
			'render_callback' => '__return_empty_string',
		)
	);
}
add_action( 'init', 'register_block_core_playlist_waveform' );
