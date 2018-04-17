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
	if ( ! gutenberg_content_has_blocks( $content ) ) {
		return array(
			array(
				'attrs'     => array(),
				'innerHTML' => $content,
			),
		);
	}

	$parser = new Gutenberg_PEG_Parser;
	return $parser->parse( _gutenberg_utf8_split( $content ) );
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
 * Prefixes the core namespace ('core/') to the block type name if the namespace isn't found in the block type name
 *
 * @since 2.7.0
 *
 * @param  string $block_type Name of the block type.
 * @return string             Name of the block type, prefixed by the core namespace if needed.
 */
function gutenberg_normalize_block_type( $block_type ) {
	$block_type = trim( $block_type );

	$index_of_slash = strpos( $block_type, '/' );

	// If namespace isn't found in the block type name, prefix it with 'core/'.
	if ( false === $index_of_slash ) {
		return 'core/' . $block_type;
	}

	return $block_type;
}

/**
 * Parses dynamic blocks out of `post_content` and re-renders them.
 *
 * @since 0.1.0
 *
 * @param  string $content Post content.
 * @return string          Updated post content.
 */
function gutenberg_render_dynamic_blocks( $content ) {

	$rendered_content = '';

	$dynamic_block_names   = get_dynamic_block_names();
	$dynamic_block_pattern = (
		'/<!--\s+wp:(' .
		str_replace( '/', '\/',                 // Escape namespace, not handled by preg_quote.
			str_replace( 'core/', '(?:core/)?', // Allow implicit core namespace, but don't capture.
				implode( '|',                   // Join block names into capture group alternation.
					array_map( 'preg_quote',    // Escape block name for regular expression.
						$dynamic_block_names
					)
				)
			)
		) .
		')(\s+(\{.*?\}))?\s+(\/)?-->/'
	);

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
		// rendered content up to the matched offset (including the opening tag)...
		$rendered_content .= substr( $content, 0, $offset + strlen( $opening_tag ) );

		// ...then update the working copy of content.
		$content = substr( $content, $offset + strlen( $opening_tag ) );

		// Make implicit core namespace explicit.
		$normalized_block_name = gutenberg_normalize_block_type( $block_name );

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

		// Replace dynamic block with server-rendered output.
		$rendered_content .= $block_type->render( $attributes );

		if ( ! $is_self_closing ) {
			$end_tag_pattern = '/<!--\s+\/wp:' . str_replace( '/', '\/', preg_quote( $block_name ) ) . '\s+-->/';
			if ( ! preg_match( $end_tag_pattern, $content, $block_match_end, PREG_OFFSET_CAPTURE ) ) {
				// If no closing tag is found, abort all matching, and continue
				// to append remainder of content to rendered output.
				break;
			}

			// Update content to omit text up to the closing tag.
			$end_tag    = $block_match_end[0][0];
			$end_offset = $block_match_end[0][1];

			$content = substr( $content, $end_offset );
		}
	}

	// Append remaining unmatched content.
	$rendered_content .= $content;

	return $rendered_content;
}

/**
 * For a single post / page, this function parses `block types` while stripping
 * `block comments` from the post's HTML and calls WP_Parsed_Block_Types_Registry
 * to save those parsed block types. It registers gutenberg_process_block_comment()
 * as a callback function for preg_replace_callback(). For each block comment
 * (matched by the Regex) in the post's HTML, gutenberg_process_block_comment()
 * will get called.
 *
 * For pages containing multiple posts like category / archive / home page, this only strips
 * block comments (doesn't save the parsed block types in WP_Parsed_Block_Types_Registry).
 * We don't need to save `parsed block types` for such pages since intelligent enqueuing of
 * front-end styles (only enqueue styles for `block types` present in the post/page)
 * only needs to happen for single posts / pages as of now.
 *
 * @since 2.7.0
 *
 * @param  string $content Post content.
 * @return string          Updated post content (without block comments)
 */
function gutenberg_process_block_comments( $content ) {

	// Checks if a single page/post is requested.
	$is_post_or_page = is_singular( array( 'post', 'page' ) );

	/*
	 * If a single page/post is requested, we need to parse and save `parsed block types` while stripping block comments.
	 * Otherwise, for category / archive / home page etc, we can simply strip block comments and return the HTML.
	 */

	if ( $is_post_or_page ) {
		$content = preg_replace_callback( '/<!--\s+\/?wp:.*?-->\r?\n?/m', 'gutenberg_process_block_comment', $content );
	} else {
		$content = preg_replace( '/<!--\s+\/?wp:.*?-->\r?\n?/m', '', $content );
	}

	return $content;
}

/**
 * Registered as a callback function to preg_replace_callback() and is called once for each
 * block comment parsed from the post's HTML. It returns an empty string for each instantiation
 * so that the post's HTML gets stripped of block comments.
 *
 * Also, it uses WP_Parsed_Block_Types_Registry to store block types parsed from the block comments.
 * Those can be later used if needed.
 *
 * @since 2.7.0
 *
 * @param  string $matches An array filled with the results of search.
 *                         $matches[0] will contain the text that matched the full pattern,
 *                         $matches[1] will have the text that matched the first captured parenthesized subpattern,
 *                         and so on.
 * @return string          Returns an empty string to preg_replace_callback() for each of the block comments
 */
function gutenberg_process_block_comment( $matches ) {
	$block_comment = $matches[0];

	// Only process the block comment if it's not a closing tag for a block. If it's a closing tag, we can just return.
	if ( preg_match( '/\/wp:/m', $block_comment ) !== 1 ) {

		preg_match( '/wp:(.*?)\s+/m', $block_comment, $match );

		$block_type_name = $match[1];
		$block_type_name = gutenberg_normalize_block_type( $block_type_name );

		WP_Parsed_Block_Types_Registry::get_instance()->add( $block_type_name );
	}

	return '';
}

add_filter( 'the_content', 'gutenberg_render_dynamic_blocks', 9 ); // BEFORE do_shortcode().
