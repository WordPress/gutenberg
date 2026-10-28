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
