<?php
/**
 * Server-side rendering of the `core/playlist` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/playlist` block on the server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Playlist output. Empty string if the passed type is unsupported.
 */
function render_block_core_playlist( $attributes ) {
	$attributes['ids']          = json_decode( $attributes['ids'] );
	$attributes['artists']      = $attributes['showArtists'];
	$attributes['tracknumbers'] = $attributes['showTrackNumbers'];

	$classes = empty( $attributes['align'] ) ? 'wp-block-playlist' : 'wp-block-playlist align' . $attributes['align'];
	$html    = sprintf( '<figure class="%s">%s</figure>',
		esc_attr( $classes ),
		wp_playlist_shortcode( $attributes )
	);

	return $html;
}

/**
 * Registers the `core/playlist` block on server.
 */
function register_block_core_playlist() {
	register_block_type( 'core/playlist', array(
		'render_callback' => 'render_block_core_playlist',
		'attributes'      => array(
			'ids'              => array(
						'type' 	  => 'string',
			),
			'type'             => array(
						'type'    => 'string',
						'default' => 'audio',
			),
			'tracklist'        => array(
						'type'    => 'boolean',
						'default' => true,
			),
			'showArtists'      => array(
						'type'    => 'boolean',
						'default' => true,
			),
			'showTrackNumbers' => array(
						'type'    => 'boolean',
						'default' => true,
			),
			'images'           => array(
						'type'    => 'boolean',
						'default' => true,
			),
			'style'            => array(
						'type'    => 'string',
						'default' => 'light',
			),
			'align'            => array(
						'type' 	  => 'string',
			),
		),
	) );
}
add_action( 'init', 'register_block_core_playlist' );
