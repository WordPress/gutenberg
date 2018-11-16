<?php
/**
 * Functions related to editor blocks for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

if ( ! function_exists( 'register_block_type' ) ) {
	/**
	 * Registers a block type.
	 *
	 * @since 0.1.0
	 * @since 0.6.0 Now also accepts a WP_Block_Type instance as first parameter.
	 *
	 * @param string|WP_Block_Type $name Block type name including namespace, or alternatively a
	 *                                   complete WP_Block_Type instance. In case a WP_Block_Type
	 *                                   is provided, the $args parameter will be ignored.
	 * @param array                $args {
	 *     Optional. Array of block type arguments. Any arguments may be defined, however the
	 *     ones described below are supported by default. Default empty array.
	 *
	 *     @type callable $render_callback Callback used to render blocks of this block type.
	 * }
	 * @return WP_Block_Type|false The registered block type on success, or false on failure.
	 */
	function register_block_type( $name, $args = array() ) {
		return WP_Block_Type_Registry::get_instance()->register( $name, $args );
	}
}

if ( ! function_exists( 'unregister_block_type' ) ) {
	/**
	 * Unregisters a block type.
	 *
	 * @since 0.1.0
	 * @since 0.6.0 Now also accepts a WP_Block_Type instance as first parameter.
	 *
	 * @param string|WP_Block_Type $name Block type name including namespace, or alternatively a
	 *                                   complete WP_Block_Type instance.
	 * @return WP_Block_Type|false The unregistered block type on success, or false on failure.
	 */
	function unregister_block_type( $name ) {
		return WP_Block_Type_Registry::get_instance()->unregister( $name );
	}
}

if ( ! function_exists( 'gutenberg_parse_blocks' ) ) {
	/**
	 * Parses blocks out of a content string.
	 *
	 * @since 0.5.0
	 *
	 * @param  string $content Post content.
	 * @return array  Array of parsed block objects.
	 */
	function gutenberg_parse_blocks( $content ) {
		/**
		 * Filter to allow plugins to replace the server-side block parser
		 *
		 * @since 3.8.0
		 *
		 * @param string $parser_class Name of block parser class
		 */
		$parser_class = apply_filters( 'block_parser_class', 'WP_Block_Parser' );
		// Load default block parser for server-side parsing if the default parser class is being used.
		if ( 'WP_Block_Parser' === $parser_class ) {
			require_once dirname( __FILE__ ) . '/../packages/block-serialization-default-parser/parser.php';
		}
		$parser = new $parser_class();
		return $parser->parse( $content );
	}
}

if ( ! function_exists( 'get_dynamic_block_names' ) ) {
	/**
	 * Returns an array of the names of all registered dynamic block types.
	 *
	 * @return array Array of dynamic block names.
	 */
	function get_dynamic_block_names() {
		$dynamic_block_names = array();

		$block_types = WP_Block_Type_Registry::get_instance()->get_all_registered();
		foreach ( $block_types as $block_type ) {
			if ( $block_type->is_dynamic() ) {
				$dynamic_block_names[] = $block_type->name;
			}
		}

		return $dynamic_block_names;
	}
}

if ( ! function_exists( 'get_dynamic_blocks_regex' ) ) {
	/**
	 * Retrieve the dynamic blocks regular expression for searching.
	 *
	 * @since 3.6.0
	 *
	 * @return string
	 */
	function get_dynamic_blocks_regex() {
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
 *
 * @param  array $block A single parsed block object.
 * @return string String of rendered HTML.
 */
function gutenberg_render_block( $block ) {
	global $post;

	$block_type    = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	$is_dynamic    = $block['blockName'] && null !== $block_type && $block_type->is_dynamic();
	$inner_content = '';
	$index         = 0;

	foreach ( $block['innerContent'] as $chunk ) {
		$inner_content .= is_string( $chunk ) ? $chunk : gutenberg_render_block( $block['innerBlocks'][ $index++ ] );
	}

	if ( $is_dynamic ) {
		$attributes  = is_array( $block['attrs'] ) ? (array) $block['attrs'] : array();
		$global_post = $post;
		$output      = $block_type->render( $attributes, $inner_content );
		$post        = $global_post;

		return $output;
	}

	return $inner_content;
}

if ( ! function_exists( 'do_blocks' ) ) {
	/**
	 * Parses dynamic blocks out of `post_content` and re-renders them.
	 *
	 * @since 0.1.0
	 * @since 4.4.0 performs full parse on input post content
	 *
	 * @param  string $content Post content.
	 * @return string          Updated post content.
	 */
	function do_blocks( $content ) {
		$blocks = gutenberg_parse_blocks( $content );
		$output = '';

		foreach ( $blocks as $block ) {
			$output .= gutenberg_render_block( $block );
		}

		return $output;
	}

	add_filter( 'the_content', 'do_blocks', 7 ); // BEFORE do_shortcode() and oembed.
}

if ( ! function_exists( 'strip_dynamic_blocks' ) ) {
	/**
	 * Remove all dynamic blocks from the given content.
	 *
	 * @since 3.6.0
	 *
	 * @param string $content Content of the current post.
	 * @return string
	 */
	function strip_dynamic_blocks( $content ) {
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
	 *
	 * @param string $text Excerpt.
	 * @return string
	 */
	function strip_dynamic_blocks_add_filter( $text ) {
		add_filter( 'the_content', 'strip_dynamic_blocks', 6 );

		return $text;
	}
	add_filter( 'get_the_excerpt', 'strip_dynamic_blocks_add_filter', 9 ); // Before wp_trim_excerpt().
}

if ( ! function_exists( 'strip_dynamic_blocks_remove_filter' ) ) {
	/**
	 * Removes the content filter to strip dynamic blocks from excerpts.
	 *
	 * It's a bit hacky for now, but once this gets merged into core the function
	 * can just be called in `wp_trim_excerpt()`.
	 *
	 * @since 3.6.0
	 *
	 * @param string $text Excerpt.
	 * @return string
	 */
	function strip_dynamic_blocks_remove_filter( $text ) {
		remove_filter( 'the_content', 'strip_dynamic_blocks', 6 );

		return $text;
	}
	add_filter( 'wp_trim_excerpt', 'strip_dynamic_blocks_remove_filter', 0 ); // Before all other.
}
