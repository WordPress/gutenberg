<?php
/**
 * Block support utility functions.
 *
 * @package gutenberg
 */

/**
 * Returns the combined classes and inline styles of the background, color,
 * border, shadow and spacing block supports for block attributes. Does not
 * check block support or skipped serialization.
 *
 * @since 7.3.0
 *
 * @param array<string, mixed> $block_attributes Block attributes.
 * @param string[]|null        $supports         Optional. Supports to include: any of `background`, `color`,
 *                                               `border`, `shadow` and `spacing`. Unknown names are ignored.
 *                                               Default null, for all of them.
 * @return array<string, string> Array with `class` and `style` keys, each present only when non-empty.
 *
 * @phpstan-return array{ class?: non-empty-string, style?: non-empty-string }
 */
function gutenberg_get_block_supports_classes_and_styles( $block_attributes, $supports = null ) {
	// Follows the style engine's group order.
	$getters = array(
		'background' => 'gutenberg_get_background_classes_and_styles',
		'color'      => 'gutenberg_get_color_classes_and_styles',
		'border'     => 'gutenberg_get_border_classes_and_styles',
		'shadow'     => 'gutenberg_get_shadow_classes_and_styles',
		'spacing'    => 'gutenberg_get_spacing_classes_and_styles',
	);

	if ( is_array( $supports ) ) {
		$getters = array_intersect_key( $getters, array_flip( $supports ) );
	}

	$classes = array();
	$styles  = '';

	foreach ( $getters as $getter ) {
		$classes_and_styles = $getter( $block_attributes );

		if ( ! empty( $classes_and_styles['class'] ) ) {
			$classes[] = $classes_and_styles['class'];
		}

		if ( ! empty( $classes_and_styles['style'] ) ) {
			$styles .= $classes_and_styles['style'];
		}
	}

	$attributes = array();

	if ( ! empty( $classes ) ) {
		// Background and color can both add `has-background`.
		$attributes['class'] = implode( ' ', array_unique( explode( ' ', implode( ' ', $classes ) ) ) );
	}

	if ( '' !== $styles ) {
		$attributes['style'] = $styles;
	}

	return $attributes;
}
