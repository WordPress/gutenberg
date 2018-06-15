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
 * @return string Playlist output. Empty string if the passed type is unsupported.
 */
function render_block_core_playlist( $attributes ) {
	$attributes['ids'] = json_decode( $attributes['ids'] );
	return wp_playlist_shortcode( $attributes );
}

/**
 * Registers the `core/playlist` block on server.
 */
function register_block_core_playlist() {
	register_block_type( 'core/playlist', array(
		'render_callback' => 'render_block_core_playlist',
		'attributes'      => array(
			'ids'  => array(
				'type' => 'string',
			),
			'type' => array(
				'type' => 'string',
			),
		),
	) );
}
add_action( 'init', 'register_block_core_playlist' );
