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

if ( ! function_exists( 'do_blocks' ) ) {
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
		global $post;

		$rendered_content      = '';
		$dynamic_block_pattern = get_dynamic_blocks_regex();

		/*
		 * Back up global post, to restore after render callback.
		 * Allows callbacks to run new WP_Query instances without breaking the global post.
		 */
		$global_post = $post;

		while ( preg_match( $dynamic_block_pattern, $content, $block_match, PREG_OFFSET_CAPTURE ) ) {
			$opening_tag     = $block_match[0][0];
			$offset          = $block_match[0][1];
			$block_name      = $block_match[1][0];
			$is_self_closing = isset( $block_match[4] );

			// Reset attributes JSON to prevent scope bleed from last iteration.
			$block_attributes_json = null;
			if ( isset( $block_match[3] ) ) {
				$block_attributes_json = $block_match[3][0];
			}

			// Since content is a working copy since the last match, append to
			// rendered content up to the matched offset...
			$rendered_content .= substr( $content, 0, $offset );

			// ...then update the working copy of content.
			$content = substr( $content, $offset + strlen( $opening_tag ) );

			// Make implicit core namespace explicit.
			$is_implicit_core_namespace = ( false === strpos( $block_name, '/' ) );
			$normalized_block_name      = $is_implicit_core_namespace ? 'core/' . $block_name : $block_name;

			// Find registered block type. We can assume it exists since we use the
			// `get_dynamic_block_names` function as a source for pattern matching.
			$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $normalized_block_name );

			// Attempt to parse attributes JSON, if available.
			$attributes = array();
			if ( ! empty( $block_attributes_json ) ) {
				$decoded_attributes = json_decode( $block_attributes_json, true );
				if ( ! is_null( $decoded_attributes ) ) {
					$attributes = $decoded_attributes;
				}
			}

			$inner_content = '';

			if ( ! $is_self_closing ) {
				$end_tag_pattern = '/<!--\s+\/wp:' . str_replace( '/', '\/', preg_quote( $block_name ) ) . '\s+-->/';
				if ( ! preg_match( $end_tag_pattern, $content, $block_match_end, PREG_OFFSET_CAPTURE ) ) {
					// If no closing tag is found, abort all matching, and continue
					// to append remainder of content to rendered output.
					break;
				}

				// Update content to omit text up to and including closing tag.
				$end_tag    = $block_match_end[0][0];
				$end_offset = $block_match_end[0][1];

				$inner_content = substr( $content, 0, $end_offset );
				$content       = substr( $content, $end_offset + strlen( $end_tag ) );
			}

			// Replace dynamic block with server-rendered output.
			$rendered_content .= $block_type->render( $attributes, $inner_content );

			// Restore global $post.
			$post = $global_post;
		}

		// Append remaining unmatched content.
		$rendered_content .= $content;

		// Strip remaining block comment demarcations.
		$rendered_content = preg_replace( '/<!--\s+\/?wp:.*?-->\r?\n?/m', '', $rendered_content );

		return $rendered_content;
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
