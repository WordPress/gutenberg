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
		'marker-end',
		'marker-mid',
		'marker-start',

		// Clipping and masking.
		'clip-path',
		'clip-rule',
		'mask',
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
		'unicode-bidi',
		'word-spacing',

		// Font.
		'font-size-adjust',
		'font-stretch',

		// Rendering.
		'color-rendering',
		'image-rendering',
		'shape-rendering',
		'text-rendering',
		'vector-effect',

		// Transforms.
		'transform',
		'transform-origin',

		// Interactivity and visibility.
		'pointer-events',
		'visibility',
	);

	return array_unique( array_merge( $attr, $svg_properties ) );
}
add_filter( 'safe_style_css', 'gutenberg_add_svg_to_safe_style_css' );

/**
 * Allow gradient background-image values, including gradients combined with a
 * url() image, in inline styles.
 *
 * Without this, {@see safecss_filter_attr()} strips gradients that use functions
 * beyond rgb()/rgba(), or that are combined with a url() image. This removes each
 * gradient from the test string and re-checks the remainder, so those values
 * survive sanitization.
 *
 * @param bool   $allow_css       Whether the CSS is allowed.
 * @param string $css_test_string The CSS declaration to test.
 * @return bool Whether the CSS is allowed.
 */
function gutenberg_allow_extended_gradient_backgrounds( $allow_css, $css_test_string ) {
	if ( $allow_css ) {
		return $allow_css;
	}

	if ( ! preg_match( '/^background-image\s*:/', $css_test_string ) ) {
		return $allow_css;
	}

	/*
	 * Remove each gradient (allowing one level of nested functions such as
	 * rgb(), hsl(), or calc()) and re-test. Any url() has already been removed
	 * and protocol-checked by safecss_filter_attr() before this filter runs.
	 */
	$stripped = preg_replace( '/(?:repeating-)?(?:linear|radial|conic)-gradient\((?:[^()]|\([^()]*\))*\)/', '', $css_test_string );

	if ( ! preg_match( '%[\\\(&=}]|/\*%', $stripped ) ) {
		return true;
	}

	return $allow_css;
}

add_filter( 'safecss_filter_attr_allow_css', 'gutenberg_allow_extended_gradient_backgrounds', 10, 2 );

/**
 * Allows the `tabindex` attribute on elements that support global attributes.
 *
 * `tabindex` is a global HTML attribute, but KSES strips it from post content.
 * The Tab Panel block saves it to keep the panel focusable.
 *
 * @param array[] $tags Array of allowed HTML tags and their allowed attributes.
 * @return array[] Modified array of allowed HTML tags.
 */
function gutenberg_add_tabindex_to_kses_allowed_html( $tags ) {
	if ( ! is_array( $tags ) ) {
		return $tags;
	}

	foreach ( $tags as $tag => $attributes ) {
		if ( is_array( $attributes ) ) {
			$tags[ $tag ]['tabindex'] = true;
		}
	}

	return $tags;
}
add_filter( 'wp_kses_allowed_html', 'gutenberg_add_tabindex_to_kses_allowed_html' );
