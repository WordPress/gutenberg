<?php
/**
 * Server-side rendering of the `core/playlist` block.
 *
 * @package gutenberg
 */

 function render_block_core_playlist( $attributes ) {
   $attributes[ 'ids' ] = json_decode( $attributes[ 'ids' ] );
   return wp_playlist_shortcode( $attributes );
 }

/**
 * Renders the `core/playlist` block on server.
 *
 * @param array $attributes The block attributes.
 *
 */
 function playlist_block_callback() {
     wp_register_script(
         'gutenberg-playlist-block',
         plugins_url( 'gutenberg/core-blocks/playlist/index.js', __FILE__ ),
         array( 'wp-blocks', 'wp-element' )
     );
 		register_block_type( 'core/playlist', array(
		    'editor_script'   => 'playlist_block_callback',
				'render_callback' => 'render_block_core_playlist',
        'attributes'      => array(
          'ids'      => array(
      		    'type' => 'string',
      	     ),
      		'type'     => array(
      		    'type' => 'string',
      		),
        ),
 		) );
 }
add_action( 'init', 'playlist_block_callback' );
