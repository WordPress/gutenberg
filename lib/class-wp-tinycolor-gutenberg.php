<?php
/**
 * WP_Tinycolor class
 * 
 * Partial port of tinycolor2 to PHP for consistency with JS color calculations.
 *
 * @package gutenberg
 * @since 6.3.0
 */

class WP_Tinycolor_Gutenberg {

	/**
	 * RGB(A) associative array.
	 * 
	 * @var array
	 */
	private $rgb;

	/**
	 * Direct port of tinycolor's constructor. No options are currently
	 * supported an most methods are not ported over currently.
	 */
	function __construct( $color, $opts ) {
		$this->rgb = self::string_to_rgb( $color );
	}

	/**
	 * Gets the RGB(A) associative array.
	 * 
	 * @return array RGB(A) associative array.
	 */
	public function to_rgb() {
		return $this->rgb;
	}

	/**
	 * Direct port of tinycolor's bound01 function, lightly simplified to maintain
	 * consistency with tinycolor.
	 *
	 * @see https://github.com/bgrins/TinyColor
	 *
	 * @param  mixed $n   Number of unknown type.
	 * @param  int   $max Upper value of the range to bound to.
	 * @return float      Value in the range [0,1].
	 */
	private static function bound01( $n, $max ) {
		if ( 'string' === gettype( $n ) && str_contains( $n, '.' ) && 1 === (float) $n ) {
			$n = '100%';
		}

		$n = min( $max, max( 0, (float) $n ) );

		// Automatically convert percentage into number.
		if ( 'string' === gettype( $n ) && str_contains( $n, '%' ) ) {
			$n = (int) ( $n * $max ) / 100;
		}

		// Handle floating point rounding errors.
		if ( ( abs( $n - $max ) < 0.000001 ) ) {
			return 1.0;
		}

		// Convert into [0, 1] range if it isn't already.
		return ( $n % $max ) / (float) $max;
	}

	/**
	 * Public version of bound01 that is needed for backwards compatibility,
	 * but should not be used elsewhere.
	 * 
	 * @param  mixed $n   Number of unknown type.
	 * @param  int   $max Upper value of the range to bound to.
	 * @return float      Value in the range [0,1].
	 */
	public static function unstable_bound01( $n, $max ) {
		return self::bound01( $n, $max );
	}

	/**
	 * Direct port of tinycolor's boundAlpha function to maintain consistency with
	 * how tinycolor works.
	 *
	 * @see https://github.com/bgrins/TinyColor
	 *
	 * @param  mixed $n   Number of unknown type.
	 * @return float      Value in the range [0,1].
	 */
	private static function bound_alpha( $n ) {
		if ( is_numeric( $n ) ) {
			$n = (float) $n;
			if ( $n >= 0 && $n <= 1 ) {
				return $n;
			}
		}
		return 1;
	}

	/**
	 * Public version of bound_alpha that is needed for backwards compatibility,
	 * but should not be used elsewhere.
	 * 
	 * @param  mixed $n   Number of unknown type.
	 * @return float      Value in the range [0,1].
	 */
	public static function unstable_bound_alpha( $n ) {
		return self::bound_alpha( $n );
	}

	/**
	 * Round and convert values of an RGB object.
	 *
	 * @see https://github.com/bgrins/TinyColor
	 *
	 * @param  array $rgb_color RGB object.
	 * @return array            Rounded and converted RGB object.
	 */
	private static function rgb_to_rgb( $rgb_color ) {
		return array(
			'r' => gutenberg_tinycolor_bound01( $rgb_color['r'], 255 ) * 255,
			'g' => gutenberg_tinycolor_bound01( $rgb_color['g'], 255 ) * 255,
			'b' => gutenberg_tinycolor_bound01( $rgb_color['b'], 255 ) * 255,
		);
	}

