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
 * Add CSS classes and inline styles for dimension features to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param  WP_Block_Type $block_type       Block type.
 * @param  array         $block_attributes Block attributes.
 *
 * @return array Dimensions CSS classes and inline styles.
 */
function gutenberg_apply_dimensions_support( $block_type, $block_attributes ) {
	$has_width_support = gutenberg_has_dimensions_support( $block_type, 'width' );
	$styles            = array();

	if ( $has_width_support ) {
		$width_style = gutenberg_dimensions_get_css_variable_inline_style( $block_attributes, 'width', 'width' );
		if ( $width_style ) {
			$styles[] = $width_style;
		}
	}

	$attributes = array();
	if ( ! empty( $styles ) ) {
		$attributes['style'] = implode( ' ', $styles );
	}
	return $attributes;
}

/**
 * Generates an inline style for a dimension feature e.g. width, height.
 *
 * @param array  $attributes   Block's attributes.
 * @param string $feature      Key for the feature within the dimensions styles.
 * @param string $css_property Slug for the CSS property the inline style sets.
 *
 * @return string              CSS inline style.
 */
function gutenberg_dimensions_get_css_variable_inline_style( $attributes, $feature, $css_property ) {
	// Retrieve current attribute value or skip if not found.
	$style_value = gutenberg_experimental_get( $attributes, array( 'style', 'dimensions', $feature ), false );
	if ( ! $style_value ) {
		return;
	}

	// If we don't have a preset CSS variable, we'll assume it's a regular CSS value.
	if ( strpos( $style_value, "var:preset|{$css_property}|" ) === false ) {
		return sprintf( '%s: %s;', $css_property, $style_value );
	}

	// We have a preset CSS variable as the style.
	// Get the style value from the string and return CSS style.
	$index_to_splice = strrpos( $style_value, '|' ) + 1;
	$slug            = substr( $style_value, $index_to_splice );

	// Return the actual CSS inline style e.g. `text-decoration:var(--wp--preset--text-decoration--underline);`.
	return sprintf( '%s: var(--wp--preset--%s--%s);', $css_property, $css_property, $slug );
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

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'dimensions',
	array(
		'register_attribute' => 'gutenberg_register_dimensions_support',
		'apply'              => 'gutenberg_apply_dimensions_support',
	)
);
