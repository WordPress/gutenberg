<?php
/**
 * Server-side rendering of the `core/playlist` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/playlist` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the Playlist.
 */
function render_block_core_playlist( $attributes ) {
	/**
	 * WIP
	 * Escaping
	 * Can we clean this up? And maybe create a separate function for the current track?
	 * Also, fix the display of the image, which is missing some spacing on the front (CSS)
	 */
	$tracklist          = isset( $attributes['tracklist'] ) ? $attributes['tracklist'] : true;
	$tracknumbers       = $attributes['tracknumbers'];
	$images             = $attributes['images'];
	$artists            = isset( $attributes['artists'] ) ? $attributes['artists'] : true;
	$tagname            = $attributes['tracknumbers'] ? 'ol' : 'ul';
	$wrapper_attributes = get_block_wrapper_attributes();

	$html = '<figure ' . $wrapper_attributes . '>';

	if ( isset( $attributes['ids'] ) ) {
		// Display information about the current track.
		$html .= '<div class="wp-block-playlist__current-item">';

		$current_id     = $attributes['ids'][0]['id'];
		$current_title  = isset( $attributes['ids'][0]['title'] ) ? $attributes['ids'][0]['title'] : '';
		$current_album  = isset( $attributes['ids'][0]['album'] ) ? $attributes['ids'][0]['album'] : '';
		$current_artist = isset( $attributes['ids'][0]['artist']) ? $attributes['ids'][0]['artist'] : '';
		$aria_label     = $current_title;

		if ( $current_title && $current_artist && $current_album ) {
			$aria_label = sprintf(
				_x( '%1$s by %2$s from the album %3$s','track title, artist name, album name' ),
				$current_title,
				$current_artist,
				$current_album
			);
		}

		// Add the decorative image, if it exists and the option is enabled.
		if ( $images && isset( $attributes['ids'][0]['image']['src'] ) ) {
			$html .= '<img src="' . esc_url( $attributes['ids'][0]['image']['src'] ) . '" alt="">';
		}

		$html .= '<ul>';
		if ( isset( $current_title ) ) {
			$html .= '<li class="wp-block-playlist__item-title">' . $current_title . '</li>';
		}
		if ( isset( $current_album ) ) {
			$html .= '<li class="wp-block-playlist__item-album">' . $current_album . '</li>';
		}
		if ( isset( $current_artist) ) {
			$html .= '<li class="wp-block-playlist__item-artist">' . $current_artist . '</li>';
		}
		$html .= '<ul>';

		$html .= '<audio controls="controls"
				src="' . esc_url( $attributes['ids'][0]['url'] ) . '"
				aria-label="' . esc_attr( $aria_label ) . '"/>';

		$html .= '</div>';  // End of current track information.

		if ( $tracklist ) {
			$html .= '<' . $tagname . ' class="wp-block-playlist__tracks">';
			foreach ( $attributes['ids'] as $key => $value ) {

				$url    = isset( $attributes['ids'][ $key ]['url']) ? $attributes['ids'][ $key ]['url'] : '';
				$title  = isset( $attributes['ids'][ $key ]['title']) ? $attributes['ids'][ $key ]['title'] : '';
				$artist = isset( $attributes['ids'][ $key ]['artist']) ? $attributes['ids'][ $key ]['artist'] : '';
				$album  = isset( $attributes['ids'][ $key ]['album']) ? $attributes['ids'][ $key ]['album'] : '';
				$image  = isset( $attributes['ids'][ $key ]['image']['src']) ? $attributes['ids'][ $key ]['image']['src'] : '';
				$length = isset( $attributes['ids'][ $key ]['length']) ? $attributes['ids'][ $key ]['length'] : '';

				$html .= '<li class="wp-block-playlist__item">';
				$html .= '<button';
				if ( isset( $attributes['ids'][ $key ]['id'] ) && $attributes['ids'][ $key ]['id'] === $current_id ) {
					$html .= ' aria-current="true"';
				}
				$html .=' data-playlist-track-url="' . $url . '" .
				data-playlist-track-title="' . $title . '" .
				data-playlist-track-artist="' . $artist . '" .
				data-playlist-track-album="' . $album . '" .
				data-playlist-track-image-src="' . $image . '" .
				>';

				/**
				 * Only use quotation marks for titles when they are
				 * combined with the artist name,
				 * @see https://core.trac.wordpress.org/changeset/55251
				 */
				if ( $artists && $artist && $title ) {
					$html .= '<span class="wp-block-playlist__item-title">"' . $title . '"</span>';
				} else {
					$html .= '<span class="wp-block-playlist__item-title">' . $title . '</span>';
				}
				if ( $artists && $artist ) {
					$html .= '<span class="wp-block-playlist__item-artist">— ' . $artist . '</span>';
				}
				if ( $length ) {
					$html .= '<span class="wp-block-playlist__item-length">' .
					sprintf(
						/* translators: %s: track length in minutes:seconds */
						'<span class="screen-reader-text">' . __( 'Length:' ) . ' </span>%s',
						$length
					);
					$html .= '</span>';
				}
				$html .= '<span class="screen-reader-text">' . __( 'Select to play this track' ) . '</span>';
				$html .= '</button>';
				$html .= '</li>';
			}
			$html .= '</' . $tagname . '>';
		}
	}

	return $html;
}

/**
 * Registers the `core/playlist` block on server.
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
