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
	$parser = new Gutenberg_PEG_Parser;
	return $parser->parse( _gutenberg_utf8_split( $content ) );
}

/**
 * Parses dynamic blocks out of `post_content` and re-renders them.
 *
 * @since 0.1.0
 *
 * @param  string $content Post content.
 * @return string          Updated post content.
 */
function do_blocks( $content ) {
	$registry = WP_Block_Type_Registry::get_instance();

	$blocks = gutenberg_parse_blocks( $content );

	$content_after_blocks = '';

	foreach ( $blocks as $block ) {
		$block_name  = isset( $block['blockName'] ) ? $block['blockName'] : null;
		$attributes  = is_array( $block['attrs'] ) ? $block['attrs'] : array();
		$raw_content = isset( $block['innerHTML'] ) ? $block['innerHTML'] : null;

		if ( $block_name ) {
			$block_type = $registry->get_registered( $block_name );
			if ( null !== $block_type ) {
				$content_after_blocks .= $block_type->render( $attributes, $raw_content );
				continue;
			}
		}

		if ( $raw_content ) {
			$content_after_blocks .= $raw_content;
		}
	}

	return $content_after_blocks;
}
add_filter( 'the_content', 'do_blocks', 9 ); // BEFORE do_shortcode() and wpautop().

/**
 * Given a string, returns content normalized with automatic paragraphs applied
 * to text not identified as a block. Since this executes the block parser, it
 * should not be used in a performance-critical flow such as content display.
 * Block content will not have automatic paragraphs applied.
 *
 * @since 1.7.0
 *
 * @param  string $content Original content.
 * @return string          Content formatted with automatic paragraphs applied
 *                         to unknown blocks.
 */
function gutenberg_wpautop_block_content( $content ) {
	$blocks = gutenberg_parse_blocks( $content );

	$formatted_content = '';
	foreach ( $blocks as $i => $block ) {
		if ( isset( $block['blockName'] ) ) {
			$block_content = $block['outerHTML'];
		} else {
			$block_content = $block['innerHTML'];

			// wpautop will trim leading whitespace and return whitespace-only
			// text as empty string. Preserve to prefix leading whitespace.
			preg_match( '/^(\s+)/', $block_content, $prefix_match );
			$prefix = empty( $prefix_match ) ? '' : $prefix_match[0];

			$block_content = $prefix . wpautop( $block_content, false );

			// To normalize as text where wpautop would not be applied, restore
			// double newline to wpautop'd text if not at the end of content.
			$is_last_block = ( count( $blocks ) === $i + 1 );
			if ( ! $is_last_block ) {
				$block_content = str_replace( "</p>\n", "</p>\n\n", $block_content );
			}
		}

		$formatted_content .= $block_content;
	}

	return $formatted_content;
}

/**
 * Filters saved post data to apply wpautop to freeform block content.
 *
 * @since 1.7.0
 *
 * @param  array $data An array of slashed post data.
 * @return array       An array of post data with wpautop applied to freeform
 *                     block content.
 */
function gutenberg_wpautop_insert_post_data( $data ) {
	if ( ! empty( $data['post_content'] ) && gutenberg_content_has_blocks( $data['post_content'] ) ) {
		// WP_REST_Posts_Controller slashes post data before inserting/updating
		// a post. This data gets unslashed by `wp_insert_post` right before
		// saving to the DB. The PEG parser needs unslashed input in order to
		// properly parse JSON attributes.
		$content = wp_unslash( $data['post_content'] );
		$content = gutenberg_wpautop_block_content( $content );
		$content = wp_slash( $content );

		$data['post_content'] = $content;
	}

	return $data;
}
add_filter( 'wp_insert_post_data', 'gutenberg_wpautop_insert_post_data' );
