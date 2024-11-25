<?php
/**
 * Server-side rendering of the `core/playlist` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/playlist` block on server.
 *
 * @since 6.8.0
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the Playlist.
 */
function render_block_core_playlist( $attributes, $content ) {
	if ( empty( $attributes['tracks'] ) ) {
		return '';
	}

	$current_id = $attributes['currentTrack'];

	/**
	 * Return early if no valid track ID is found.
	 * This can happen if the user deleted all tracks but kept an empty inner block, such as the media upload placeholder.
	 */
	if ( empty( $current_id ) ) {
		return '';
	}

	wp_enqueue_script_module( '@wordpress/block-library/playlist/view' );

	$attachment_meta = wp_get_attachment_metadata( $current_id );
	$current_title   = get_the_title( $current_id ) ? get_the_title( $current_id ) : '';
	$current_artist  = isset( $attachment_meta['artist'] ) ? $attachment_meta['artist'] : '';
	$current_album   = isset( $attachment_meta['album'] ) ? $attachment_meta['album'] : '';
	$current_image   = isset( $attachment_meta['poster'] ) ? $attachment_meta['poster'] : '';
	$current_url     = wp_get_attachment_url( $current_id );
	$show_images     = isset( $attributes['showImages'] ) ? $attributes['showImages'] : false;
	$aria_label      = $current_title;

	if ( $current_title && $current_artist && $current_album ) {
		$aria_label = sprintf(
			/* translators: %1$s: track title, %2$s artist name, %3$s: album name. */
			_x( '%1$s by %2$s from the album %3$s', 'track title, artist name, album name' ),
			$current_title,
			$current_artist,
			$current_album
		);
	}

	wp_interactivity_state(
		'core/playlist',
		array(
			'currentID'     => $current_id,
			'currentURL'    => $current_url,
			'currentTitle'  => $current_title,
			'currentAlbum'  => $current_album,
			'currentArtist' => $current_artist,
			'currentImage'  => $current_image,
			'ariaLabel'     => $aria_label,
		)
	);

	// Add the markup for the current track
	$html = '<div><div class="wp-block-playlist__current-item">';
	if ( $show_images && $current_image ) {
		$html .=
		'<img
			class="wp-block-playlist__item-image"
			src={ ' . esc_url( $current_image ) . '}
			alt=""
			width="70px"
			height="70px"
			data-wp-bind--src="state.currentImage"
		/>';
	}
	$html .= '
		<div>
			<span class="wp-block-playlist__item-title" data-wp-text="state.currentTitle">' . $current_title . '</span>
			<div class="wp-block-playlist__current-item-artist-album">
				<span class="wp-block-playlist__item-artist" data-wp-text="state.currentArtist">' . $current_artist . '</span>
				<span class="wp-block-playlist__item-album" data-wp-text="state.currentAlbum">' . $current_album . '</span>
			</div>
		</div>';
	$html .= '</div><audio controls="controls" src="' . esc_url( $current_url ) . '"
		data-wp-bind--src="state.currentURL"
		data-wp-bind--aria-label="state.ariaLabel"
		data-wp-watch="callbacks.init"
		"/></audio></div>';

	$figure = null;
	preg_match( '/<figure[^>]*>/', $content, $figure );
	if ( ! empty( $figure[0] ) ) {
		$content = preg_replace( '/(<figure[^>]*>)/', '$1' . $html, $content, 1 );
	}

	$processor = new WP_HTML_Tag_Processor( $content );
	$processor->next_tag( 'figure' );
	$processor->set_attribute( 'data-wp-interactive', 'core/playlist' );

	while ( $processor->next_tag( 'button' ) ) {
		$context = $processor->get_attribute( 'data-wp-context' );
		$context = json_decode( $context, true ) ? json_decode( $context, true ) : array();
		if ( isset( $context['trackID'] ) && $context['trackID'] === $current_id ) {
			$processor->set_attribute( 'aria-current', 'true' );
		}
	}

	return $processor->get_updated_html();
}

/**
 * Registers the `core/playlist` block on server.
 *
 * @since 6.8.0
 */
function register_block_core_playlist() {
	register_block_type_from_metadata(
		__DIR__ . '/playlist',
		array(
			'render_callback' => 'render_block_core_playlist',
		)
	);
}
add_action( 'init', 'register_block_core_playlist' );
