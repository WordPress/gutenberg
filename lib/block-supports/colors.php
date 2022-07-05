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
	$color_block_presets           = array();

	// Text colors.
	// Check support for text colors.
	if ( $has_text_colors_support && ! gutenberg_should_skip_block_supports_serialization( $block_type, 'color', 'text' ) ) {
		$color_block_styles['text']  = _wp_array_get( $block_attributes, array( 'style', 'color', 'text' ), null );
		$color_block_presets['text'] = array_key_exists( 'textColor', $block_attributes ) ? "var:preset|color|{$block_attributes['textColor']}" : null;
	}

	// Background colors.
	if ( $has_background_colors_support && ! gutenberg_should_skip_block_supports_serialization( $block_type, 'color', 'background' ) ) {
		$color_block_styles['background']  = _wp_array_get( $block_attributes, array( 'style', 'color', 'background' ), null );
		$color_block_presets['background'] = array_key_exists( 'backgroundColor', $block_attributes ) ? "var:preset|color|{$block_attributes['backgroundColor']}" : null;
	}

	// Gradients.

	if ( $has_gradients_support && ! gutenberg_should_skip_block_supports_serialization( $block_type, 'color', 'gradients' ) ) {
		$color_block_styles['gradient']  = _wp_array_get( $block_attributes, array( 'style', 'color', 'gradient' ), null );
		$color_block_presets['gradient'] = array_key_exists( 'gradient', $block_attributes ) ? "var:preset|gradient|{$block_attributes['gradient']}" : null;
	}

	$attributes = array();
	$style      = gutenberg_style_engine_generate_css(
		array( 'border' => $color_block_styles ),
		array(
			'skip_css_vars' => true,
		)
	);
	$class      = gutenberg_style_engine_generate_classnames( array( 'border' => $color_block_presets ) );

	if ( ! empty( $style ) ) {
		$attributes['style'] = $style;
	}

	if ( ! empty( $class ) ) {
		$attributes['class'] = $class;
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
