<?php
/**
 * Functions related to editor blocks for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

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

/**
 * Parses blocks out of a content string.
 *
 * @since 0.5.0
 *
 * @param  string $content Post content.
 * @return array  Array of parsed block objects.
 */
function gutenberg_parse_blocks( $content ) {
	/*
	 * If there are no blocks in the content, return a single block, rather
	 * than wasting time trying to parse the string.
	 */
	if ( ! has_blocks( $content ) ) {
		return array(
			array(
				'blockName'   => null,
				'attrs'       => array(),
				'innerBlocks' => array(),
				'innerHTML'   => $content,
			),
		);
	}

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

/**
 * Retrieve the dynamic blocks regular expression for searching.
 *
 * @since 3.6.0
 *
 * @return string
 */
function get_dynamic_blocks_regex() {
	_deprecated_function( __FUNCTION__, '4.1.0', __( "Dynamic blocks shouldn't be extracted by regex. Use parse_blocks() instead.", 'gutenberg' ) );
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

/**
 * Renders a single block into a HTML string.
 *
 * @since 1.9.0
 *
 * @param  array $block A single parsed block object.
 * @return string String of rendered HTML.
 */
function gutenberg_render_block( $block ) {
	$block_name  = isset( $block['blockName'] ) ? $block['blockName'] : null;
	$attributes  = is_array( $block['attrs'] ) ? $block['attrs'] : array();
	$raw_content = isset( $block['innerHTML'] ) ? $block['innerHTML'] : null;

	if ( $block_name ) {
		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
		if ( null !== $block_type && $block_type->is_dynamic() ) {
			return $block_type->render( $attributes );
		}
	}

	if ( $raw_content ) {
		return $raw_content;
	}

	return '';
}

/**
 * Parses dynamic blocks out of `post_content` and re-renders them.
 *
 * @since 0.1.0
 * @global WP_Post $post The post to edit.
 *
 * @param  string $content Post content.
 * @return string          Updated post content.
 */
function do_blocks( $content ) {
	$blocks = gutenberg_parse_blocks( $content );
	return _recurse_blocks( $blocks, $blocks );
}
add_filter( 'the_content', 'do_blocks', 9 ); // BEFORE do_shortcode().

/**
 * Helper function for do_blocks(), to recurse through the block tree.
 *
 * @since 4.1.0
 * @access private
 *
 * @param array $blocks Array of blocks from parse_blocks()
 * @return string
 */
function _recurse_blocks( $blocks, $all_blocks ) {
	global $post;

	/*
	 * Back up global post, to restore after render callback.
	 * Allows callbacks to run new WP_Query instances without breaking the global post.
	 */
	$global_post = $post;

	$rendered_content = '';
	$dynamic_blocks   = get_dynamic_block_names();

	foreach ( $blocks as $block ) {
		$block = (array) $block;
		if ( in_array( $block['blockName'], $dynamic_blocks ) ) {
			// Find registered block type. We can assume it exists since we use the
			// `get_dynamic_block_names` function as a source for pattern matching.
			$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );

			// Replace dynamic block with server-rendered output.
			$block_content = $block_type->render( (array) $block['attrs'], $block['innerHTML'] );
		} elseif ( $block['innerBlocks'] ) {
			$block_content = _recurse_blocks( $block['innerBlocks'], $all_blocks );
		} else {
			$block_content = $block['innerHTML'];
		}

		/**
		 * Filters the content of a single block.
		 *
		 * During the_content, each block is parsed and added to the output individually. This filter allows
		 * that content to be altered immediately before it's appended.
		 *
		 * @since 5.0.0
		 *
		 * @param string $block_content The block content about to be appended.
		 * @param array  $block         The full block, including name and attributes.
		 * @param array  $all_blocks    The array of all blocks being processed.
		 */
		$rendered_content .= apply_filters( 'do_block', $block_content, $block, $all_blocks );

		// Restore global $post.
		$post = $global_post;
	}

	// Strip remaining block comment demarcations.
	$rendered_content = preg_replace( '/<!--\s+\/?wp:.*?-->/m', '', $rendered_content );

	return $rendered_content;
}

/**
 * Remove all dynamic blocks from the given content.
 *
 * @since 4.1.0
 *
 * @param string $content Content of the current post.
 * @return string
 */
function strip_dynamic_blocks( $content ) {
	return _recurse_strip_dynamic_blocks( parse_blocks( $content ) );
}

/**
 * Helper function for strip_dynamic_blocks(), to recurse through the block tree.
 *
 * @since 4.1.0
 * @access private
 *
 * @param array $blocks Array of blocks from parse_blocks()
 * @return string
 */
function _recurse_strip_dynamic_blocks( $blocks ) {
	$clean_content  = '';
	$dynamic_blocks = get_dynamic_block_names();

	foreach ( $blocks as $block ) {
		if ( ! in_array( $block['blockName'], $dynamic_blocks ) ) {
			if ( $block['innerBlocks'] ) {
				$clean_content .= _recurse_strip_dynamic_blocks( $block['innerBlocks'] );
			} else {
				$clean_content .= $block['innerHTML'];
			}
		}
	}

	return $clean_content;
}

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
	add_filter( 'the_content', 'strip_dynamic_blocks', 8 ); // Before do_blocks().

	return $text;
}
add_filter( 'get_the_excerpt', 'strip_dynamic_blocks_add_filter', 9 ); // Before wp_trim_excerpt().

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
	remove_filter( 'the_content', 'strip_dynamic_blocks', 8 );

	return $text;
}
add_filter( 'wp_trim_excerpt', 'strip_dynamic_blocks_remove_filter', 0 ); // Before all other.
