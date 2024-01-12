<?php
/**
 * Extensions to the WordPress Formatting API.
 * src/wp-includes/formatting.php
 *
 * @package gutenberg
 */


/**
 * Given a numeric value, returns a rounded float as a string.
 * Takes into account active LM_NUMERIC locales with non-dot decimal point (`localeconv()['decimal_point']`);
 * Negative zero values, e.g., `-0.0`, will return "0"
 *
 * @param {int|string|float} $value          A CSS <number> data type.
 *                                           See https://developer.mozilla.org/en-US/docs/Web/CSS/number
 * @param  {int}             $decimal_places The number of decimal places to output. `0` === remove all decimals.
 * @return {string?}         A rounded value with any decimal commas stripped.
 *
 */
function wp_round_css_value( $value, $options ) {
	if ( is_numeric( $value ) && is_float( floatval( $value ) ) ) {
		$defaults = array(
			'decimal_places'   => 3,
		);

		$options = wp_parse_args( $options, $defaults );

		// Rounding.
		$value = round( $value, $options['decimal_places'] );

		/*
		 * Save a negative sign for later.
		 * When splitting int and float, we want to preserve the negativity of the int
		 * for values such as `-0.2`. Coercing $value to int will return `0`.
		 */
		$negative_sign = $value < 0 ? '-' : '';

		// Get the floating point remainder.
		$decimal = fmod( $value, 1 );

		// Turn the decimal fragment into a positve integer and remove any trailing zeros.
		$decimal *= pow( 10, $options['decimal_places'] );
		$decimal = abs( $decimal );
		$decimal = rtrim( $decimal, '0' );

		// Now get the whole, positive integer value (the left hand side of the float before the decimal).
		$whole = (int) abs( $value );

		return $decimal > 0 ? "{$negative_sign}{$whole}.{$decimal}" : "{$negative_sign}{$whole}";
	}

	return $value;
}
