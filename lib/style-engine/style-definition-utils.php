<?php
/**
 * WP_Style_Engine class
 *
 * @package Gutenberg
 */

/**
 * Returns a CSS ruleset for box model styles such as margins, padding, and borders.
 *
 * @param string|array $style_value    A single raw Gutenberg style attributes value for a CSS property.
 * @param string       $style_property The CSS property for which we're creating a rule.
 *
 * @return array The class name for the added style.
 */
function gutenberg_get_style_engine_css_box_rules ( $style_value, $style_property ) {
	$rules = array();

	if ( ! $style_value ) {
		return $rules;
	}

	if ( is_array( $style_value ) ) {
		foreach ( $style_value as $key => $value ) {
			$rules[ "$style_property-$key" ] = $value; // . ' !important'; Challenge: deal with specificity that inline styles bring us. Maybe we could pass an option.
		}
	} else {
		$rules[] = sprintf( "$style_property: %s;", $style_value );
	}
	return $rules;
}

