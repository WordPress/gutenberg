<?php
/**
 * Server-side rendering of the `core/playlist-track` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/playlist-track` block on server.
 *
 * @since 6.9.0
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the Playlist Track.
 */
function render_block_core_playlist_track( $attributes ) {
	if ( empty( $attributes['id'] ) ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();

	$unique_id = isset( $attributes['uniqueId'] ) ? $attributes['uniqueId'] : wp_unique_id( 'playlist-track-' );
	$artist    = isset( $attributes['artist'] ) ? $attributes['artist'] : '';
	$length    = isset( $attributes['length'] ) ? $attributes['length'] : '';
	$title     = isset( $attributes['title'] ) && ! empty( $attributes['title'] ) ? $attributes['title'] : __( 'Unknown title' );

	$context = wp_interactivity_data_wp_context(
		array(
			'uniqueId' => $unique_id,
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
			'<span class="screen-reader-text">' . esc_html__( 'Length: %s' ) . ' </span>',
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
 * @since 6.9.0
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
