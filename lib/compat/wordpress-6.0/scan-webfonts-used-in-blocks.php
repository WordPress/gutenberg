<?php
/**
 * Webfonts API: scan and enqueue webfonts used in blocks.
 *
 * @package Gutenberg
 */

if ( ! function_exists( 'gutenberg_enqueue_webfonts_used_in_block' ) ) {
	/**
	 * Looks for font families in the attributes and enqueue them.
	 *
	 * @param string $content The block content.
	 * @param array  $parsed_block The parsed block attributes.
	 *
	 * @return array
	 */
	function gutenberg_enqueue_webfonts_used_in_block( $content, $parsed_block ) {
		if ( isset( $parsed_block['attrs']['fontFamily'] ) ) {
			wp_webfonts()->enqueue_webfont( $parsed_block['attrs']['fontFamily'] );
		}

		return $content;
	}

	/**
	 * We are already enqueueing all registered fonts by default when loading the block editor,
	 * so we only need to scan for webfonts when browsing as a guest.
	 */
	if ( ! is_admin() ) {
		add_filter( 'pre_render_block', 'gutenberg_enqueue_webfonts_used_in_block', 10, 2 );
	}
}
