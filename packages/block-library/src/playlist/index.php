<?php
/**
 * Server-side rendering of the `core/playlist` block.
 *
 * @package WordPress
 */

/**
 * Adds a playlist track to the render-time player state.
 *
 * @param array $track_attributes Track block attributes.
 * @param array $playlist_tracks  Track IDs for the playlist context.
 * @param array $tracks_data      Track data for interactivity state.
 * @param bool  $show_images      Whether track images should be exposed.
 */
function block_core_playlist_add_track_data( $track_attributes, &$playlist_tracks, &$tracks_data, $show_images ) {
	if ( empty( $track_attributes['id'] ) ) {
		return;
	}

	$track_id          = 'track-' . count( $playlist_tracks );
	$playlist_tracks[] = $track_id;

	// Extract track metadata from block attributes.
	$title      = isset( $track_attributes['title'] ) && ! empty( $track_attributes['title'] ) ? $track_attributes['title'] : __( 'Unknown title' );
	$artist     = $track_attributes['artist'] ?? '';
	$album      = $track_attributes['album'] ?? '';
	$image      = $track_attributes['image'] ?? '';
	$image_alt  = $track_attributes['imageAlt'] ?? '';
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
	$tracks_data[ $track_id ] = array(
		'url'       => esc_url( $url ),
		'title'     => wp_strip_all_tags( $title ),
		'artist'    => wp_strip_all_tags( $artist ),
		'album'     => wp_strip_all_tags( $album ),
		'image'     => $show_images ? esc_url( $image ) : '',
		'imageAlt'  => $show_images ? wp_strip_all_tags( $image_alt ) : '',
		'ariaLabel' => wp_strip_all_tags( $aria_label ),
	);
}

/**
 * Recursively collects track data from playlist inner blocks.
 *
 * @param WP_Block_List|array $inner_blocks     Inner blocks to inspect.
 * @param array               $playlist_tracks  Track IDs for the playlist context.
 * @param array               $tracks_data      Track data for interactivity state.
 * @param bool                $show_images      Whether track images should be exposed.
 */
function block_core_playlist_collect_tracks( $inner_blocks, &$playlist_tracks, &$tracks_data, $show_images = true ) {
	foreach ( $inner_blocks as $inner_block ) {
		if ( 'core/playlist-tracklist' === $inner_block->name ) {
			$tracklist_show_images = $inner_block->attributes['showImages'] ?? $show_images;
			block_core_playlist_collect_tracks( $inner_block->inner_blocks, $playlist_tracks, $tracks_data, $tracklist_show_images );
			continue;
		}

		if ( 'core/playlist-track' === $inner_block->name ) {
			block_core_playlist_add_track_data( $inner_block->attributes, $playlist_tracks, $tracks_data, $show_images );
			continue;
		}

		if ( ! empty( $inner_block->inner_blocks ) ) {
			block_core_playlist_collect_tracks( $inner_block->inner_blocks, $playlist_tracks, $tracks_data, $show_images );
		}
	}
}

/**
 * Extracts the block style variation slug from a class string.
 *
 * @param string $class_name Class name string.
 * @return string|null The style variation slug.
 */
function block_core_playlist_get_style_variation( $class_name ) {
	if ( ! empty( $class_name ) && preg_match( '/is-style-([\w-]+)/', $class_name, $matches ) ) {
		return $matches[1];
	}

	return null;
}

/**
 * Finds the playlist player style variation from inner blocks.
 *
 * @param WP_Block_List|array $inner_blocks Inner blocks to inspect.
 * @return string|null The player style variation slug.
 */
function block_core_playlist_get_player_style( $inner_blocks ) {
	foreach ( $inner_blocks as $inner_block ) {
		if ( 'core/playlist-player' === $inner_block->name ) {
			return block_core_playlist_get_style_variation( $inner_block->attributes['className'] ?? '' );
		}

		if ( ! empty( $inner_block->inner_blocks ) ) {
			$style = block_core_playlist_get_player_style( $inner_block->inner_blocks );
			if ( null !== $style ) {
				return $style;
			}
		}
	}

	return null;
}

/**
 * Adds the Interactivity API attributes and translated labels to the player.
 *
 * @param string $content The block content.
 * @param array  $labels  Translated player labels.
 * @return string Updated block content.
 */
