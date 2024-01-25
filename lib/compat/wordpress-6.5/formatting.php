<?php
/**
 * Extensions to the WordPress Formatting API.
 * src/wp-includes/formatting.php
 *
 * @package gutenberg
 */


/**
 * Given a numeric value, returns a rounded a valid CSS <number> as a string.
 * Negative zero values, e.g., `-0.0`, will return "0".
 * See https://developer.mozilla.org/en-US/docs/Web/CSS/number
 * Normalizes LM_NUMERIC locales with non-dot decimal point, e.g., "1,234.56" to "1234.56".
 * The above is relevant to PHP < 8, whose float to string casting is locale-dependent.
 * See https://php.watch/versions/8.0/float-to-string-locale-independent
 *
 * Usage:
 * Call just before constructing the final output of your CSS rules, and after any number-based calculation.
 *
 * $padding_rounded = gutenberg_round_css_value( 20.3566 + 5, array( 'decimal_places' => 1 ) );
 * echo "padding: {$padding_rounded}px;" // "padding: 25.4px;"
 *
 * @param int|string|float $value A CSS <number> data type.
 * @param array            $options {
 *     Optional. An array of options. Default empty array.
 * }
 * @return string A rounded CSS number.
 */
function gutenberg_round_css_value( $value, $options = array() ) {
	if ( is_numeric( $value ) && is_float( floatval( $value ) ) ) {
		$defaults = array(
			'decimal_places' => 3,
		);

		$options     = wp_parse_args( $options, $defaults );
		$value       = number_format( $value, $options['decimal_places'], '.', '' );
		$split_value = explode( '.', $value );
		$is_float    = isset( $split_value[1] ) && intval( $split_value[1] ) > 0;

		return $is_float ? "{$split_value[0]}." . rtrim( $split_value[1], '0' ) : "{$split_value[0]}";
	}

	return $value;
}
