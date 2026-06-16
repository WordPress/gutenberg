<?php
/**
 * Compatibility shims for KSES (content filtering) for WordPress 7.1.
 *
 * @package gutenberg
 */

/**
 * Adds SVG presentation attributes to the list of safe CSS properties.
 *
 * The {@see safecss_filter_attr()} function only keeps allowlisted CSS properties, so SVG
 * presentation attributes such as `fill` are stripped by default. This allows
 * the SVG-specific ones.
 *
 * @param string[] $attr Array of allowed CSS attributes.
 * @return string[] Modified array of allowed CSS attributes.
 */
function gutenberg_add_svg_to_safe_style_css( array $attr ): array {
	$svg_properties = array(
		// Fill.
		'fill',
		'fill-opacity',
		'fill-rule',

		// Stroke.
		'stroke',
		'stroke-dasharray',
		'stroke-dashoffset',
		'stroke-linecap',
		'stroke-linejoin',
		'stroke-miterlimit',
		'stroke-opacity',
		'stroke-width',

		// Paint.
		'color-interpolation',
		'color-interpolation-filters',
		'paint-order',
		'stop-color',
		'stop-opacity',
		'flood-color',
		'flood-opacity',
		'lighting-color',

		// Markers.
		'marker',
		'marker-start',
		'marker-mid',
		'marker-end',

		// Clipping and masking.
		'clip-rule',
		'mask-type',

		// Geometry.
		'cx',
		'cy',
		'r',
		'rx',
		'ry',
		'x',
		'y',
		'd',

		// Text.
		'alignment-baseline',
		'baseline-shift',
		'dominant-baseline',
		'glyph-orientation-horizontal',
		'glyph-orientation-vertical',
		'text-anchor',

		// Rendering.
		'shape-rendering',
		'vector-effect',
	);

	return array_unique( array_merge( $attr, $svg_properties ) );
}
add_filter( 'safe_style_css', 'gutenberg_add_svg_to_safe_style_css' );
