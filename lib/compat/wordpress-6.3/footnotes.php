<?php
/**
 * Compatiblity filters for improved footnotes support.
 *
 * In core, this could be fixed directly in key functions.
 *
 * @package gutenberg
 */

/**
 * Trims footnote anchors from content.
 *
 * @param string $content HTML content.
 * @return string Filtered content.
 */
function gutenberg_trim_footnotes( $content ) {
	if ( ! doing_filter( 'get_the_excerpt' ) ) {
		return $content;
	}

	if ( ! str_contains( $content, 'data-fn=' ) ) {
		return $content;
	}

	return preg_replace(
		'_<sup data-fn="[^"]+" class="[^"]+">\s*<a href="[^"]+" id="[^"]+">\d+</a>\s*</sup>_',
		'',
		$content
	);
}

add_filter( 'the_content', 'gutenberg_trim_footnotes' );
