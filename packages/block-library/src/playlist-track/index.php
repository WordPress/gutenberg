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
 * @param array    $attributes     The block attributes.
 *
 * @return string Returns the Playlist Track.
 */
function render_block_core_playlist_track( $attributes ) {
	if ( empty( $attributes['id'] ) ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();

	$unique_id  = wp_unique_prefixed_id( 'playlist-track-' );
	$media_id   = $attributes['id'];
	$album      = isset( $attributes['album'] ) ? $attributes['album'] : '';
	$artist     = isset( $attributes['artist'] ) ? $attributes['artist'] : '';
	$image      = isset( $attributes['image'] ) ? $attributes['image'] : '';
	$length     = isset( $attributes['length'] ) ? $attributes['length'] : '';
	$title      = isset( $attributes['title'] ) && ! empty( $attributes['title'] ) ? $attributes['title'] : __( 'Unknown title' );
	$url        = isset( $attributes['src'] ) ? $attributes['src'] : '';
	$aria_label = $title;

	if ( $title && $artist && $album ) {
		$aria_label = sprintf(
			/* translators: %1$s: track title, %2$s artist name, %3$s: album name. */
			_x( '%1$s by %2$s from the album %3$s', 'track title, artist name, album name' ),
			$title,
			$artist,
			$album
		);
	}

	$context = wp_interactivity_data_wp_context( array( 'id' => $unique_id ) );

	wp_interactivity_state(
		'core/playlist',
		array(
			'tracks' => array(
				$unique_id => array(
					'media_id'  => $media_id,
					'url'       => $url,
					'title'     => $title,
					'artist'    => $artist,
					'album'     => $album,
					'image'     => $image,
					'length'    => $length,
					'ariaLabel' => $aria_label,
				),
			),
		)
	);

	$html  = '<li ' . $wrapper_attributes . '>';
	$html .= '<button ' . $context . 'data-wp-on--click="actions.changeTrack" data-wp-bind--aria-current="state.isCurrentTrack" class="wp-block-playlist-track__button">';

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
