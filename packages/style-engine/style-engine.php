<?php
/**
 * Style engine: Public functions
 *
 * This file contains a variety of public functions developers can use to interact with
 * the Style Engine API.
 *
 * @package Gutenberg
 */

/**
 * Global public interface method to generate styles from a single style object, e.g.,
 * the value of a block's attributes.style object or the top level styles in theme.json.
 * See: https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/theme-json-living/#styles and
 * https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/
 *
 * Example usage:
 *
 * $styles = wp_style_engine_get_styles( array( 'color' => array( 'text' => '#cccccc' ) ) );
 * // Returns `array( 'css' => 'color: #cccccc', 'declarations' => array( 'color' => '#cccccc' ), 'classnames' => 'has-color' )`.
 *
 * @access public
 *
 * @param array                 $block_styles The style object.
 * @param array<string|boolean> $options      array(
 *     'context' => (string|null) An identifier describing the origin of the style object, e.g., 'block-supports' or 'global-styles'. Default is 'block-supports'.
 *                  When set, the style engine will attempt to store the CSS rules, where a selector is also passed.
 *     'convert_vars_to_classnames' => (boolean) Whether to skip converting CSS var:? values to var( --wp--preset--* ) values. Default is `false`.
 *     'selector'                   => (string) When a selector is passed, `generate()` will return a full CSS rule `$selector { ...rules }`, otherwise a concatenated string of properties and values.
 * );.
 *
 * @return array<string|array> array(
 *     'css'          => (string) A CSS ruleset or declarations block formatted to be placed in an HTML `style` attribute or tag.
 *     'declarations' => (array) An array of property/value pairs representing parsed CSS declarations.
 *     'classnames'   => (string) Classnames separated by a space.
 * );
 */
function wp_style_engine_get_styles( $block_styles, $options = array() ) {
	if ( ! class_exists( 'WP_Style_Engine' ) ) {
		return array();
	}

	$options = wp_parse_args(
		$options,
		array(
			'selector'                   => null,
			'context'                    => null,
			'convert_vars_to_classnames' => false,
		)
	);

	$parsed_styles = WP_Style_Engine::parse_block_styles( $block_styles, $options );

	// Output.
	$styles_output = array();

	if ( ! empty( $parsed_styles['declarations'] ) ) {
		$styles_output['css']          = WP_Style_Engine::compile_css( $parsed_styles['declarations'], $options['selector'] );
		$styles_output['declarations'] = $parsed_styles['declarations'];
		if ( ! empty( $options['context'] ) ) {
			WP_Style_Engine::store_css_rule( $options['context'], $options['selector'], $parsed_styles['declarations'] );
		}
	}

	if ( ! empty( $parsed_styles['classnames'] ) ) {
		$styles_output['classnames'] = implode( ' ', array_unique( $parsed_styles['classnames'] ) );
	}

	return array_filter( $styles_output );
}

/**
 * Returns compiled CSS from a collection of selectors and declarations.
 * This won't add to any store, but is useful for returning a compiled style sheet from any CSS selector + declarations combos.
 *
 * @access public
 *
 * @param array<array>  $css_rules array(
 *      array(
 *          'selector'    => (string) A CSS selector.
 *          declarations' => (boolean) An array of CSS definitions, e.g., array( "$property" => "$value" ).
 *      )
 *  );.
 * @param array<string> $options array(
 *     'context' => (string|null) An identifier describing the origin of the style object, e.g., 'block-supports' or 'global-styles'. Default is 'block-supports'.
 *                  When set, the style engine will attempt to store the CSS rules.
 * );.
 *
 * @return string A compiled CSS string.
 */
function wp_style_engine_get_stylesheet_from_css_rules( $css_rules, $options = array() ) {
	if ( ! class_exists( 'WP_Style_Engine' ) || empty( $css_rules ) ) {
		return '';
	}

	$options = wp_parse_args(
		$options,
		array(
			'context' => null,
		)
	);

	$css_rule_objects = array();
	foreach ( $css_rules as $css_rule ) {
		if ( empty( $css_rule['selector'] ) || empty( $css_rule['declarations'] ) || ! is_array( $css_rule['declarations'] ) ) {
			continue;
		}

		if ( ! empty( $options['context'] ) ) {
			WP_Style_Engine::store_css_rule( $options['context'], $css_rule['selector'], $css_rule['declarations'] );
		}

		$css_rule_objects[] = new WP_Style_Engine_CSS_Rule( $css_rule['selector'], $css_rule['declarations'] );
	}

	if ( empty( $css_rule_objects ) ) {
		return '';
	}

	return WP_Style_Engine::compile_stylesheet_from_css_rules( $css_rule_objects );
}

/**
 * Returns compiled CSS from a store, if found.
 *
 * @access public
 *
 * @param string $store_name A valid store name.
 *
 * @return string A compiled CSS string.
 */
function wp_style_engine_get_stylesheet_from_context( $store_name ) {
	if ( ! class_exists( 'WP_Style_Engine' ) || empty( $store_name ) ) {
		return '';
	}

	return WP_Style_Engine::compile_stylesheet_from_css_rules( WP_Style_Engine::get_store( $store_name )->get_all_rules() );
}
