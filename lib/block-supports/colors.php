<?php
/**
 * Colors block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style and colors block attributes for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_colors_support( $block_type ) {
	$color_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$color_support = _wp_array_get( $block_type->supports, array( 'color' ), false );
	}
	$has_text_colors_support       = true === $color_support || ( is_array( $color_support ) && _wp_array_get( $color_support, array( 'text' ), true ) );
	$has_background_colors_support = true === $color_support || ( is_array( $color_support ) && _wp_array_get( $color_support, array( 'background' ), true ) );
	$has_gradients_support         = _wp_array_get( $color_support, array( 'gradients' ), false );
	$has_link_colors_support       = _wp_array_get( $color_support, array( 'link' ), false );
	$has_color_support             = $has_text_colors_support ||
		$has_background_colors_support ||
		$has_gradients_support ||
		$has_link_colors_support;

	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_color_support && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}

	if ( $has_background_colors_support && ! array_key_exists( 'backgroundColor', $block_type->attributes ) ) {
		$block_type->attributes['backgroundColor'] = array(
			'type' => 'string',
		);
	}

	if ( $has_text_colors_support && ! array_key_exists( 'textColor', $block_type->attributes ) ) {
		$block_type->attributes['textColor'] = array(
			'type' => 'string',
		);
	}

	if ( $has_gradients_support && ! array_key_exists( 'gradient', $block_type->attributes ) ) {
		$block_type->attributes['gradient'] = array(
			'type' => 'string',
		);
	}
}


/**
 * Add CSS classes and inline styles for colors to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param  WP_Block_Type $block_type       Block type.
 * @param  array         $block_attributes Block attributes.
 *
 * @return array Colors CSS classes and inline styles.
 */
function gutenberg_apply_colors_support( $block_type, $block_attributes ) {
	$color_support = _wp_array_get( $block_type->supports, array( 'color' ), false );

	if (
		is_array( $color_support ) &&
		gutenberg_should_skip_block_supports_serialization( $block_type, 'color' )
	) {
		return array();
	}

	$has_text_colors_support       = true === $color_support || ( is_array( $color_support ) && _wp_array_get( $color_support, array( 'text' ), true ) );
	$has_background_colors_support = true === $color_support || ( is_array( $color_support ) && _wp_array_get( $color_support, array( 'background' ), true ) );
	$has_gradients_support         = _wp_array_get( $color_support, array( 'gradients' ), false );
	$color_block_styles            = array();

	// Text colors.
	// Check support for text colors.
	if ( $has_text_colors_support && ! gutenberg_should_skip_block_supports_serialization( $block_type, 'color', 'text' ) ) {
		$color_block_styles['text'] = array(
			'value' => isset( $block_attributes['style']['color']['text'] ) ? $block_attributes['style']['color']['text'] : null,
			'slug'  => array_key_exists( 'textColor', $block_attributes ) ? $block_attributes['textColor'] : null,
		);
	}

	// Background colors.
	if ( $has_background_colors_support && ! gutenberg_should_skip_block_supports_serialization( $block_type, 'color', 'background' ) ) {
		$color_block_styles['background'] = array(
			'value' => isset( $block_attributes['style']['color']['background'] ) ? $block_attributes['style']['color']['background'] : null,
			'slug'  => array_key_exists( 'backgroundColor', $block_attributes ) ? $block_attributes['backgroundColor'] : null,
		);
	}

	// Gradients.

	if ( $has_gradients_support && ! gutenberg_should_skip_block_supports_serialization( $block_type, 'color', 'gradients' ) ) {
		$color_block_styles['gradient'] = array(
			'value' => isset( $block_attributes['style']['color']['gradient'] ) ? $block_attributes['style']['color']['gradient'] : null,
			'slug'  => array_key_exists( 'gradient', $block_attributes ) ? $block_attributes['gradient'] : null,
		);
	}

	$attributes   = array();
	$style_engine = gutenberg_get_style_engine();
	$styles       = $style_engine->generate( array( 'color' => $color_block_styles ) );

	if ( ! empty( $styles['classnames'] ) ) {
		$attributes['class'] = $styles['classnames'];
	}

	if ( ! empty( $styles['css'] ) ) {
		$attributes['style'] = $styles['css'];
	}

	return $attributes;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'colors',
	array(
		'register_attribute' => 'gutenberg_register_colors_support',
		'apply'              => 'gutenberg_apply_colors_support',
	)
);
