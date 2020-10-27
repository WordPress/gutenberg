<?php
/**
 * Typography block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style and typography block attributes for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_typography_support( $block_type ) {
	$has_font_size_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_font_size_support = gutenberg_experimental_get( $block_type->supports, array( 'fontSize' ), false );
	}

	$has_line_height_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_line_height_support = gutenberg_experimental_get( $block_type->supports, array( 'lineHeight' ), false );
	}

	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( ( $has_font_size_support || $has_line_height_support ) && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}

	if ( $has_font_size_support && ! array_key_exists( 'fontSize', $block_type->attributes ) ) {
		$block_type->attributes['fontSize'] = array(
			'type' => 'string',
		);
	}
}

/**
 * Add CSS classes and inline styles for font sizes to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param  WP_Block_Type $block_type       Block type.
 * @param  array         $block_attributes Block attributes.
 *
 * @return array Font size CSS classes and inline styles.
 */
function gutenberg_apply_typography_support( $block_type, $block_attributes ) {
	$has_font_size_support = false;
	$classes               = array();
	$styles                = array();
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_font_size_support = gutenberg_experimental_get( $block_type->supports, array( 'fontSize' ), false );
	}

	$has_line_height_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_line_height_support = gutenberg_experimental_get( $block_type->supports, array( 'lineHeight' ), false );
	}

	// Font Size.
	if ( $has_font_size_support ) {
		$has_named_font_size  = array_key_exists( 'fontSize', $block_attributes );
		$has_custom_font_size = isset( $block_attributes['style']['typography']['fontSize'] );

		// Apply required class or style.
		if ( $has_named_font_size ) {
			$classes[] = sprintf( 'has-%s-font-size', $block_attributes['fontSize'] );
		} elseif ( $has_custom_font_size ) {
			$styles[] = sprintf( 'font-size: %spx;', $block_attributes['style']['typography']['fontSize'] );
		}
	}

	// Line Height.
	if ( $has_line_height_support ) {
		$has_line_height = isset( $block_attributes['style']['typography']['lineHeight'] );
		// Add the style (no classes for line-height).
		if ( $has_line_height ) {
			$styles[] = sprintf( 'line-height: %s;', $block_attributes['style']['typography']['lineHeight'] );
		}
	}

	$attributes = array();
	if ( ! empty( $classes ) ) {
		$attributes['class'] = implode( ' ', $classes );
	}
	if ( ! empty( $styles ) ) {
		$attributes['style'] = implode( ' ', $styles );
	}

	return $attributes;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'typography',
	array(
		'register_attribute' => 'gutenberg_register_typography_support',
		'apply'              => 'gutenberg_apply_typography_support',
	)
);
