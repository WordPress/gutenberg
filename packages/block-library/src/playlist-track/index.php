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

	$id                 = $attributes['id'];
	$attachment_meta    = wp_get_attachment_metadata( $id );
	$wrapper_attributes = get_block_wrapper_attributes();
	$url                = isset( $attatchment_meta['url'] ) ? $attachment_meta['url'] : '';
	$title              = get_the_title( $id ) ? get_the_title( $id ) : '';
	$artist             = isset( $attachment_meta['artist'] ) ? $attachment_meta['artist'] : '';
	$album              = isset( $attachment_meta['album'] ) ? $attachment_meta['album'] : '';
	$image              = isset( $attachment_meta['poster'] ) ? $attachment_meta['poster'] : '';
	$length             = isset( $attachment_meta['length_formatted'] ) ? $attachment_meta['length_formatted'] : '';

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
