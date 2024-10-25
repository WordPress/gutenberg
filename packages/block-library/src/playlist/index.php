<?php
/**
 * Server-side rendering of the `core/playlist` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/playlist` block on server.
 *
 * @since 6.7.0
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the Playlist.
 */
function render_block_core_playlist( $attributes ) {
	if ( empty( $attributes['ids'] ) ) {
		return '';
	}

	wp_enqueue_script_module( '@wordpress/block-library/playlist/view' );

	/**
	 * Wether to display specific parts of the playlist, depending on the block options:
	 */
	$tracklist    = isset( $attributes['tracklist'] ) ? $attributes['tracklist'] : true;
	$tracknumbers = isset( $attributes['tracknumbers'] ) ? $attributes['tracknumbers'] : true;
	$artists      = isset( $attributes['artists'] ) ? $attributes['artists'] : true;
	$images       = isset( $attributes['images'] ) ? $attributes['images'] : true;
	$tagname      = $tracknumbers ? 'ol' : 'ul';
	$caption      = isset( $attributes['caption'] ) ? $attributes['caption'] : '';

	/**
	 * Assign the current track information to variables.
	 * The current track is the first one in the list.
	 */
	$current_id     = $attributes['ids'][0]['id'];
	$current_title  = isset( $attributes['ids'][0]['title'] ) ? $attributes['ids'][0]['title'] : '';
	$current_album  = isset( $attributes['ids'][0]['album'] ) ? $attributes['ids'][0]['album'] : '';
	$current_artist = isset( $attributes['ids'][0]['artist'] ) ? $attributes['ids'][0]['artist'] : '';

	$wrapper_attributes = get_block_wrapper_attributes();
	$placeholder_image  = '/wp-includes/images/media/audio.png';
	$aria_label         = $current_title;

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
			'currentURL'    => $attributes['ids'][0]['url'],
			'currentTitle'  => $current_title,
			'currentAlbum ' => $current_album,
			'currentArtist' => $current_artist,
			'currentImage'  => isset( $attributes['ids'][0]['image']['src'] ) ? $attributes['ids'][0]['image']['src'] : $placeholder_image,
			'ariaLabel'     => $aria_label,
		)
	);

	$html  = '<figure ' . $wrapper_attributes . 'data-wp-interactive="core/playlist">';
	$html .= '<div class="wp-block-playlist__current-item">';
	// Images, titles, etc are only displayed if the options are enabled.
	if ( $images ) {
		$html .= '<img data-wp-bind--src="state.currentImage" alt=" width="48px" height="64px">';
	}
	if ( isset( $current_title ) || isset( $current_album ) || isset( $current_artist ) ) {
		$html .= '<ul>';
		if ( isset( $current_title ) ) {
			$html .= '<li class="wp-block-playlist__item-title" data-wp-text="state.currentTitle"></li>';
		}
		if ( isset( $current_album ) ) {
			$html .= '<li class="wp-block-playlist__item-album" data-wp-text="state.currentAlbum"></li>';
		}
		if ( isset( $current_artist ) ) {
			$html .= '<li class="wp-block-playlist__item-artist" data-wp-text="state.currentArtist"></li>';
		}
		$html .= '</ul>';
	}
	$html .= '<audio controls="controls" data-wp-bind--src="state.currentURL" data-wp-bind--aria-label="state.ariaLabel" data-wp-watch="callbacks.init"></audio>';
	$html .= '</div>'; // End of current track information.

	if ( $tracklist ) {
		$html .= '<' . $tagname . ' class="wp-block-playlist__tracks">';
		foreach ( $attributes['ids'] as $key => $value ) {
			$id     = isset( $attributes['ids'][ $key ]['id'] ) ? $attributes['ids'][ $key ]['id'] : '';
			$url    = isset( $attributes['ids'][ $key ]['url'] ) ? $attributes['ids'][ $key ]['url'] : '';
			$title  = isset( $attributes['ids'][ $key ]['title'] ) ? $attributes['ids'][ $key ]['title'] : '';
			$artist = isset( $attributes['ids'][ $key ]['artist'] ) ? $attributes['ids'][ $key ]['artist'] : '';
			$album  = isset( $attributes['ids'][ $key ]['album'] ) ? $attributes['ids'][ $key ]['album'] : '';
			$image  = isset( $attributes['ids'][ $key ]['image']['src'] ) ? $attributes['ids'][ $key ]['image']['src'] : $placeholder_image;
			$length = isset( $attributes['ids'][ $key ]['length'] ) ? $attributes['ids'][ $key ]['length'] : '';

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
			if ( 0 === $key ) {
				$contexts .= 'aria-current="true"';
			}

			$html .= '<li class="wp-block-playlist__item">';
			$html .= '<button ' . $contexts . 'data-wp-on--click="actions.changeTrack">';

			/**
			 * Use quotation marks for song titles when they are combined with the artist name.
			 *
			 * @see https://core.trac.wordpress.org/changeset/55251
			*/
			if ( $artists && $artist && $title ) {
				$html .= '<span class="wp-block-playlist__item-title">"' . wp_kses_post( $title ) . '"</span>';
			} else {
				$html .= '<span class="wp-block-playlist__item-title">' . wp_kses_post( $title ) . '</span>';
			}

			if ( $artists && $artist ) {
				$html .= '<span class="wp-block-playlist__item-artist">— ' . wp_kses_post( $artist ) . '</span>';
			}

			if ( $length ) {
				$html .= '<span class="wp-block-playlist__item-length">' .
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
		}
		$html .= '</' . $tagname . '>';
	}

	if ( $caption ) {
		$html .= '<figcaption class="wp-element-caption">' . wp_kses_post( $caption ) . '</figcaption>';
	}

	$html .= '</figure>';

	return $html;
}

/**
 * Registers the `core/playlist` block on server.
 *
 * @since 6.7.0
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
