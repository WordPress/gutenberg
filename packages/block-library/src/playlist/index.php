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

	$tracklist          = isset( $attributes['tracklist'] ) ? $attributes['tracklist'] : true;
	$tracknumbers       = isset( $attributes['tracknumbers'] ) ? $attributes['tracknumbers'] : true;
	$images             = isset( $attributes['images'] ) ? $attributes['images'] : true;
	$artists            = isset( $attributes['artists'] ) ? $attributes['artists'] : true;
	$tagname            = $tracknumbers ? 'ol' : 'ul';
	$current_id         = $attributes['ids'][0]['id']; // The current track is the first one in the list.
	$current_title      = isset( $attributes['ids'][0]['title'] ) ? $attributes['ids'][0]['title'] : '';
	$current_album      = isset( $attributes['ids'][0]['album'] ) ? $attributes['ids'][0]['album'] : '';
	$current_artist     = isset( $attributes['ids'][0]['artist'] ) ? $attributes['ids'][0]['artist'] : '';
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

	$html  = '<figure ' . $wrapper_attributes . '>';
	$html .= '<div class="wp-block-playlist__current-item">';
	if ( $images ) {
		$html .= '<img src="' . esc_url( isset( $attributes['ids'][0]['image']['src'] ) ? $attributes['ids'][0]['image']['src'] : $placeholder_image ) . '" alt="">';
	}

	// Note: The Media library allows some HTML in these fields.
	if ( isset( $current_title ) || isset( $current_album ) || isset( $current_artist ) ) {
		$html .= '<ul>';
		if ( isset( $current_title ) ) {
			$html .= '<li class="wp-block-playlist__item-title">' . wp_kses_post( $current_title ) . '</li>';
		}
		if ( isset( $current_album ) ) {
			$html .= '<li class="wp-block-playlist__item-album">' . wp_kses_post( $current_album ) . '</li>';
		}
		if ( isset( $current_artist ) ) {
			$html .= '<li class="wp-block-playlist__item-artist">' . wp_kses_post( $current_artist ) . '</li>';
		}
		$html .= '</ul>';
	}
	$html .= '<audio controls="controls" src="' . esc_url( $attributes['ids'][0]['url'] ) . '" aria-label="' . esc_attr( $aria_label ) . '"></audio>';
	$html .= '</div>'; // End of current track information.
	if ( $tracklist ) {
		$html .= '<' . $tagname . ' class="wp-block-playlist__tracks">';
		foreach ( $attributes['ids'] as $key => $value ) {
			$url    = isset( $attributes['ids'][ $key ]['url'] ) ? $attributes['ids'][ $key ]['url'] : '';
			$title  = isset( $attributes['ids'][ $key ]['title'] ) ? $attributes['ids'][ $key ]['title'] : '';
			$artist = isset( $attributes['ids'][ $key ]['artist'] ) ? $attributes['ids'][ $key ]['artist'] : '';
			$album  = isset( $attributes['ids'][ $key ]['album'] ) ? $attributes['ids'][ $key ]['album'] : '';
			$image  = isset( $attributes['ids'][ $key ]['image']['src'] ) ? $attributes['ids'][ $key ]['image']['src'] : $placeholder_image;
			$length = isset( $attributes['ids'][ $key ]['length'] ) ? $attributes['ids'][ $key ]['length'] : '';

			$html .= '<li class="wp-block-playlist__item">';
			$html .= '<button';
			if ( isset( $attributes['ids'][ $key ]['id'] ) && $attributes['ids'][ $key ]['id'] === $current_id ) {
				$html .= ' aria-current="true"';
			}
			$html .= ' data-playlist-track-url="' . esc_url( $url ) . '" .
			data-playlist-track-title="' . esc_attr( $title ) . '" .
			data-playlist-track-artist="' . esc_attr( $artist ) . '" .
			data-playlist-track-album="' . esc_attr( $album ) . '" .
			data-playlist-track-image-src="' . esc_url( $image ) . '" .
			>';

			/**
			 * Use quotation marks for song titles when they are combined with the artist name,
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
