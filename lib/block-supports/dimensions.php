<?php
/**
 * Dimensions block support flag.
 *
 * @package gutenberg
 */

/**
 * Ensures the style attribute required by the dimensions feature is registered,
 * for block types that support the feature.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_dimensions_support( $block_type ) {
	// Determine if width supported.
	$has_width_support = gutenberg_has_dimensions_support( $block_type, 'width' );

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
 * Checks whether the current block type supports the experimental feature
 * requested.
 *
 * @param WP_Block_Type $block_type Block type to check for support.
 * @param string        $feature    Name of the feature to check support for.
 * @param mixed         $default    Fallback value for feature support, defaults to false.
 *
 * @return boolean                  Whether or not the feature is supported.
 */
function gutenberg_has_dimensions_support( $block_type, $feature, $default = false ) {
	$block_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$block_support = gutenberg_experimental_get( $block_type->supports, array( '__experimentalDimensions' ), $default );
	}

	return true === $block_support || ( is_array( $block_support ) && gutenberg_experimental_get( $block_support, array( $feature ), false ) );
}
