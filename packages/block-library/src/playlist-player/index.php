<?php
/**
 * Server-side registration of the `core/playlist-player` block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/playlist-player` block on server.
 *
 * @since 6.9.0
 */
function register_block_core_playlist_player() {
	register_block_type_from_metadata( __DIR__ . '/playlist-player' );
}
add_action( 'init', 'register_block_core_playlist_player' );
