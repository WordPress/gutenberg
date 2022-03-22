<?php
/**
 * WP_Style_Engine class
 *
 * Generates classnames and block styles.
 *
 * @package Gutenberg
 */

/**
 * Singleton class representing the style engine.
 *
 * Consolidates rendering block styles to reduce duplication and streamline
 * CSS styles generation.
 *
 * @since 6.0.0
 */
class WP_Style_Engine_Gutenberg {
	/**
	 * Container for the main instance of the class.
	 *
	 * @since 5.5.0
	 * @var WP_Style_Engine_Gutenberg|null
	 */
	private static $instance = null;

	/**
	 * Style definitions that contain the instructions to
	 * parse/output valid Gutenberg styles from a block's attributes.
	 * For every style definition, the follow properties are valid:
	 *
	 *  - property_key => the key that represents a valid CSS property, e.g., "margin" or "border".
	 *  - value_func   => a function to generate an array of valid CSS rules for a particular style object.
	 *                    For example, `'padding' => 'array( 'top' => '1em' )` will return `array( 'padding-top' => '1em' )`
	 */
	const BLOCK_STYLE_DEFINITIONS_METADATA = array(
		'spacing' => array(
			'padding' => array(
				'property_key' => 'padding',
				'value_func'   => 'gutenberg_get_style_engine_css_box_rules',
			),
			'margin'  => array(
				'property_key' => 'margin',
				'value_func'   => 'gutenberg_get_style_engine_css_box_rules',
			),
		),
	);

	/**
	 * Utility method to retrieve the main instance of the class.
	 *
	 * The instance will be created if it does not exist yet.
	 *
	 * @return WP_Style_Engine_Gutenberg The main instance.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Returns a CSS ruleset based on the instructions in BLOCK_STYLE_DEFINITIONS_METADATA.
	 *
	 * @param string|array  $style_value A single raw Gutenberg style attributes value for a CSS property.
	 * @param array<string> $path        An array of strings representing a path to the style value.
	 *
	 * @return array A CSS ruleset compatible with add_style().
	 */
	protected function get_block_style_css_rules( $style_value, $path ) {
		$style_definition = _wp_array_get( static::BLOCK_STYLE_DEFINITIONS_METADATA, $path, null );

		if ( ! empty( $style_definition ) ) {
			if (
				isset( $style_definition['value_func'] ) &&
				is_callable( $style_definition['value_func'] )
			) {
				return call_user_func( $style_definition['value_func'], $style_value, $style_definition['property_key'] );
			}
		}

		return array();
	}

	/**
	 * Returns an CSS ruleset destined to be inserted in an HTML `style` attribute.
	 * Styles are bundled based on the instructions in BLOCK_STYLE_DEFINITIONS_METADATA.
	 *
	 * @param array         $block_styles An array of styles from a block's attributes.
	 * @param array<string> $path         An array of strings representing a path to the style value.
	 *
	 * @return string A CSS ruleset formatted to be placed in an HTML `style` attribute.
	 */
	public function get_inline_css_from_block_styles( $block_styles, $path ) {
		$output = '';

		if ( empty( $block_styles ) || empty( $path ) ) {
			return $output;
		}

		$style_value = _wp_array_get( $block_styles, $path, null );

		if ( empty( $style_value ) ) {
			return $output;
		}

		$rules = $this->get_block_style_css_rules( $style_value, $path );

		foreach ( $rules as $rule => $value ) {
			$output .= "{$rule}:{$value};";
		}
		return $output;
	}
}

/**
 * Returns a CSS ruleset for box model styles such as margins, padding, and borders.
 *
 * @param string|array $style_value    A single raw Gutenberg style attributes value for a CSS property.
 * @param string       $style_property The CSS property for which we're creating a rule.
 *
 * @return array The class name for the added style.
 */
function gutenberg_get_style_engine_css_box_rules( $style_value, $style_property ) {
	$rules = array();

	if ( ! $style_value ) {
		return $rules;
	}

	if ( is_array( $style_value ) ) {
		foreach ( $style_value as $key => $value ) {
			$rules[ "$style_property-$key" ] = $value;
		}
	} else {
		$rules[ $style_property ] = $style_value;
	}
	return $rules;
}
