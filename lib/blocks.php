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
 *
 * @param string $name Block type name including namespace.
 * @param array  $args {
 *     Array of block type arguments. Any arguments may be defined, however the following
 *     ones are supported by default.
 *
 *     @type callable $render Callback used to render blocks of this block type.
 * }
 * @return WP_Block_Type|false The registered block type on success, or false on failure.
 */
function register_block_type( $name, $args ) {
	return WP_Block_Type_Registry::get_instance()->register( $name, $args );
}

/**
 * Unregisters a block type.
 *
 * @since 0.1.0
 *
 * @param string $name Block type name including namespace.
 * @return WP_Block_Type|false The unregistered block type on success, or false on failure.
 */
function unregister_block_type( $name ) {
	return WP_Block_Type_Registry::get_instance()->unregister( $name );
}

/**
 * Extract the block attributes from the block's attributes string
 *
 * @since 0.1.0
 *
 * @param string $attr_string Attributes string.

 * @return array
 */
function parse_block_attributes( $attr_string ) {
	$attributes_matcher = '/([^\s]+)="([^"]+)"\s*/';
	preg_match_all( $attributes_matcher, $attr_string, $matches );
	$attributes = array();
	foreach ( $matches[1] as $index => $attribute_match ) {
		$attributes[ $attribute_match ] = $matches[2][ $index ];
	}

	return $attributes;
}

/**
 * Renders the dynamic blocks into the post content
 *
 * @since 0.1.0
 *
 * @param  string $content Post content.
 *
 * @return string          Updated post content.
 */
function do_blocks( $content ) {
	$registry = WP_Block_Type_Registry::get_instance();

	// Extract the blocks from the post content.
	$matcher = '#' . join( '', array(
		'(?P<opener><!--\s*',
		'wp:(?P<block_type_name>[a-z](?:[a-z0-9/]+)*)\s+',
		'(?P<attributes>(?:(?!-->).)*)',
		'\s*/?-->\n?)',
		'(?:',
		'(?P<content>.*?)',
		'(?P<closer><!--\s*/wp:\g{block_type_name}\s+-->\n?)',
		')?',
	) ) . '#s';
	preg_match_all( $matcher, $content, $matches, PREG_OFFSET_CAPTURE );

	$new_content = $content;
	$offset_differential = 0;
	foreach ( $matches[0] as $index => $block_match ) {
		$block_type_name = $matches['block_type_name'][ $index ][0];
		$block_type = $registry->get_registered( $block_type_name );

		$output = '';
		if ( null !== $block_type ) {
			$block_attributes_string = $matches['attributes'][ $index ][0];
			$block_attributes = parse_block_attributes( $block_attributes_string );

			// Call the block's render function to generate the dynamic output.
			$output = call_user_func( $block_type->render, $block_attributes );
		} elseif ( isset( $matches['content'][ $index ][0] ) ) {
			$output = $matches['content'][ $index ][0];
		}

		// Replace the matched block with the static or dynamic output.
		$new_content = substr_replace(
			$new_content,
			$output,
			$block_match[1] - $offset_differential,
			strlen( $block_match[0] )
		);

		// Update offset for the next replacement.
		$offset_differential += strlen( $block_match[0] ) - strlen( $output );
	}

	return $new_content;
}
add_filter( 'the_content', 'do_blocks', 9 ); // BEFORE do_shortcode() and wpautop().
