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

	if ( empty( $block_attributes['style'] ) ) {
		return array();
	}

	$attributes = $block_attributes;
	if ( ! is_array( $attributes['style']['spacing'] ?? null ) ) {
		return array();
	}

	if (
		! block_has_support( $block_type, array( 'spacing', 'padding' ), false ) ||
		wp_should_skip_block_supports_serialization( $block_type, 'spacing', 'padding' )
	) {
		unset( $attributes['style']['spacing']['padding'] );
	}
	if (
		! block_has_support( $block_type, array( 'spacing', 'margin' ), false ) ||
		wp_should_skip_block_supports_serialization( $block_type, 'spacing', 'margin' )
	) {
		unset( $attributes['style']['spacing']['margin'] );
	}

	return gutenberg_get_spacing_classes_and_styles( $attributes );
}

/**
 * Returns spacing classes and inline styles for block attributes, like the JS
 * `getSpacingClassesAndStyles()`. Does not check block support or skipped
 * serialization.
 *
 * @since 7.2.0
 *
 * @param array $block_attributes Block attributes.
 * @return array Array with `class` and `style` keys, each present only when non-empty.
 */
function gutenberg_get_spacing_classes_and_styles( $block_attributes ) {
	$spacing = $block_attributes['style']['spacing'] ?? null;
	if ( ! is_array( $spacing ) ) {
		return array();
	}

	$styles     = gutenberg_style_engine_get_styles(
		array(
			'spacing' => array(
				'padding' => $spacing['padding'] ?? null,
				'margin'  => $spacing['margin'] ?? null,
			),
		)
	);
	$attributes = array();

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
	'spacing',
	array(
		'register_attribute' => 'gutenberg_register_spacing_support',
		'apply'              => 'gutenberg_apply_spacing_support',
	)
);
