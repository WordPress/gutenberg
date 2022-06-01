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
 *
 * This class is for internal core usage and is not supposed to be used by extenders (plugins and/or themes).
 * This is a low-level API that may need to do breaking changes. Please, use gutenberg_style_engine_get_styles instead.
 *
 * @access private
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
	 *  - classnames   => an array of classnames to be returned for block styles. The key is a classname or pattern.
	 *                    A value of `true` means the classname should be applied always. Otherwise a valid CSS property
	 *                    to match the incoming value, e.g., "color" to match var:preset|color|somePresetName.
	 *  - property_key => the key that represents a valid CSS property, e.g., "margin" or "border".
	 *  - path         => a path that accesses the corresponding style value in the block style object.
	 */
	const BLOCK_STYLE_DEFINITIONS_METADATA = array(
		'color'      => array(
			'text'       => array(
				'property_key' => 'color',
				'path'         => array( 'color', 'text' ),
				'classnames'   => array(
					'has-text-color' => true,
					'has-%s-color'   => 'color',
				),
			),
			'background' => array(
				'property_key' => 'background-color',
				'path'         => array( 'color', 'background' ),
				'classnames'   => array(
					'has-background'          => true,
					'has-%s-background-color' => 'color',
				),
			),
			'gradient'   => array(
				'property_key' => 'background',
				'path'         => array( 'color', 'gradient' ),
				'classnames'   => array(
					'has-background'             => true,
					'has-%s-gradient-background' => 'gradient',
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
					'has-%s-font-size' => 'font-size',
				),
			),
			'fontFamily'     => array(
				'property_key' => 'font-family',
				'path'         => array( 'typography', 'fontFamily' ),
				'classnames'   => array(
					'has-%s-font-family' => 'font-family',
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
	 * Extracts the slug in kebab case from a preset string, e.g., "heavenly-blue" from 'var:preset|color|heavenlyBlue'.
	 *
	 * @param string $style_value  A single css preset value.
	 * @param string $property_key The CSS property that is the second element of the preset string. Used for matching.
	 *
	 * @return string|null The slug, or null if not found.
	 */
	protected static function get_slug_from_preset_value( $style_value, $property_key ) {
		if ( is_string( $style_value ) && strpos( $style_value, "var:preset|{$property_key}|" ) !== false ) {
			$index_to_splice = strrpos( $style_value, '|' ) + 1;
			return _wp_to_kebab_case( substr( $style_value, $index_to_splice ) );
		}
		return null;
	}

	/**
	 * Returns classnames, and generates classname(s) from a CSS preset property pattern, e.g., 'var:preset|color|heavenly-blue'.
	 *
	 * @param array         $style_value      A single raw style value or css preset property from the generate() $block_styles array.
	 * @param array<string> $style_definition A single style definition from BLOCK_STYLE_DEFINITIONS_METADATA.
	 *
	 * @return array        An array of CSS classnames.
	 */
	protected static function get_classnames( $style_value, $style_definition ) {
		$classnames = array();
		if ( ! empty( $style_definition['classnames'] ) ) {
			foreach ( $style_definition['classnames'] as $classname => $property_key ) {
				if ( true === $property_key ) {
					$classnames[] = $classname;
				}

				$slug = static::get_slug_from_preset_value( $style_value, $property_key );

				if ( $slug ) {
					// Right now we expect a classname pattern to be stored in BLOCK_STYLE_DEFINITIONS_METADATA.
					// One day, if there are no stored schemata, we could allow custom patterns or
					// generate classnames based on other properties
					// such as a path or a value or a prefix passed in options.
					$classnames[] = sprintf( $classname, $slug );
				}
			}
		}

		return $classnames;
	}

	/**
	 * Returns CSS rules based on valid block style values.
	 *
	 * @param array         $style_value      A single raw style value from the generate() $block_styles array.
	 * @param array<string> $style_definition A single style definition from BLOCK_STYLE_DEFINITIONS_METADATA.
	 *
	 * @return array        An array of CSS rules.
	 */
	protected static function get_css( $style_value, $style_definition ) {
		// Low-specificity check to see if the value is a CSS preset.
		if ( is_string( $style_value ) && strpos( $style_value, 'var:' ) !== false ) {
			return array();
		}

		// If required in the future, style definitions could define a callable `value_func` to generate custom CSS rules.
		return static::get_css_rules( $style_value, $style_definition['property_key'] );
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
				$style_value = _wp_array_get( $block_styles, $style_definition['path'], null );

				if ( empty( $style_value ) ) {
					continue;
				}

				$classnames = array_merge( $classnames, static::get_classnames( $style_value, $style_definition ) );
				$css_rules  = array_merge( $css_rules, static::get_css( $style_value, $style_definition ) );
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
	 * If the input contains an array, it will be treated like a box model
	 * for styles such as margins and padding
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
 * Global public interface method to WP_Style_Engine->generate.
 *
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
function wp_style_engine_generate( $block_styles ) {
	if ( class_exists( 'WP_Style_Engine' ) ) {
		$style_engine = WP_Style_Engine::get_instance();
		return $style_engine->generate( $block_styles );
	}
	return null;
}
