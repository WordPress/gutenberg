<?php
/**
 * Functions related to editor blocks for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

if ( ! function_exists( 'gutenberg_parse_blocks' ) ) {
	/**
	 * Parses blocks out of a content string.
	 *
	 * @since 0.5.0
	 * @deprecated 5.0.0 parse_blocks()
	 *
	 * @param  string $content Post content.
	 * @return array  Array of parsed block objects.
	 */
	function gutenberg_parse_blocks( $content ) {
		_deprecated_function( __FUNCTION__, '5.0.0', 'parse_blocks()' );

		return parse_blocks( $content );
	}
}

if ( ! function_exists( 'get_dynamic_blocks_regex' ) ) {
	/**
	 * Retrieve the dynamic blocks regular expression for searching.
	 *
	 * @since 3.6.0
	 * @deprecated 5.0.0
	 *
	 * @return string
	 */
	function get_dynamic_blocks_regex() {
		_deprecated_function( __FUNCTION__, '5.0.0' );

		$dynamic_block_names   = get_dynamic_block_names();
		$dynamic_block_pattern = (
			'/<!--\s+wp:(' .
			str_replace(
				'/',
				'\/',                 // Escape namespace, not handled by preg_quote.
				str_replace(
					'core/',
					'(?:core/)?', // Allow implicit core namespace, but don't capture.
					implode(
						'|',                   // Join block names into capture group alternation.
						array_map(
							'preg_quote',    // Escape block name for regular expression.
							$dynamic_block_names
						)
					)
				)
			) .
			')(\s+(\{.*?\}))?\s+(\/)?-->/'
		);

		return $dynamic_block_pattern;
	}
}

/**
 * Renders a single block into a HTML string.
 *
 * @since 1.9.0
 * @since 4.4.0 renders full nested tree of blocks before reassembling into HTML string
 * @global WP_Post $post The post to edit.
 * @deprecated 5.0.0 render_block()
 *
 * @param  array $block A single parsed block object.
 * @return string String of rendered HTML.
 */
function gutenberg_render_block( $block ) {
	_deprecated_function( __FUNCTION__, '5.0.0', 'render_block()' );

	return render_block( $block );
}

if ( ! function_exists( 'strip_dynamic_blocks' ) ) {
	/**
	 * Remove all dynamic blocks from the given content.
	 *
	 * @since 3.6.0
	 * @deprecated 5.0.0
	 *
	 * @param string $content Content of the current post.
	 * @return string
	 */
	function strip_dynamic_blocks( $content ) {
		_deprecated_function( __FUNCTION__, '5.0.0' );

		return preg_replace( get_dynamic_blocks_regex(), '', $content );
	}
}

if ( ! function_exists( 'strip_dynamic_blocks_add_filter' ) ) {
	/**
	 * Adds the content filter to strip dynamic blocks from excerpts.
	 *
	 * It's a bit hacky for now, but once this gets merged into core the function
	 * can just be called in `wp_trim_excerpt()`.
	 *
	 * @since 3.6.0
	 * @deprecated 5.0.0
	 *
	 * @param string $text Excerpt.
	 * @return string
	 */
	function strip_dynamic_blocks_add_filter( $text ) {
		_deprecated_function( __FUNCTION__, '5.0.0' );

		add_filter( 'the_content', 'strip_dynamic_blocks', 6 );

		return $text;
	}
}

if ( ! function_exists( 'strip_dynamic_blocks_remove_filter' ) ) {
	/**
	 * Removes the content filter to strip dynamic blocks from excerpts.
	 *
	 * It's a bit hacky for now, but once this gets merged into core the function
	 * can just be called in `wp_trim_excerpt()`.
	 *
	 * @since 3.6.0
	 * @deprecated 5.0.0
	 *
	 * @param string $text Excerpt.
	 * @return string
	 */
	function strip_dynamic_blocks_remove_filter( $text ) {
		_deprecated_function( __FUNCTION__, '5.0.0' );

		remove_filter( 'the_content', 'strip_dynamic_blocks', 6 );

		return $text;
	}
}
