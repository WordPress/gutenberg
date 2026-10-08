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
	if ( $block_type instanceof WP_Block_Type ) {
		$color_support = $block_type->supports['color'] ?? false;
	}
	$has_text_colors_support       = true === $color_support ||
		( isset( $color_support['text'] ) && $color_support['text'] ) ||
		( is_array( $color_support ) && ! isset( $color_support['text'] ) );
	$has_background_colors_support = true === $color_support ||
		( isset( $color_support['background'] ) && $color_support['background'] ) ||
		( is_array( $color_support ) && ! isset( $color_support['background'] ) );
	$has_gradients_support         = $color_support['gradients'] ?? false;
	$has_link_colors_support       = $color_support['link'] ?? false;
	$has_button_colors_support     = $color_support['button'] ?? false;
	$has_heading_colors_support    = $color_support['heading'] ?? false;
	$has_color_support             = $has_text_colors_support ||
		$has_background_colors_support ||
		$has_gradients_support ||
		$has_link_colors_support ||
		$has_button_colors_support ||
		$has_heading_colors_support;

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
 * @param WP_Block_Type $block_type       Block type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Colors CSS classes and inline styles.
 */
function gutenberg_apply_colors_support( $block_type, $block_attributes ) {
	$color_support = $block_type->supports['color'] ?? false;

	if (
		is_array( $color_support ) &&
		wp_should_skip_block_supports_serialization( $block_type, 'color' )
	) {
		return array();
	}

	$has_text_colors_support       = true === $color_support ||
		( isset( $color_support['text'] ) && $color_support['text'] ) ||
		( is_array( $color_support ) && ! isset( $color_support['text'] ) );
	$has_background_colors_support = true === $color_support ||
		( isset( $color_support['background'] ) && $color_support['background'] ) ||
		( is_array( $color_support ) && ! isset( $color_support['background'] ) );
	$has_gradients_support         = $color_support['gradients'] ?? false;

	// background.php owns the CSS when a background gradient is set, so skip color.gradient.
	$has_background_gradient_support = block_has_support( $block_type, array( 'background', 'gradient' ), false );
	$has_background_gradient_value   = ! empty( $block_attributes['style']['background']['gradient'] );

	$features         = array(
		'text'       => array( 'textColor', $has_text_colors_support && ! wp_should_skip_block_supports_serialization( $block_type, 'color', 'text' ) ),
		'background' => array( 'backgroundColor', $has_background_colors_support && ! wp_should_skip_block_supports_serialization( $block_type, 'color', 'background' ) ),
		'gradient'   => array(
			'gradient',
			$has_gradients_support &&
				! wp_should_skip_block_supports_serialization( $block_type, 'color', 'gradients' ) &&
				! ( $has_background_gradient_support && $has_background_gradient_value ),
		),
	);
	$attributes       = $block_attributes;
	$has_color_styles = isset( $attributes['style']['color'] ) && is_array( $attributes['style']['color'] );

	foreach ( $features as $feature => list( $preset_attribute, $is_allowed ) ) {
		if ( $is_allowed ) {
			continue;
		}
		unset( $attributes[ $preset_attribute ] );
		if ( $has_color_styles ) {
			unset( $attributes['style']['color'][ $feature ] );
		}
	}

	return gutenberg_get_color_classes_and_styles( $attributes );
}

/**
 * Returns color classes and inline styles for block attributes, like the JS
 * `getColorClassesAndStyles()`. Does not check block support or skipped
 * serialization.
 *
 * @since 7.2.0
 *
 * @param array $block_attributes Block attributes.
 * @return array Array with `class` and `style` keys, each present only when non-empty.
 */
function gutenberg_get_color_classes_and_styles( $block_attributes ) {
	if ( ! is_array( $block_attributes ) ) {
		return array();
	}

	$color_block_styles = array();
	$preset_attributes  = array(
		'text'       => array( 'textColor', 'color' ),
		'background' => array( 'backgroundColor', 'color' ),
		'gradient'   => array( 'gradient', 'gradient' ),
	);

	foreach ( $preset_attributes as $feature => list( $preset_attribute, $preset_type ) ) {
		$preset_value                   = array_key_exists( $preset_attribute, $block_attributes ) ? "var:preset|{$preset_type}|{$block_attributes[ $preset_attribute ]}" : null;
		$custom_value                   = $block_attributes['style']['color'][ $feature ] ?? null;
		$color_block_styles[ $feature ] = $preset_value ?? $custom_value;
	}

	$attributes = array();
	$styles     = gutenberg_style_engine_get_styles( array( 'color' => $color_block_styles ), array( 'convert_vars_to_classnames' => true ) );

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
