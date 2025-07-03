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

	print_r( $attributes );
	if ( empty( $attributes['currentTrack'] ) ) {
		return '';
	}

	$current_media_id = $attributes['currentTrack'];
	$show_tracklist = isset( $attributes['showTracklist'] ) ? $attributes['showTracklist'] : true;

	wp_enqueue_script_module( '@wordpress/block-library/playlist/view' );

	wp_interactivity_state(
		'core/playlist',
		array(
			'currentTrack'   => function () {
				$state = wp_interactivity_state();
				$context = wp_interactivity_get_context();
				if ( ! isset( $state['tracks'][ $context['currentId'] ] ) ) {
					return array();
				}
				return $state['tracks'][ $context['currentId'] ];
			},
			'isCurrentTrack' => function () {
				$context = wp_interactivity_get_context();
				return $context['currentId'] === $context['uniqueId'];
			},
		)
	);

	// Each track in the playlist is represented by a button.
	// Process the $content to find all buttons and add the tracks to the $playlist_tracks array.
	// Use the $current_unique_id to identify the current track.
	$process_buttons   = new WP_HTML_Tag_Processor( $content );
	$playlist_tracks   = array();
	$current_unique_id = null;
	while ( $process_buttons->next_tag( 'button' ) ) {
		$track_context     = $process_buttons->get_attribute( 'data-wp-context' );
		$track_unique_id   = json_decode( $track_context, true )['uniqueId'];
		$playlist_tracks[] = $track_unique_id;
		if ( $track_unique_id === $current_media_id ) {
			$current_unique_id = $track_unique_id;
		}
	}

	// If there are no tracks but there is a currentTrack set, do not render the block.
	// This can happen for example if the currentTrack was not deleted correctly
	// or if the block is manually edited in the code editor mode.
	if ( empty( $playlist_tracks ) || ! in_array( $current_media_id, $playlist_tracks, true ) ) {
	//	return '';
	}

	// Adds the markup for the current track.
	$html = '<div class="wp-block-playlist__current-item">';

	if ( isset( $attributes['showImages'] ) ? $attributes['showImages'] : false ) {
		$html .=
		'<img
			class="wp-block-playlist__item-image"
			alt=""
			width="70px"
			height="70px"
			data-wp-bind--src="state.currentTrack.image"
			data-wp-bind--hidden="!state.currentTrack.image"
		/>';
	}

	$html .= '
		<div>
			<span class="wp-block-playlist__item-title" data-wp-text="state.currentTrack.title"></span>
			<div class="wp-block-playlist__current-item-artist-album">
				<span class="wp-block-playlist__item-artist" data-wp-text="state.currentTrack.artist"></span>
				<span class="wp-block-playlist__item-album" data-wp-text="state.currentTrack.album"></span>
			</div>
		</div>
	</div>
		<audio
			controls="controls"
			data-wp-on--ended="actions.nextSong"
			data-wp-on--play="actions.isPlaying"
			data-wp-on--pause="actions.isPaused"
			data-wp-bind--src="state.currentTrack.url"
			data-wp-bind--aria-label="state.currentTrack.ariaLabel"
			data-wp-watch="callbacks.autoPlay"
		></audio>
	';

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
				'currentId' => $current_unique_id,
				'tracks'    => $playlist_tracks,
				'isPlaying' => false,
			)
		)
	);

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
