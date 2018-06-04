<?php
/**
 * Server-side rendering of the `core/playlist` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/playlist` block on server.
 *
 * @param array $attributes The block attributes.
 *
 */

 function playlist_block_callback_dependencies() {
     wp_register_script(
         'gutenberg-playlist-block',
         plugins_url( 'gutenberg/core-blocks/playlist/index.js', __FILE__ ),
         array( 'wp-blocks', 'wp-element' )
     );
 		register_block_type( 'core/playlist', array(
 						'editor_script' => 'playlist_block_callback_dependencies',
 						'render_callback' => 'wp_playlist_shortcode',
 		) );
 }
add_action( 'init', 'playlist_block_callback_dependencies' );
