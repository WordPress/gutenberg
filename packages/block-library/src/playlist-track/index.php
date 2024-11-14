<?php
/**
 * Server-side rendering of the `core/playlist-track` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/playlist-track` block on server.
 *
 * @since 6.8.0
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the Playlist Track.
 */
function render_block_core_playlist_track( $attributes ) {
	if ( empty( $attributes['id'] ) ) {
		return '';
	}

	$id     = $attributes['id'];
	$album  = isset( $attributes['album'] ) ? $attributes['album'] : '';
	$artist = isset( $attributes['artist'] ) ? $attributes['artist'] : '';
	$image  = isset( $attributes['image'] ) ? $attributes['image'] : '';
	$length = isset( $attributes['length'] ) ? $attributes['length'] : '';
	$title  = isset( $attributes['title'] ) ? $attributes['title'] : '';
	$url    = isset( $attributes['url'] ) ? $attributes['url'] : '';

	$wrapper_attributes = get_block_wrapper_attributes();

	$contexts = wp_interactivity_data_wp_context(
		array(
			'trackID'       => $id,
			'trackURL'      => $url,
			'trackTitle'    => $title,
			'trackArtist'   => $artist,
			'trackAlbum'    => $album,
			'trackImageSrc' => $image,
		)
	);

	$html  = '<li ' . $wrapper_attributes . '>';
	$html .= '<button ' . $contexts . 'data-wp-on--click="actions.changeTrack" class="wp-block-playlist-track__button">';

	if ( $title ) {
		$html .= '<span class="wp-block-playlist-track__title">' . wp_kses_post( $title ) . '</span>';
	}
	if ( $artist ) {
		$html .= '<span class="wp-block-playlist-track__artist">' . wp_kses_post( $artist ) . '</span>';
	}

	if ( $length ) {
		$html .= '<span class="wp-block-playlist-track__length">' .
		sprintf(
			/* translators: %s: track length in minutes:seconds */
			'<span class="screen-reader-text">' . esc_html__( 'Length:' ) . ' </span>%s',
			$length
		);
		$html .= '</span>';
	}

	$html .= '<span class="screen-reader-text">' . esc_html__( 'Select to play this track' ) . '</span>';
	$html .= '</button>';
	$html .= '</li>';

	return $html;
}

/**
 * Registers the `core/playlist-track` block on server.
 *
 * @since 6.8.0
 */
function register_block_core_playlist_track() {
	register_block_type_from_metadata(
		__DIR__ . '/playlist-track',
		array(
			'render_callback' => 'render_block_core_playlist_track',
		)
	);
}
add_action( 'init', 'register_block_core_playlist_track' );