	/**
	 * Public version of rgb_to_rgb that is needed for backwards compatibility,
	 * but should not be used elsewhere.
	 *
	 * @param  array $rgb_color RGB object.
	 * @return array            Rounded and converted RGB object.
	 */
	public static function unstable_rgb_to_rgb( $rgb_color ) {
		return self::rgb_to_rgb( $rgb_color );
	}

	/**
	 * Helper function for hsl to rgb conversion.
	 *
	 * @see https://github.com/bgrins/TinyColor
	 *
	 * @param  float $p first component.
	 * @param  float $q second component.
	 * @param  float $t third component.
	 * @return float    R, G, or B component.
	 */
	private static function hue_to_rgb( $p, $q, $t ) {
		if ( $t < 0 ) {
			++$t;
		}
		if ( $t > 1 ) {
			--$t;
		}
		if ( $t < 1 / 6 ) {
			return $p + ( $q - $p ) * 6 * $t;
		}
		if ( $t < 1 / 2 ) {
			return $q;
		}
		if ( $t < 2 / 3 ) {
			return $p + ( $q - $p ) * ( 2 / 3 - $t ) * 6;
		}
		return $p;
	}

	/**
	 * Public version of hue_to_rgb that is needed for backwards compatibility,
	 * but should not be used elsewhere.
	 *
	 * @param  float $p first component.
	 * @param  float $q second component.
	 * @param  float $t third component.
	 * @return float    R, G, or B component.
	 */
	public static function unstable_hue_to_rgb( $p, $q, $t ) {
		return self::hue_to_rgb( $p, $q, $t );
	}

	/**
	 * Convert an HSL object to an RGB object with converted and rounded values.
	 *
	 * @see https://github.com/bgrins/TinyColor
	 *
	 * @param  array $hsl_color HSL object.
	 * @return array            Rounded and converted RGB object.
	 */
	private static function hsl_to_rgb( $hsl_color ) {
		$h = self::bound01( $hsl_color['h'], 360 );
		$s = self::bound01( $hsl_color['s'], 100 );
		$l = self::bound01( $hsl_color['l'], 100 );

		if ( 0 === $s ) {
			// Achromatic.
			$r = $l;
			$g = $l;
			$b = $l;
		} else {
			$q = $l < 0.5 ? $l * ( 1 + $s ) : $l + $s - $l * $s;
			$p = 2 * $l - $q;
			$r = self::hue_to_rgb( $p, $q, $h + 1 / 3 );
			$g = self::hue_to_rgb( $p, $q, $h );
			$b = self::hue_to_rgb( $p, $q, $h - 1 / 3 );
		}

		return array(
			'r' => $r * 255,
			'g' => $g * 255,
			'b' => $b * 255,
		);
	}

	/**
	 * Public version of hsl_to_rgb that is needed for backwards compatibility,
	 * but should not be used elsewhere.
	 *
	 * @param  array $hsl_color HSL object.
	 * @return array            Rounded and converted RGB object.
	 */
	public static function unstable_hsl_to_rgb( $hsl_color ) {
		return self::hsl_to_rgb( $hsl_color );
	}

