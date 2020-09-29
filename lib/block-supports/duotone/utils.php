<?php

if ( ! function_exists( 'hex2rgb' ) ) {
	/**
	 * Convert a hex color to RGB.
	 *
	 * @param string $color Hex color to convert.
	 *
	 * @return array RGB values of the input color.
	 */
	function hex2rgb( $color ) {
		if ( strlen( $color ) === 4 ) {
			$r = hexdec( substr( $color, 1, 1 ) . substr( $color, 1, 1 ) );
			$g = hexdec( substr( $color, 2, 1 ) . substr( $color, 2, 1 ) );
			$b = hexdec( substr( $color, 3, 1 ) . substr( $color, 3, 1 ) );
		} elseif ( strlen( $color ) === 7 ) {
			$r = hexdec( substr( $color, 1, 2 ) );
			$g = hexdec( substr( $color, 3, 2 ) );
			$b = hexdec( substr( $color, 5, 2 ) );
		} else {
			return array();
		}

		return array(
			'r' => $r / 0xff,
			'g' => $g / 0xff,
			'b' => $b / 0xff,
		);
	}
}

if ( ! function_exists( 'separate_color_components' ) ) {
	/**
	 * Reducer function for separating out the components of an array of colors.
	 *
	 * @param array $carry Intermediate arrays of R, G, and B values.
	 * @param array $item RGB parsed colors.
	 *
	 * @return array Arrays of R, G, and B values.
	 */
	function separate_color_components( $carry, $item ) {
		$carry['r'][] = $item['r'];
		$carry['g'][] = $item['g'];
		$carry['b'][] = $item['b'];
		return $carry;
	}
}
