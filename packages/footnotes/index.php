<?php
/**
 * Adds footnotes to the content.
 *
 * @package gutenberg
 */

add_filter( 'the_content', 'wp_footnotes_content_filter' );

/**
 * Adds footnotes to the content.
 *
 * @param {string} $content The content to filter.
 */
function wp_footnotes_content_filter( $content ) {
	if ( strpos( $content, 'data-core-footnotes-id' ) === false ) {
		return $content;
	}

	if ( ! preg_match_all( '/<a\s[^>]*data-core-footnotes-id="([^"]+)"[^>]*>/', $content, $matches, PREG_SET_ORDER ) ) {
		return $content;
	}

	$list = '<ol>';

	foreach ( $matches as $match ) {
		list( $tag, $id ) = $match;

		$list .= '<li id="' . $id . '">';
		$list .= '<a id="' . $id . '" href="#' . $id . '-anchor" aria-label="' . __( 'Back to content', 'gutenberg' ) . '">↑</a>';

		if ( preg_match( '/data-text="([^"]*)"/i', $tag, $text ) ) {
			$list .= ' ' . $text[1];
		}

		$list .= '</li>';
	}

	$list .= '</ol>';

	$style = '<style>body{counter-reset:footnotes}.note-anchor{counter-increment:footnotes}.note-anchor::after{margin-left:2px;content:"["counter(footnotes)"]";vertical-align:super;font-size:smaller;}</style>';

	return $content . $list . $style;
}
