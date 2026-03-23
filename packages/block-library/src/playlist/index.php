<?php
/**
 * Server-side rendering of the `core/playlist` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/playlist` block on server.
 *
 * @since 6.9.0
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block      The block instance.
 *
 * @return string Returns the Playlist.
 */
function render_block_core_playlist( $attributes, $content, $block ) {
	if ( empty( $attributes['currentTrack'] ) ) {
		return '';
	}

	$current_media_id  = $attributes['currentTrack'];
	$playlist_id       = wp_unique_id( 'playlist-' );
	$playlist_tracks   = array();
	$tracks_data       = array();
	$current_unique_id = null;

	// Parse inner blocks to extract track data.
	// This approach avoids duplicating track data in the HTML output.
	if ( ! empty( $block->inner_blocks ) ) {
		foreach ( $block->inner_blocks as $inner_block ) {
			if ( 'core/playlist-track' === $inner_block->name ) {
				$inner_block->context['playlistId'] = $playlist_id;

				$track_attributes  = $inner_block->attributes;
				$unique_id         = $track_attributes['uniqueId'] ?? wp_unique_id( 'playlist-track-' );
				$playlist_tracks[] = $unique_id;

				$inner_block->attributes['uniqueId'] = $unique_id;

				// Extract track metadata from block attributes.
				$title      = isset( $track_attributes['title'] ) && ! empty( $track_attributes['title'] ) ? $track_attributes['title'] : __( 'Unknown title' );
				$artist     = $track_attributes['artist'] ?? '';
				$album      = $track_attributes['album'] ?? '';
				$image      = $track_attributes['image'] ?? '';
				$url        = $track_attributes['src'] ?? '';
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

				// Data is passed to wp_interactivity_state() which JSON-encodes it,
				// so we use wp_strip_all_tags() instead of esc_html() to prevent
				// HTML injection without double-encoding. URLs still use esc_url().
				$tracks_data[ $unique_id ] = array(
					'url'       => esc_url( $url ),
					'title'     => wp_strip_all_tags( $title ),
					'artist'    => wp_strip_all_tags( $artist ),
					'album'     => wp_strip_all_tags( $album ),
					'image'     => esc_url( $image ),
					'ariaLabel' => wp_strip_all_tags( $aria_label ),
				);

				if ( $unique_id === $current_media_id ) {
					$current_unique_id = $unique_id;
				}
			}
		}
	}

	// If there are no tracks but there is a currentTrack set, do not render the block.
	// This can happen for example if the currentTrack was not deleted correctly
	// or if the block is manually edited in the code editor mode.
	if ( empty( $playlist_tracks ) || ! in_array( $current_media_id, $playlist_tracks, true ) ) {
		return '';
	}

	wp_enqueue_script_module( '@wordpress/block-library/playlist/view' );

	// Add the playlist tracks to the global state,
	// but keep them isolated from other playlists with the help of playlistId.
	wp_interactivity_state(
		'core/playlist',
		array(
			'playlists' => array(
				$playlist_id => array(
					'tracks' => $tracks_data,
				),
			),
		)
	);

	// Add waveform player container with translated button labels.
	$label_play  = esc_attr__( 'Play' );
	$label_pause = esc_attr__( 'Pause' );
	$html        = '<div class="wp-block-playlist__waveform-player"
		data-wp-watch="callbacks.initWaveformPlayer"
		data-label-play="' . $label_play . '"
		data-label-pause="' . $label_pause . '"
	></div>';

	// Add the HTML for the current track inside the figure.
	$figure = null;
	preg_match( '/<figure[^>]*>/', $content, $figure );
	if ( ! empty( $figure[0] ) ) {
		$content = preg_replace( '/(<figure[^>]*>)/', '$1' . $html, $content, 1 );
	}

	$processor = new WP_HTML_Tag_Processor( $content );
	$processor->next_tag( 'figure' );
	$processor->set_attribute( 'data-wp-interactive', 'core/playlist' );
	$processor->set_attribute(
		'data-wp-context',
		json_encode(
			array(
				'playlistId' => $playlist_id,
				'currentId'  => $current_unique_id,
				'tracks'     => $playlist_tracks,
			)
		)
	);

	return $processor->get_updated_html();
}

/**
 * Registers the `core/playlist` block on server.
 *
 * @since 6.9.0
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
