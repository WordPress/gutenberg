<?php
/**
 * Compatibility shims for KSES (content filtering) for WordPress 7.3.
 *
 * @package gutenberg
 */

/**
 * Allows CSS color functions, such as rgba() and color-mix(), in inline styles.
 *
 * Replaces each color function whose contents are plain color syntax,
 * innermost first, then reruns Core's leftover check.
 *
 * Hooked at PHP_INT_MIN so it runs before any other filter, like Core's own
 * check. A filter at any later priority can still reject the declaration.
 *
 * @param bool   $allow_css       Whether the CSS is allowed.
 * @param string $css_test_string The CSS declaration to test.
 * @return bool Whether the CSS is allowed.
 */
function gutenberg_allow_css_color_functions( $allow_css, $css_test_string ) {
	$color_function = '/(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|color|light-dark)\(([^()]*)\)/i';

	if ( $allow_css || ! preg_match( $color_function, $css_test_string ) ) {
		return $allow_css;
	}

	/*
	 * Each pass replaces the innermost color functions, so 4 passes allow 4 levels
	 * of nesting. That is the deepest real combination, for example:
	 * light-dark(color-mix(in srgb, rgb(from hsl(200 50% 40%) r g b) 50%, #fff), #000)
	 */
	for ( $pass = 0; $pass < 4; $pass++ ) {
		$count = preg_match_all( $color_function, $css_test_string, $matches );

		if ( false === $count ) {
			return $allow_css;
		}

		if ( 0 === $count ) {
			break;
		}

		foreach ( $matches[1] as $contents ) {
			if ( ! preg_match( '/^[a-z0-9#%.,\/+\s-]*$/i', $contents ) ) {
				return $allow_css;
			}
		}

		$css_test_string = preg_replace( $color_function, '0', $css_test_string );

		if ( null === $css_test_string ) {
			return $allow_css;
		}
	}

	return 0 === preg_match( '%[\\\(&=}]|/\*%', $css_test_string );
}
add_filter( 'safecss_filter_attr_allow_css', 'gutenberg_allow_css_color_functions', PHP_INT_MIN, 2 );

/**
 * Adds 'box-sizing' to the list of safe CSS properties.
 *
 * The layout block support gives a child with a fixed size in a flex layout
 * `box-sizing: border-box`, so that its padding and borders stay inside that size.
 * The style engine filters every declaration through {@see safecss_filter_attr()},
 * so without this entry the declaration is silently dropped.
 *
 * @param string[] $attr Array of allowed CSS attributes.
 * @return string[] Modified array of allowed CSS attributes.
 */
function gutenberg_add_box_sizing_to_safe_style_css( array $attr ): array {
	if ( ! in_array( 'box-sizing', $attr, true ) ) {
		$attr[] = 'box-sizing';
	}

	return $attr;
}
add_filter( 'safe_style_css', 'gutenberg_add_box_sizing_to_safe_style_css' );

/**
 * Adds 'text-wrap' to the list of safe CSS properties.
 * This is needed for the typography text wrap style.
 *
 * @param string[] $attr Array of allowed CSS attributes.
 * @return string[] Modified array of allowed CSS attributes.
 */
function gutenberg_add_text_wrap_to_safe_style_css( $attr ) {
	if ( ! in_array( 'text-wrap', $attr, true ) ) {
		$attr[] = 'text-wrap';
	}

	return $attr;
}
add_filter( 'safe_style_css', 'gutenberg_add_text_wrap_to_safe_style_css' );
