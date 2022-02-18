<?php
/**
 * Dimensions block support flag.
 *
 * This does not include the `spacing` block support even though that visually
 * appears under the "Dimensions" panel in the editor. It remains in its
 * original `spacing.php` file for compatibility with core.
 *
 * @package gutenberg
 */

/**
 * Registers the style block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_dimensions_support( $block_type ) {
	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	// Check for existing style attribute definition e.g. from block.json.
	if ( array_key_exists( 'style', $block_type->attributes ) ) {
		return;
	}

	$has_dimensions_support = gutenberg_block_has_support( $block_type, array( '__experimentalDimensions' ), false );

	if ( $has_dimensions_support ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Add CSS classes for block dimensions to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param WP_Block_Type $block_type       Block Type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Block dimensions CSS classes and inline styles.
 */
function gutenberg_apply_dimensions_support( $block_type, $block_attributes ) {
	if ( gutenberg_skip_dimensions_serialization( $block_type ) ) {
		return array();
	}

	$styles = array();

	// Height.
	$has_height_support = gutenberg_block_has_support( $block_type, array( '__experimentalDimensions', 'height' ), false );

	if ( $has_height_support ) {
		$height_value = _wp_array_get( $block_attributes, array( 'style', 'dimensions', 'height' ), null );

		if ( null !== $height_value ) {
			$styles[] = sprintf( 'height: %s;', $height_value );
		}
	}

	// Width.

	// Width support flag can be true|false|"segmented" cannot use
	// `gutenberg_block_has_support` which checked for boolean true or array.
	$has_width_support = _wp_array_get( $block_type->supports, array( '__experimentalDimensions', 'width' ), false );

	if ( $has_width_support ) {
		$width_value = _wp_array_get( $block_attributes, array( 'style', 'dimensions', 'width' ), null );

		if ( null !== $width_value ) {
			$styles[] = sprintf( 'width: %s;', $width_value );
		}
	}

	return empty( $styles ) ? array() : array( 'style' => implode( ' ', $styles ) );
}

/**
 * Checks whether serialization of the current block's dimensions properties
 * should occur.
 *
 * @param WP_Block_type $block_type Block type.
 *
 * @return boolean Whether to serialize dimensions support styles & classes.
 */
function gutenberg_skip_dimensions_serialization( $block_type ) {
	$dimensions_support = _wp_array_get( $block_type->supports, array( '__experimentalDimensions' ), false );

	return is_array( $dimensions_support ) &&
		array_key_exists( '__experimentalSkipSerialization', $dimensions_support ) &&
		$dimensions_support['__experimentalSkipSerialization'];
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'dimensions',
	array(
		'register_attribute' => 'gutenberg_register_dimensions_support',
		'apply'              => 'gutenberg_apply_dimensions_support',
	)
);