function block_core_playlist_add_player_attributes( $content, $labels ) {
	$processor = new WP_HTML_Tag_Processor( $content );
	if ( ! $processor->next_tag( array( 'class_name' => 'wp-block-playlist-player' ) ) ) {
		$processor = new WP_HTML_Tag_Processor( $content );
		if ( ! $processor->next_tag( array( 'class_name' => 'wp-block-playlist__waveform-player' ) ) ) {
			return $content;
		}
	}

	$processor->add_class( 'wp-block-playlist-player' );
	$processor->add_class( 'wp-block-playlist__waveform-player' );
	$processor->set_attribute( 'data-wp-watch', 'callbacks.initWaveformPlayer' );
	$processor->set_attribute( 'data-label-play', $labels['play'] );
	$processor->set_attribute( 'data-label-pause', $labels['pause'] );
	$processor->set_attribute( 'data-label-seek', $labels['seek'] );
	$processor->set_attribute( 'data-label-seek-value', $labels['seek_value'] );

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
	$playlist_id     = wp_unique_id( 'playlist-' );
	$playlist_tracks = array();
	$tracks_data     = array();

	// Parse inner blocks to extract track data.
	// This approach avoids duplicating track data in the HTML output.
	if ( ! empty( $block->inner_blocks ) ) {
		block_core_playlist_collect_tracks(
			$block->inner_blocks,
			$playlist_tracks,
			$tracks_data,
			$attributes['showImages'] ?? true
		);
	}

	if ( empty( $playlist_tracks ) ) {
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

	$labels  = array(
		'play'       => __( 'Play' ),
		'pause'      => __( 'Pause' ),
		'seek'       => __( 'Seek' ),
		/* translators: %1$s: current audio time, %2$s: total audio duration. */
		'seek_value' => _x( '%1$s of %2$s', 'audio current time of total duration' ),
	);
	$content = block_core_playlist_add_player_attributes( $content, $labels );

	// Add a fallback waveform player container for older playlist markup.
	if ( ! str_contains( $content, 'data-wp-watch="callbacks.initWaveformPlayer"' ) ) {
		$html   = '<div class="wp-block-playlist-player wp-block-playlist__waveform-player"
			data-wp-watch="callbacks.initWaveformPlayer"
			data-label-play="' . esc_attr( $labels['play'] ) . '"
			data-label-pause="' . esc_attr( $labels['pause'] ) . '"
			data-label-seek="' . esc_attr( $labels['seek'] ) . '"
			data-label-seek-value="' . esc_attr( $labels['seek_value'] ) . '"
		></div>';
		$figure = null;
		preg_match( '/<figure[^>]*>/', $content, $figure );
		if ( ! empty( $figure[0] ) ) {
			$content = preg_replace( '/(<figure[^>]*>)/', '$1' . $html, $content, 1 );
		}
	}

	$processor = new WP_HTML_Tag_Processor( $content );
	$processor->next_tag( 'figure' );
	$processor->set_attribute( 'data-wp-interactive', 'core/playlist' );
	$waveform_style = block_core_playlist_get_player_style( $block->inner_blocks ) ??
		block_core_playlist_get_style_variation( $attributes['className'] ?? '' ) ??
		'bars';

	$processor->set_attribute(
		'data-wp-context',
		wp_json_encode(
			array(
				'playlistId'    => $playlist_id,
				'currentId'     => $playlist_tracks[0],
				'tracks'        => $playlist_tracks,
				'waveformStyle' => $waveform_style,
			)
		)
	);

	// Track IDs are render-time only. Add them after inner blocks have rendered
	// so track buttons can update the Interactivity API state without storing
	// persistent unique IDs in post content.
	$track_index = 0;
	while ( $processor->next_tag( array( 'class_name' => 'wp-block-playlist-track__button' ) ) ) {
		$track_id = $playlist_tracks[ $track_index ] ?? null;

		if ( null === $track_id ) {
			break;
		}

		$processor->set_attribute(
			'data-wp-context',
			wp_json_encode(
				array(
					'trackId' => $track_id,
				)
			)
		);

		++$track_index;
	}

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
