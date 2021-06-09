<?php
/**
 * Dimensions block support flag.
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
	$has_spacing_support    = gutenberg_block_has_support( $block_type, array( 'spacing' ), false );

	if ( $has_dimensions_support || $has_spacing_support ) {
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
 * @return array Block spacing CSS classes and inline styles.
 */
function gutenberg_apply_dimensions_support( $block_type, $block_attributes ) {
	$dimensions_styles = gutenberg_get_dimensions_styles( $block_type, $block_attributes );
	$spacing_styles    = gutenberg_get_spacing_styles( $block_type, $block_attributes );
	$styles            = $dimensions_styles . $spacing_styles;

	return empty( $styles ) ? array() : array( 'style' => $styles );
}

/**
 * Add inline styles for block dimensions to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param WP_Block_Type $block_type       Block Type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Block dimensions inline styles.
 */
function gutenberg_get_dimensions_styles( $block_type, $block_attributes ) {
	if ( gutenberg_skip_dimensions_serialization( $block_type ) ) {
		return array();
	}

	$has_height_support = gutenberg_block_has_support( $block_type, array( '__experimentalDimensions', 'height' ), false );
	$styles             = array();

	if ( $has_height_support ) {
		$height_value = _wp_array_get( $block_attributes, array( 'style', 'dimensions', 'height' ), null );

		if ( null !== $height_value ) {
			$styles[] = sprintf( 'height: %s;', $height_value );
		}
	}

	// Width support to be added in near future.

	return empty( $styles ) ? null : implode( ' ', $styles );
}

/**
 * Add inline styles for block spacing to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param WP_Block_Type $block_type       Block Type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Block spacing inline styles.
 */
function gutenberg_get_spacing_styles( $block_type, $block_attributes ) {
	if ( gutenberg_skip_spacing_serialization( $block_type ) ) {
		return array();
	}

	$has_padding_support = gutenberg_block_has_support( $block_type, array( 'spacing', 'padding' ), false );
	$has_margin_support  = gutenberg_block_has_support( $block_type, array( 'spacing', 'margin' ), false );
	$styles              = array();

	if ( $has_padding_support ) {
		$padding_value = _wp_array_get( $block_attributes, array( 'style', 'spacing', 'padding' ), null );
		if ( null !== $padding_value ) {
			foreach ( $padding_value as $key => $value ) {
				$styles[] = sprintf( 'padding-%s: %s;', $key, $value );
			}
		}
	}

	if ( $has_margin_support ) {
		$margin_value = _wp_array_get( $block_attributes, array( 'style', 'spacing', 'margin' ), null );
		if ( null !== $margin_value ) {
			foreach ( $margin_value as $key => $value ) {
				$styles[] = sprintf( 'margin-%s: %s;', $key, $value );
			}
		}
	}

	return empty( $styles ) ? null : implode( ' ', $styles );
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

/**
 * Checks whether serialization of the current block's spacing properties should
 * occur.
 *
 * @param WP_Block_type $block_type Block type.
 *
 * @return boolean Whether to serialize spacing support styles & classes.
 */
function gutenberg_skip_spacing_serialization( $block_type ) {
	$spacing_support = _wp_array_get( $block_type->supports, array( 'spacing' ), false );

	return is_array( $spacing_support ) &&
		array_key_exists( '__experimentalSkipSerialization', $spacing_support ) &&
		$spacing_support['__experimentalSkipSerialization'];
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'dimensions',
	array(
		'register_attribute' => 'gutenberg_register_dimensions_support',
		'apply'              => 'gutenberg_apply_dimensions_support',
	)
);