	/**
	 * Parses hex, hsl, and rgb CSS strings using the same regex as tinycolor v1.4.2
	 * used in the JavaScript. Only colors output from react-color are implemented.
	 * 
	 * This is mainly simplified from stringInputToObject, but automatically converts
	 * the hsl objects to rgb objects.
	 *
	 * @see https://github.com/bgrins/TinyColor
	 * @see https://github.com/casesandberg/react-color/
	 *
	 * @param  string $color_str CSS color string.
	 * @return array             RGB object.
	 */
	private function string_to_rgb( $color_str ) {
		$color_str = strtolower( trim( $color_str ) );

		$css_integer = '[-\\+]?\\d+%?';
		$css_number  = '[-\\+]?\\d*\\.\\d+%?';

		$css_unit = '(?:' . $css_number . ')|(?:' . $css_integer . ')';

		$permissive_match3 = '[\\s|\\(]+(' . $css_unit . ')[,|\\s]+(' . $css_unit . ')[,|\\s]+(' . $css_unit . ')\\s*\\)?';
		$permissive_match4 = '[\\s|\\(]+(' . $css_unit . ')[,|\\s]+(' . $css_unit . ')[,|\\s]+(' . $css_unit . ')[,|\\s]+(' . $css_unit . ')\\s*\\)?';

		$rgb_regexp = '/^rgb' . $permissive_match3 . '$/';
		if ( preg_match( $rgb_regexp, $color_str, $match ) ) {
			$rgb = gutenberg_tinycolor_rgb_to_rgb(
				array(
					'r' => $match[1],
					'g' => $match[2],
					'b' => $match[3],
				)
			);

			$rgb['a'] = 1;

			return $rgb;
		}

		$rgba_regexp = '/^rgba' . $permissive_match4 . '$/';
		if ( preg_match( $rgba_regexp, $color_str, $match ) ) {
			$rgb = gutenberg_tinycolor_rgb_to_rgb(
				array(
					'r' => $match[1],
					'g' => $match[2],
					'b' => $match[3],
				)
			);

			$rgb['a'] = gutenberg_tinycolor_bound_alpha( $match[4] );

			return $rgb;
		}

		$hsl_regexp = '/^hsl' . $permissive_match3 . '$/';
		if ( preg_match( $hsl_regexp, $color_str, $match ) ) {
			$rgb = gutenberg_tinycolor_hsl_to_rgb(
				array(
					'h' => $match[1],
					's' => $match[2],
					'l' => $match[3],
				)
			);

			$rgb['a'] = 1;

			return $rgb;
		}

		$hsla_regexp = '/^hsla' . $permissive_match4 . '$/';
		if ( preg_match( $hsla_regexp, $color_str, $match ) ) {
			$rgb = gutenberg_tinycolor_hsl_to_rgb(
				array(
					'h' => $match[1],
					's' => $match[2],
					'l' => $match[3],
				)
			);

			$rgb['a'] = gutenberg_tinycolor_bound_alpha( $match[4] );

			return $rgb;
		}

		$hex8_regexp = '/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/';
		if ( preg_match( $hex8_regexp, $color_str, $match ) ) {
			$rgb = gutenberg_tinycolor_rgb_to_rgb(
				array(
					'r' => base_convert( $match[1], 16, 10 ),
					'g' => base_convert( $match[2], 16, 10 ),
					'b' => base_convert( $match[3], 16, 10 ),
				)
			);

			$rgb['a'] = gutenberg_tinycolor_bound_alpha(
				base_convert( $match[4], 16, 10 ) / 255
			);

			return $rgb;
		}

		$hex6_regexp = '/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/';
		if ( preg_match( $hex6_regexp, $color_str, $match ) ) {
			$rgb = gutenberg_tinycolor_rgb_to_rgb(
				array(
					'r' => base_convert( $match[1], 16, 10 ),
					'g' => base_convert( $match[2], 16, 10 ),
					'b' => base_convert( $match[3], 16, 10 ),
				)
			);

			$rgb['a'] = 1;

			return $rgb;
		}

		$hex4_regexp = '/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/';
		if ( preg_match( $hex4_regexp, $color_str, $match ) ) {
			$rgb = gutenberg_tinycolor_rgb_to_rgb(
				array(
					'r' => base_convert( $match[1] . $match[1], 16, 10 ),
					'g' => base_convert( $match[2] . $match[2], 16, 10 ),
					'b' => base_convert( $match[3] . $match[3], 16, 10 ),
				)
			);

			$rgb['a'] = gutenberg_tinycolor_bound_alpha(
				base_convert( $match[4] . $match[4], 16, 10 ) / 255
			);

			return $rgb;
		}

		$hex3_regexp = '/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/';
		if ( preg_match( $hex3_regexp, $color_str, $match ) ) {
			$rgb = gutenberg_tinycolor_rgb_to_rgb(
				array(
					'r' => base_convert( $match[1] . $match[1], 16, 10 ),
					'g' => base_convert( $match[2] . $match[2], 16, 10 ),
					'b' => base_convert( $match[3] . $match[3], 16, 10 ),
				)
			);

			$rgb['a'] = 1;

			return $rgb;
		}

		// The JS color picker considers the string "transparent" to be a hex value,
		// so we need to handle it here as a special case.
		if ( 'transparent' === $color_str ) {
			return array(
				'r' => 0,
				'g' => 0,
				'b' => 0,
				'a' => 0,
			);
		}
	}
}

