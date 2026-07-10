<?php
/**
 * Server-side registration of the `core/playlist-tracklist` block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/playlist-tracklist` block on server.
 *
 * @since 6.9.0
 */
function register_block_core_playlist_tracklist() {
	register_block_type_from_metadata( __DIR__ . '/playlist-tracklist' );
}
add_action( 'init', 'register_block_core_playlist_tracklist' );
