<?php
/**
 * KSES related functions for the Gutenberg plugin.
 *
 * @package gutenberg
 */

/**
 * Adds attributes to kses allowed tags that aren't in the default list
 * and that Gutenberg needs to save blocks such as the Gallery block.
 *
 * @param array $tags Allowed HTML.
 * @return array (Maybe) modified allowed HTML.
 */
function gutenberg_kses_allowedtags( $tags ) {
	if ( isset( $tags['a'] ) ) {
		$tags['a']['download'] = true;
	}

	if ( isset( $tags['img'] ) ) {
		$tags['img']['data-link'] = true;
		$tags['img']['data-id']   = true;
	}

	if ( isset( $tags['div'] ) ) {
		$tags['div']['style']       = true;
		$tags['div']['aria-hidden'] = true;
	}

	return $tags;
}

add_filter( 'wp_kses_allowed_html', 'gutenberg_kses_allowedtags', 10, 2 );
