<?php
/**
 * Transform block support flag.
 *
 * Each transform feature outputs its own individual CSS property, such as
 * `rotate`, never the `transform` shorthand, so features combine with each
 * other and with any transform a block already applies.
 *
 * @package gutenberg
 */

/**
 * Registers the style block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_transform_support( $block_type ) {
	if ( ! block_has_support( $block_type, 'transform', false ) ) {
		return;
	}

	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Adds classes and inline styles for transform features to the incoming
 * attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param WP_Block_Type $block_type       Block type.
 * @param array         $block_attributes Block attributes.
 * @return array Transform classes and inline styles.
 */
function gutenberg_apply_transform_support( $block_type, $block_attributes ) {
	if (
		! block_has_support( $block_type, 'transform', false ) ||
		wp_should_skip_block_supports_serialization( $block_type, 'transform' )
	) {
		return array();
	}

	$transform = $block_attributes['style']['transform'] ?? null;
	if ( ! is_array( $transform ) ) {
		return array();
	}

	foreach ( array_keys( $transform ) as $feature ) {
		if (
			! block_has_support( $block_type, array( 'transform', $feature ), false ) ||
			wp_should_skip_block_supports_serialization( $block_type, 'transform', $feature )
		) {
			unset( $transform[ $feature ] );
		}
	}

	$classes_and_styles = gutenberg_get_transform_classes_and_styles( array( 'style' => array( 'transform' => $transform ) ) );

	// A block that keeps its width when rotated does not need the fit class.
	if ( ! block_has_support( $block_type, array( 'transform', 'fitContent' ), true ) ) {
		unset( $classes_and_styles['class'] );
	}

	return $classes_and_styles;
}

/**
 * Returns transform classes and inline styles for block attributes, like the
 * JS `getTransformClassesAndStyles()`. Does not check block support or skipped
 * serialization.
 *
 * @since 7.3.0
 *
 * @param array $block_attributes Block attributes.
 * @return array Array with `style` and `class` keys, each present only when non-empty.
 */
function gutenberg_get_transform_classes_and_styles( $block_attributes ) {
	if ( ! is_array( $block_attributes ) ) {
		return array();
	}

	$transform = $block_attributes['style']['transform'] ?? null;
	if ( ! is_array( $transform ) ) {
		return array();
	}

	$styles = gutenberg_style_engine_get_styles( array( 'transform' => $transform ) );
	if ( empty( $styles['css'] ) ) {
		return array();
	}

	$classes_and_styles = array( 'style' => $styles['css'] );

	// Lets the shared stylesheet fit a rotated block to its content.
	if ( isset( $styles['declarations']['rotate'] ) ) {
		$classes_and_styles['class'] = 'has-rotation';
	}

	return $classes_and_styles;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'transform',
	array(
		'register_attribute' => 'gutenberg_register_transform_support',
		'apply'              => 'gutenberg_apply_transform_support',
	)
);
