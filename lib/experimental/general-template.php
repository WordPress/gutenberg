<?php
/**
 * General template functions.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_disable_comments_feed_for_block_themes' ) ) :
	/**
	 * Disable comments feed link for block themes.
	 *
	 * @param bool $show Whether to display the comments feed link.
	 * @return bool
	 */
	function wp_disable_comments_feed_for_block_themes( $show ) {
		return wp_is_block_theme() ? false : $show;
	}
	add_filter( 'feed_links_show_comments_feed', 'wp_disable_comments_feed_for_block_themes' );
endif;
