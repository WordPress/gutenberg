<?php
/**
 * WP_Style_Engine
 *
 * Generates classnames and block styles.
 *
 * @package Gutenberg
 */

if ( class_exists( 'WP_Style_Engine' ) ) {
	return;
}

/**
 * Singleton class representing the style engine.
 *
 * Consolidates rendering block styles to reduce duplication and streamline
 * CSS styles generation.
 */
class WP_Style_Engine {
	/**
	 * Container for the main instance of the class.
	 *
	 * @var WP_Style_Engine|null
	 */
	private static $instance = null;

	/**
	 * Style definitions that contain the instructions to
	 * parse/output valid Gutenberg styles from a block's attributes.
	 * For every style definition, the follow properties are valid:
	 *
	 *  - property_key => the key that represents a valid CSS property, e.g., "margin" or "border".
	 *  - path         => a path that accesses the corresponding style value in the block style object.
	 *  - value_func   => a function to generate an array of valid CSS rules for a particular style object.
	 *                    For example, `'padding' => 'array( 'top' => '1em' )` will return `array( 'padding-top' => '1em' )`
	 */
	const BLOCK_STYLE_DEFINITIONS_METADATA = array(
		'color'      => array(
			'text'       => array(
				'property_key' => 'color',
				'path'         => array( 'color', 'text' ),
				'classnames'   => array(
					'has-text-color' => true,
					'has-%s-color'   => 'slug',
				),
			),
			'background' => array(
				'property_key' => 'background-color',
				'path'         => array( 'color', 'background' ),
				'classnames'   => array(
					'has-background'          => true,
					'has-%s-background-color' => 'slug',
				),
			),
			'gradient'   => array(
				'property_key' => 'background',
				'path'         => array( 'color', 'gradient' ),
				'classnames'   => array(
					'has-background'             => true,
					'has-%s-gradient-background' => 'slug',
				),
			),
		),
		'spacing'    => array(
			'padding' => array(
				'property_key' => 'padding',
				'path'         => array( 'spacing', 'padding' ),
			),
			'margin'  => array(
				'property_key' => 'margin',
				'path'         => array( 'spacing', 'margin' ),
			),
		),
		'typography' => array(
			'fontSize'       => array(
				'property_key' => 'font-size',
				'path'         => array( 'typography', 'fontSize' ),
				'classnames'   => array(
					'has-%s-font-size' => 'slug',
				),
			),
			'fontFamily'     => array(
				'property_key' => 'font-family',
				'path'         => array( 'typography', 'fontFamily' ),
				'classnames'   => array(
					'has-%s-font-family' => 'slug',
				),
			),
			'fontStyle'      => array(
				'property_key' => 'font-style',
				'path'         => array( 'typography', 'fontStyle' ),
			),
			'fontWeight'     => array(
				'property_key' => 'font-weight',
				'path'         => array( 'typography', 'fontWeight' ),
			),
			'lineHeight'     => array(
				'property_key' => 'line-height',
				'path'         => array( 'typography', 'lineHeight' ),
			),
			'textDecoration' => array(
				'property_key' => 'text-decoration',
				'path'         => array( 'typography', 'textDecoration' ),
			),
			'textTransform'  => array(
				'property_key' => 'text-transform',
				'path'         => array( 'typography', 'textTransform' ),
			),
			'letterSpacing'  => array(
				'property_key' => 'letter-spacing',
				'path'         => array( 'typography', 'letterSpacing' ),
			),
		),
	);

