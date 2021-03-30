<?php
/**
 * Border block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style attribute used by the border feature if needed for block types that
 * support borders.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_border_support( $block_type ) {
	// Determine border related features supported.
	// Border width, style etc can be added in the future.
	$has_border_radius_support = gutenberg_block_has_support( $block_type, array( '__experimentalBorder', 'radius' ), false );

	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_border_radius_support && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Adds CSS classes and inline styles for border styles to the incoming
 * attributes array. This will be applied to the block markup in the front-end.
 *
 * @param WP_Block_type $block_type       Block type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Border CSS classes and inline styles.
 */
function gutenberg_apply_border_support( $block_type, $block_attributes ) {
	$border_support = _wp_array_get( $block_type->supports, array( '__experimentalBorder' ), false );

	if (
		is_array( $border_support ) &&
		array_key_exists( '__experimentalSkipSerialization', $border_support ) &&
		$border_support['__experimentalSkipSerialization']
	) {
		return array();
	}

	// Arrays used to ease addition of further border related features in future.
	$styles = array();

	// Border Radius.
	$has_border_radius_support = gutenberg_block_has_support( $block_type, array( '__experimentalBorder', 'radius' ), false );
	if ( $has_border_radius_support ) {
		if ( isset( $block_attributes['style']['border']['radius'] ) ) {
			$border_radius = intval( $block_attributes['style']['border']['radius'] );
			$styles[]      = sprintf( 'border-radius: %dpx;', $border_radius );
		}
	}

	// Border width, style etc can be added here.

	// Collect classes and styles.
	$attributes = array();

	if ( ! empty( $styles ) ) {
		$attributes['style'] = implode( ' ', $styles );
	}

	return $attributes;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'border',
	array(
		'register_attribute' => 'gutenberg_register_border_support',
		'apply'              => 'gutenberg_apply_border_support',
	)
);
