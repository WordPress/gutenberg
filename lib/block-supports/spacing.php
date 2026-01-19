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
 * Returns a spacing size value based on a given spacing size preset.
 *
 * @since TBD
 *
 * @param array $preset       {
 *     Required. spacingSizes preset value as seen in theme.json.
 *
 *     @type string           $name Name of the spacing size preset.
 *     @type string           $slug Kebab-case unique identifier for the spacing size preset.
 *     @type string|int|float  $size CSS spacing size value, including units where applicable.
 *     @type array            $fluid Fluid spacing settings when fluid spacing is enabled.
 * }
 * @param bool|array $settings Optional Theme JSON settings array that overrides any global theme settings.
 *                             Default is `array()`.
 *
 * @return string|null Spacing size value or `null` if a size is not passed in $preset.
 */
function gutenberg_get_spacing_size_value( $preset, $settings = array() ) {
	if ( ! isset( $preset['size'] ) ) {
		return null;
	}

	// Treat existing functional CSS size as authoritative; return as-is.
	$size = isset( $preset['size'] ) ? (string) $preset['size'] : '';
	if (
		false !== strpos( $size, 'clamp(' ) ||
		false !== strpos( $size, 'min(' ) ||
		false !== strpos( $size, 'max(' ) ||
		false !== strpos( $size, 'calc(' ) ||
		false !== strpos( $size, 'var(' )
	) {
		return $size;
	}

	// Fluid settings from the preset (can be false|true|array).
	$fluid_spacing_settings = $preset['fluid'] ?? null;

	// Explicitly disabled or empty size → return static size.
	if ( false === $fluid_spacing_settings || empty( $size ) ) {
		return $size;
	}

	// If fluid is boolean true (no explicit values), return static size for spacing.
	// @todo: We need to create a fluid calculation for spacing (or use the same one as typography)
	if ( true === $fluid_spacing_settings ) {
		return $size;
	}

	// Build clamp() only when explicit min/preferred/max are provided via fluid object.
	if ( is_array( $fluid_spacing_settings ) && ! empty( $fluid_spacing_settings ) ) {
		$min       = isset( $fluid_spacing_settings['min'] ) ? trim( (string) $fluid_spacing_settings['min'] ) : '';
		$preferred = isset( $fluid_spacing_settings['preferred'] ) ? trim( (string) $fluid_spacing_settings['preferred'] ) : trim( (string) $size );
		$max       = isset( $fluid_spacing_settings['max'] ) ? trim( (string) $fluid_spacing_settings['max'] ) : '';

		// All three are required to form a valid clamp().
		if ( '' !== $min && '' !== $preferred && '' !== $max ) {
			return sprintf( 'clamp(%s, %s, %s)', $min, $preferred, $max );
		}
	}

	// Fallback to static size.
	return $size;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'spacing',
	array(
		'register_attribute' => 'gutenberg_register_spacing_support',
		'apply'              => 'gutenberg_apply_spacing_support',
	)
);
