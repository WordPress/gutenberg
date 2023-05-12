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
	 * Order
	 * Aria
	 * screen reader texts.
	 */
	$order              = !! $attributes[ 'order' ] ? $attributes[ 'order' ] : 'ASC';
	$tracklist          = !! $attributes[ 'tracklist' ] ? $attributes[ 'tracklist' ] : true;
	$tracknumbers       = $attributes[ 'tracknumbers' ];
	$images             = $attributes[ 'images' ];
	$artists            = $attributes[ 'artists' ];
	$tagname            = !! $attributes[ 'tracknumbers' ] ? 'ol' : 'ul';
	$wrapper_attributes = get_block_wrapper_attributes();

	$html = '<figure ' . $wrapper_attributes . '>';

	if ( isset( $attributes[ 'ids' ] ) ) {
		$html .= '<div class="wp-block-playlist__current-item">';
		if ( $attributes[ 'images' ] ) {
			$image = $attributes[ 'ids' ][ 0 ][ 'image' ][ 'src' ];
			$html .= '<img src="' . $image . '" alt="">';
		}
		$html .= '<ul>
			<li class="wp-block-playlist__item-title">' . $attributes[ 'ids' ][ 0 ][ 'title' ] . '</li>
			<li class="wp-block-playlist__item-album">' . $attributes[ 'ids' ][ 0 ][ 'album' ] . '</li>
			<li class="wp-block-playlist__item-artist">' . $attributes[ 'ids' ][ 0 ][ 'artist' ] . '</li>
			</ul>';

		$html .= '<audio controls="controls"
				src="' . $attributes[ 'ids' ][ 0 ][ 'url' ] . '"
				aria-label="' . $attributes[ 'ids' ][ 0 ][ 'title' ] . ', ' .
				$attributes[ 'ids' ][ 0 ][ 'album' ] . ', ' .
				$attributes[ 'ids' ][ 0 ][ 'artist' ] . '"/>';

		$html .= '</div>';

		if ( $tracklist ) {
			$html .= '<' . $tagname  . ' class="wp-block-playlist__tracks">';
			foreach ( $attributes[ 'ids' ] as $key => $value ) {
				$html .= '<li class="wp-block-playlist__item">';
				$html .= '<button
				data-playlist-track-url="' . $attributes[ 'ids' ][ $key ][ 'url' ]  . '" .
				data-playlist-track-title="' . $attributes[ 'ids' ][ $key ][ 'title' ] . '" .
				data-playlist-track-artist="' . $attributes[ 'ids' ][ $key ][ 'artist' ]  . '" .
				data-playlist-track-album="' . $attributes[ 'ids' ][ $key ][ 'album' ] . '" .
				data-playlist-track-image-src="' . $attributes[ 'ids' ][ $key ][ 'image' ][ 'src' ]. '" .
				>';
				$html .= '<span class="wp-block-playlist__item-title">';
				if ( $artists ) {
					$html .= '"' . $attributes[ 'ids' ][ $key ][ 'title' ] . '"';
				} else {
					$html .= $attributes[ 'ids' ][ $key ][ 'title' ];
				}
				$html .= '</span>';
				$html .= '<span class="wp-block-playlist__item-artist">— ' . $attributes[ 'ids' ][ $key ][ 'artist' ] . '</span>';
				$html .= '<span class="wp-block-playlist__item-length">' . $attributes[ 'ids' ][ $key ][ 'length' ] . '</span>';
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
