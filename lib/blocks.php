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
 * Given an array of parsed blocks, returns content string.
 *
 * @since 1.7.0
 *
 * @param array $blocks Parsed blocks.
 *
 * @return string Content string.
 */
function gutenberg_serialize_blocks( $blocks ) {
	return implode( '', array_map( 'gutenberg_serialize_block', $blocks ) );
}

/**
 * Given a parsed block, returns content string.
 *
 * @since 1.7.0
 *
 * @param array $block Parsed block.
 *
 * @return string Content string.
 */
function gutenberg_serialize_block( $block ) {
	// Return content of unknown block verbatim.
	if ( ! isset( $block['blockName'] ) ) {
		return $block['innerHTML'];
	}

	// Custom formatting for specific block types.
	if ( 'core/more' === $block['blockName'] ) {
		$content = '<!--more';
		if ( ! empty( $block['attrs']['customText'] ) ) {
			$content .= ' ' . $block['attrs']['customText'];
		}

		$content .= '-->';
		if ( ! empty( $block['attrs']['noTeaser'] ) ) {
			$content .= "\n" . '<!--noteaser-->';
		}

		return $content;
	}

	// For standard blocks, return with comment-delimited wrapper.
	$content = '<!-- wp:' . $block['blockName'] . ' ';

	if ( ! empty( $block['attrs'] ) ) {
		$attrs_json = json_encode( $block['attrs'] );

		// In PHP 5.4+, we would pass the `JSON_UNESCAPED_SLASHES` option to
		// `json_encode`. To support older versions, we must apply manually.
		$attrs_json = str_replace( '\\/', '/', $attrs_json );

		// Don't break HTML comments.
		$attrs_json = str_replace( '--', '\\u002d\\u002d', $attrs_json );

		// Don't break standard-non-compliant tools.
		$attrs_json = str_replace( '<', '\\u003c', $attrs_json );
		$attrs_json = str_replace( '>', '\\u003e', $attrs_json );
		$attrs_json = str_replace( '&', '\\u0026', $attrs_json );

		$content .= $attrs_json . ' ';
	}

	if ( empty( $block['innerHTML'] ) ) {
		return $content . '/-->';
	}

	$content .= '-->';
	$content .= $block['innerHTML'];
	$content .= '<!-- /wp:' . $block['blockName'] . ' -->';
	return $content;
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
		if ( null !== $block_type ) {
			return $block_type->render( $attributes, $raw_content );
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
 *
 * @param  string $content Post content.
 * @return string          Updated post content.
 */
function do_blocks( $content ) {
	$blocks = gutenberg_parse_blocks( $content );

	$content_after_blocks = '';
	foreach ( $blocks as $block ) {
		$content_after_blocks .= gutenberg_render_block( $block );
	}
	return $content_after_blocks;
}
add_filter( 'the_content', 'do_blocks', 9 ); // BEFORE do_shortcode().
