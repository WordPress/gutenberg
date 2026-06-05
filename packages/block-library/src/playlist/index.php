<?php
/**
 * Server-side rendering of the `core/playlist` block.
 *
 * @package WordPress
 */

/**
 * Returns the playlist track blocks for a playlist block.
 *
 * @param WP_Block[] $inner_blocks Playlist inner blocks.
 * @return WP_Block[] Playlist track blocks.
 */
function block_core_playlist_get_track_blocks( $inner_blocks ) {
	$track_blocks = array();

	foreach ( $inner_blocks as $inner_block ) {
		if ( 'core/playlist-track' === $inner_block->name ) {
			$track_blocks[] = $inner_block;
			continue;
		}

		if ( 'core/playlist-tracklist' === $inner_block->name ) {
			foreach ( $inner_block->inner_blocks as $track_block ) {
				if ( 'core/playlist-track' === $track_block->name ) {
					$track_blocks[] = $track_block;
				}
			}
		}
	}

	return $track_blocks;
}

/**
 * Returns playlist waveform block attributes.
 *
 * @param WP_Block[] $inner_blocks Playlist inner blocks.
 * @return array|null Waveform block attributes.
 */
function block_core_playlist_get_waveform_attributes( $inner_blocks ) {
	foreach ( $inner_blocks as $inner_block ) {
		if ( 'core/playlist-waveform' === $inner_block->name ) {
			return $inner_block->attributes;
		}
	}

	return null;
}

/**
 * Returns the style slug from a block style class name.
 *
 * @param string $class_name Block class name.
 * @return string|null Style slug.
 */
function block_core_playlist_get_style_from_class_name( $class_name ) {
	if ( preg_match( '/is-style-([\w-]+)/', $class_name, $matches ) ) {
		return $matches[1];
	}

	return null;
}

/**
 * Adds playlist tracklist classes based on playlist attributes.
 *
 * @param string $content    Playlist content.
 * @param array  $attributes Playlist attributes.
 * @return string Playlist content.
 */
function block_core_playlist_update_tracklist_classes( $content, $attributes ) {
	$processor = new WP_HTML_Tag_Processor( $content );
	if ( ! $processor->next_tag( 'ol' ) ) {
		return $content;
	}

	if ( isset( $attributes['showTracklist'] ) && ! $attributes['showTracklist'] ) {
		$processor->add_class( 'wp-block-playlist__tracklist-is-hidden' );
	}

	if ( isset( $attributes['showArtists'] ) && ! $attributes['showArtists'] ) {
		$processor->add_class( 'wp-block-playlist__tracklist-artist-is-hidden' );
	}

	if ( isset( $attributes['showTrackLength'] ) && ! $attributes['showTrackLength'] ) {
		$processor->add_class( 'wp-block-playlist__tracklist-length-is-hidden' );
	}

	if ( ! isset( $attributes['showNumbers'] ) || $attributes['showNumbers'] ) {
		$processor->add_class( 'wp-block-playlist__tracklist-show-numbers' );
	}

	return $processor->get_updated_html();
}

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

	$track_blocks         = block_core_playlist_get_track_blocks( $block->inner_blocks );
	$waveform_attributes  = block_core_playlist_get_waveform_attributes( $block->inner_blocks );
	$waveform_class_names = 'wp-block-playlist-waveform';
	if ( ! empty( $waveform_attributes['className'] ) ) {
		$waveform_class_names .= ' ' . $waveform_attributes['className'];
	}

	// Parse track blocks to extract track data.
	// This approach avoids duplicating track data in the HTML output.
	if ( ! empty( $track_blocks ) ) {
		foreach ( $track_blocks as $inner_block ) {
			$inner_block->context['playlistId'] = $playlist_id;

			$track_attributes  = $inner_block->attributes;
			$unique_id         = $track_attributes['uniqueId'] ?? wp_unique_id( 'playlist-track-' );
			$playlist_tracks[] = $unique_id;

			$inner_block->attributes['uniqueId'] = $unique_id;

			// Extract track metadata from block attributes.
			$title = __( 'Unknown title' );
			if ( isset( $track_attributes['title'] ) && ! empty( $track_attributes['title'] ) ) {
				$title = $track_attributes['title'];
			}

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
	$html        = '<div class="' . esc_attr( $waveform_class_names ) . '"><div class="wp-block-playlist__waveform-player"
			data-wp-watch="callbacks.initWaveformPlayer"
			data-label-play="' . $label_play . '"
			data-label-pause="' . $label_pause . '"
		></div></div>';

	// Add the HTML for the current track inside the figure.
	$figure = null;
	preg_match( '/<figure[^>]*>/', $content, $figure );
	if ( ! empty( $figure[0] ) ) {
		$content = preg_replace( '/(<figure[^>]*>)/', '$1' . $html, $content, 1 );
	}

	$content = block_core_playlist_update_tracklist_classes( $content, $attributes );

	$processor = new WP_HTML_Tag_Processor( $content );
	$processor->next_tag( 'figure' );
	$processor->set_attribute( 'data-wp-interactive', 'core/playlist' );
	// Extract the waveform style from the waveform block style variation class.
	$waveform_style = 'bars';
	if ( ! empty( $waveform_attributes['className'] ) ) {
		$waveform_style = block_core_playlist_get_style_from_class_name(
			$waveform_attributes['className']
		) ?? $waveform_style;
	} elseif ( null === $waveform_attributes && ! empty( $attributes['className'] ) ) {
		// Backward compatibility for playlists saved before the waveform was
		// represented by its own inner block.
		$waveform_style = block_core_playlist_get_style_from_class_name(
			$attributes['className']
		) ?? $waveform_style;
	}

	$processor->set_attribute(
		'data-wp-context',
		json_encode(
			array(
				'playlistId'    => $playlist_id,
				'currentId'     => $current_unique_id,
				'tracks'        => $playlist_tracks,
				'waveformStyle' => $waveform_style,
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
