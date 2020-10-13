<?php
/**
 * Width block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style and width block attributes for block types that
 * support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_width_support( $block_type ) {
	// Determine if width supported.
	$has_width_support = gutenberg_has_width_support( $block_type, '__experimentalWidth' );

	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_width_support && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Adds CSS classes and inline styles for width to the incoming
 * attributes array. This will be applied to the block markup in the front-end.
 *
 * @param array         $attributes       List of attributes to be applied.
 * @param array         $block_attributes Block attributes.
 * @param WP_Block_type $block_type       Block type.
 *
 * @return array Width CSS classes and inline styles.
 */
function gutenberg_apply_width_support( $attributes, $block_attributes, $block_type ) {
	$has_width_support = gutenberg_has_width_support( $block_type, '__experimentalWidth' );

	if ( $has_width_support ) {
		$has_width = isset( $block_attributes['style']['width'] );
		if ( $has_width ) {
			$width = intval( $block_attributes['style']['width'] );
            $attributes['inline_styles'][] = sprintf( 'width: %d;', $width );
		}
	}

	return $attributes;
}

/**
 * Checks whether the current block type supports the experimental feature
 * requested.
 *
 * @param WP_Block_Type $block_type Block type to check for support.
 * @param string        $feature    Name of the feature to check support for.
 * @param mixed         $default    Fallback value for feature support, defaults to false.
 *
 * @return boolean                  Whether or not the feature is supported.
 */
function gutenberg_has_width_support( $block_type, $feature, $default = false ) {
	$supported = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$supported = gutenberg_experimental_get( $block_type->supports, array( $feature ), $default );
	}

	return $supported;
}
