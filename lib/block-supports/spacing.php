<?php
/**
 * Spacing block support flag.
 *
 * For backwards compatibility with core, this remains separate to the
 * dimensions.php block support despite both belonging under a single panel in
 * the editor.
 *
 * @package gutenberg
 */

/**
 * Registers the style block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_spacing_support( $block_type ) {
	$has_spacing_support = block_has_support( $block_type, array( 'spacing' ), false );

	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_spacing_support && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Add CSS classes for block spacing to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param WP_Block_Type $block_type       Block Type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Block spacing CSS classes and inline styles.
 */
function gutenberg_apply_spacing_support( $block_type, $block_attributes ) {
	if ( wp_should_skip_block_supports_serialization( $block_type, 'spacing' ) ) {
		return array();
	}

	$attributes          = array();
	$has_padding_support = block_has_support( $block_type, array( 'spacing', 'padding' ), false );
	$has_margin_support  = block_has_support( $block_type, array( 'spacing', 'margin' ), false );
	$block_styles        = $block_attributes['style'] ?? null;

	if ( ! $block_styles ) {
		return $attributes;
	}

	$skip_padding         = wp_should_skip_block_supports_serialization( $block_type, 'spacing', 'padding' );
	$skip_margin          = wp_should_skip_block_supports_serialization( $block_type, 'spacing', 'margin' );
	$spacing_block_styles = array(
		'padding' => null,
		'margin'  => null,
	);
	if ( $has_padding_support && ! $skip_padding ) {
		$spacing_block_styles['padding'] = $block_styles['spacing']['padding'] ?? null;
	}
	if ( $has_margin_support && ! $skip_margin ) {
		$spacing_block_styles['margin'] = $block_styles['spacing']['margin'] ?? null;
	}
	$styles = gutenberg_style_engine_get_styles( array( 'spacing' => $spacing_block_styles ) );

	if ( ! empty( $styles['css'] ) ) {
		$attributes['style'] = $styles['css'];
	}

	return $attributes;
}

/**
 * Returns a spacing value based on a given spacing-size preset.
 * Takes into account fluid spacing parameters and attempts to return a CSS
 * formula depending on available, valid values.
 *
 * Unlike fluid typography, fluid spacing has no formula to derive a minimum
 * value from a single size, so a preset only becomes fluid when it (or the
 * global `spacing.fluid` setting alongside it) explicitly declares both a
 * `min` and a `max` value. A preset with `fluid: false`, or fluid enabled
 * without explicit bounds, falls back to its static `size`.
 *
 * @since 7.1.0
 *
 * @param array $preset       {
 *     Required. spacingSizes preset value as seen in theme.json.
 *
 *     @type string           $name Name of the spacing size preset.
 *     @type string           $slug Kebab-case unique identifier for the spacing size preset.
 *     @type string|int|float $size CSS spacing value, including units where applicable.
 * }
 * @param array $settings Optional. Theme JSON settings array that overrides any global theme settings.
 *                        Default is `array()`.
 *
 * @return string|null Spacing value or `null` if a size is not passed in $preset.
 */
function gutenberg_get_spacing_size_value( $preset, $settings = array() ) {
	if ( ! isset( $preset['size'] ) ) {
		return null;
	}

	/*
	 * Catch falsy values and 0/'0'. Fluid calculations cannot be performed on `0`.
	 * Also return early when a preset spacing size explicitly disables fluid spacing with `false`.
	 */
	$fluid_spacing_size_settings = $preset['fluid'] ?? null;
	if ( false === $fluid_spacing_size_settings || empty( $preset['size'] ) ) {
		return $preset['size'];
	}

	// Fallback to global settings as default.
	$global_settings  = gutenberg_get_global_settings();
	$settings         = wp_parse_args( $settings, $global_settings );
	$spacing_settings = $settings['spacing'] ?? array();

	/*
	 * Return early when fluid spacing is disabled in the settings, and there
	 * are no local settings to enable it for the individual preset.
	 */
	if ( empty( $spacing_settings['fluid'] ) && empty( $fluid_spacing_size_settings ) ) {
		return $preset['size'];
	}

	// A preset only goes fluid when it explicitly declares both a min and a max.
	if ( ! is_array( $fluid_spacing_size_settings ) ) {
		return $preset['size'];
	}

	$minimum_spacing_size_raw = $fluid_spacing_size_settings['min'] ?? null;
	$maximum_spacing_size_raw = $fluid_spacing_size_settings['max'] ?? null;
	if ( ! $minimum_spacing_size_raw || ! $maximum_spacing_size_raw ) {
		return $preset['size'];
	}

	$fluid_settings = $spacing_settings['fluid'] ?? array();
	$fluid_settings = is_array( $fluid_settings ) ? $fluid_settings : array();

	// Defaults, matching fluid typography's viewport width defaults.
	$default_maximum_viewport_width = '1600px';
	$default_minimum_viewport_width = '320px';

	$minimum_viewport_width = $fluid_settings['minViewportWidth'] ?? $default_minimum_viewport_width;
	$maximum_viewport_width = $fluid_settings['maxViewportWidth'] ?? $default_maximum_viewport_width;

	// Reuses the fluid typography clamp() calculation, which is unit-agnostic.
	$fluid_spacing_size_value = gutenberg_get_computed_fluid_typography_value(
		array(
			'minimum_viewport_width' => $minimum_viewport_width,
			'maximum_viewport_width' => $maximum_viewport_width,
			'minimum_font_size'      => $minimum_spacing_size_raw,
			'maximum_font_size'      => $maximum_spacing_size_raw,
			'scale_factor'           => 1,
		)
	);

	if ( ! empty( $fluid_spacing_size_value ) ) {
		return $fluid_spacing_size_value;
	}

	return $preset['size'];
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'spacing',
	array(
		'register_attribute' => 'gutenberg_register_spacing_support',
		'apply'              => 'gutenberg_apply_spacing_support',
	)
);