	/**
	 * Utility method to retrieve the main instance of the class.
	 *
	 * The instance will be created if it does not exist yet.
	 *
	 * @return WP_Style_Engine The main instance.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Returns a classname.
	 *
	 * @param array         $style            A single raw style from the generate() $block_styles array.
	 * @param array<string> $style_definition A single style definition from BLOCK_STYLE_DEFINITIONS_METADATA.
	 *
	 * @return string A CSS classname.
	 */
	protected static function get_classnames( $style, $style_definition ) {
		$classnames = array();
		// Classnames expect an array value for slug or other metadata required to build the classname.
		if ( ! is_array( $style ) ) {
			return $classnames;
		}

		$required_classnames = array();

		if ( ! empty( $style_definition['classnames'] ) ) {
			foreach ( $style_definition['classnames'] as $classname => $property ) {
				if ( true === $property ) {
					$required_classnames[] = $classname;
				}

				if ( isset( $style[ $property ] ) ) {
					// Right now we expect a classname pattern to be stored in BLOCK_STYLE_DEFINITIONS_METADATA.
					// One day, if there are no stored schemata, we could allow custom patterns or
					// generate classnames based on other properties
					// such as a path or a value or a prefix passed in options.
					$classnames[] = sprintf( $classname, _wp_to_kebab_case( $style[ $property ] ) );
				}
			}
		}

		// Only add the required classnames if there's a valid style value or classname slug.
		if ( ! empty( $required_classnames ) && ( $style['value'] || ! empty( $classnames ) ) ) {
			$classnames = array_merge( $required_classnames, $classnames );
		}

		return $classnames;
	}

	/**
	 * Returns an CSS ruleset.
	 * Styles are bundled based on the instructions in BLOCK_STYLE_DEFINITIONS_METADATA.
	 *
	 * @param array $block_styles An array of styles from a block's attributes.
	 *
	 * @return array|null array(
	 *     'styles'     => (string) A CSS ruleset formatted to be placed in an HTML `style` attribute or tag.
	 *     'classnames' => (string) Classnames separated by a space.
	 * );
	 */
	public function generate( $block_styles ) {
		if ( empty( $block_styles ) || ! is_array( $block_styles ) ) {
			return null;
		}

		$css_rules     = array();
		$classnames    = array();
		$styles_output = array();

		// Collect CSS and classnames.
		foreach ( self::BLOCK_STYLE_DEFINITIONS_METADATA as $definition_group ) {
			foreach ( $definition_group as $style_definition ) {
				$style = _wp_array_get( $block_styles, $style_definition['path'], null );

				if ( empty( $style ) ) {
					continue;
				}

				// If there's no value property, we run with the assumption that $style _is_ the value.
				$style_value = isset( $style['value'] ) ? $style['value'] : $style;

				// If required in the future, style definitions could define a callable `value_func` to generate custom CSS rules.
				if ( ! empty( $style_value ) ) {
					$css_rules = array_merge( $css_rules, static::get_css_rules( $style_value, $style_definition['property_key'] ) );
				}

				$classnames = array_merge( $classnames, static::get_classnames( $style, $style_definition ) );
			}
		}

		// Build CSS rules output.
		$css_output = '';
		if ( ! empty( $css_rules ) ) {
			// Generate inline style rules.
			// In the future there might be a flag in the option to output
			// inline CSS rules (for HTML style attributes) vs selectors + rules for style tags.
			foreach ( $css_rules as $rule => $value ) {
				$filtered_css = esc_html( safecss_filter_attr( "{$rule}: {$value}" ) );
				if ( ! empty( $filtered_css ) ) {
					$css_output .= $filtered_css . '; ';
				}
			}
		}

		if ( ! empty( $css_output ) ) {
			$styles_output['css'] = trim( $css_output );
		}

		if ( ! empty( $classnames ) ) {
			$styles_output['classnames'] = implode( ' ', array_unique( $classnames ) );
		}

		return $styles_output;
	}

	/**
	 * Default style value parser that returns a CSS ruleset.
	 * If the input contains an array, it will treated like a box model
	 * for styles such as margins, padding, and borders
	 *
	 * @param string|array $style_value    A single raw Gutenberg style attributes value for a CSS property.
	 * @param string       $style_property The CSS property for which we're creating a rule.
	 *
	 * @return array The class name for the added style.
	 */
	protected static function get_css_rules( $style_value, $style_property ) {
		$rules = array();

		if ( ! $style_value ) {
			return $rules;
		}

		// We assume box model-like properties.
		if ( is_array( $style_value ) ) {
			foreach ( $style_value as $key => $value ) {
				$rules[ "$style_property-$key" ] = $value;
			}
		} else {
			$rules[ $style_property ] = $style_value;
		}

		return $rules;
	}
}

/**
 * This function returns the Style Engine instance.
 *
 * @return WP_Style_Engine
 */
function wp_get_style_engine() {
	if ( class_exists( 'WP_Style_Engine' ) ) {
		return WP_Style_Engine::get_instance();
	}
}