/**
 * Direct port of tinycolor's bound01 function, lightly simplified to maintain
 * consistency with tinycolor.
 *
 * @see https://github.com/bgrins/TinyColor
 *
 * @since 5.9
 * @deprecated 6.3.0 This function was never intended to be public.
 *
 * @param  mixed $n   Number of unknown type.
 * @param  int   $max Upper value of the range to bound to.
 * @return float      Value in the range [0,1].
 */
function gutenberg_tinycolor_bound01( $n, $max ) {
	return WP_Tinycolor_Gutenberg::unstable_bound01( $n, $max );
}

/**
 * Direct port of tinycolor's boundAlpha function to maintain consistency with
 * how tinycolor works.
 *
 * @see https://github.com/bgrins/TinyColor
 *
 * @since 5.9
 * @deprecated 6.3.0 This function was never intended to be public.
 *
 * @param  mixed $n   Number of unknown type.
 * @return float      Value in the range [0,1].
 */
function gutenberg_tinycolor_bound_alpha( $n ) {
	return WP_Tinycolor_Gutenberg::unstable_bound_alpha( $n );
}

/**
 * Round and convert values of an RGB object.
 *
 * @see https://github.com/bgrins/TinyColor
 *
 * @since 5.9
 * @deprecated 6.3.0 This function was never intended to be public.
 *
 * @param  array $rgb_color RGB object.
 * @return array            Rounded and converted RGB object.
 */
function gutenberg_tinycolor_rgb_to_rgb( $rgb_color ) {
	return WP_Tinycolor_Gutenberg::unstable_rgb_to_rgb( $rgb_color );
}

/**
 * Helper function for hsl to rgb conversion.
 *
 * @see https://github.com/bgrins/TinyColor
 *
 * @since 5.9
 * @deprecated 6.3.0 This function was never intended to be public.
 *
 * @param  float $p first component.
 * @param  float $q second component.
 * @param  float $t third component.
 * @return float    R, G, or B component.
 */
function gutenberg_tinycolor_hue_to_rgb( $p, $q, $t ) {
	return WP_Tinycolor_Gutenberg::unstable_hue_to_rgb( $p, $q, $t );
}

/**
 * Convert an HSL object to an RGB object with converted and rounded values.
 *
 * @see https://github.com/bgrins/TinyColor
 *
 * @since 5.9
 * @deprecated 6.3.0 This function was never intended to be public.
 *
 * @param  array $hsl_color HSL object.
 * @return array            Rounded and converted RGB object.
 */
function gutenberg_tinycolor_hsl_to_rgb( $hsl_color ) {
	return WP_Tinycolor_Gutenberg::unstable_hsl_to_rgb( $hsl_color );
}

/**
 * Parses hex, hsl, and rgb CSS strings using the same regex as tinycolor v1.4.2
 * used in the JavaScript. Only colors output from react-color are implemented.
 * 
 * @see https://github.com/bgrins/TinyColor
 * @see https://github.com/casesandberg/react-color/
 *
 * @since 5.9
 * @deprecated 6.3.0 Use the WP_Tinycolor class and the to_rgb method on it.
 *
 * @param  string $color_str CSS color string.
 * @return array             RGB object.
 */
function gutenberg_tinycolor_string_to_rgb( $color_str ) {
	$tinycolor = new WP_Tinycolor_Gutenberg( $color_str );
	return $tinycolor->to_rgb();
}
