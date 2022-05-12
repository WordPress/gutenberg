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
	 * Registered block support styles.
	 *
	 * @var WP_Style_Engine|null
	 */
	private $registered_block_support_styles = array();

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
				'css_vars'     => array(
					'--wp--preset--color--$slug' => 'color',
				),
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
	 * Register action for outputting styles when the class is constructed.
	 */
	public function __construct() {
		$this->enqueue_block_support_styles();
	}

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
	 * @param boolean       $should_return_css_vars Whether to try build and return CSS var values.
	 *
	 * @return array        An array of CSS rules.
	 */
	protected static function get_css( $style_value, $style_definition, $should_return_css_vars ) {
		$rules = array();

		if ( ! $style_value ) {
			return $rules;
		}

		// Before default processing, style definitions could define a callable `value_func` to generate custom CSS rules at this point.
		$style_property = $style_definition['property_key'];

		// Build CSS var values from var:? values, e..g, `var(--wp--css--rule-slug )`
		// Check if the value is a CSS preset and there's a corresponding css_var pattern in the style definition.
		if ( is_string( $style_value ) && strpos( $style_value, 'var:' ) !== false ) {
			if ( $should_return_css_vars && $style_definition['css_vars'] ) {
				foreach ( $style_definition['css_vars'] as $css_var_pattern => $property_key ) {
					$slug = static::get_slug_from_preset_value( $style_value, $property_key );
					if ( $slug ) {
						$css_var                  = strtr(
							$css_var_pattern,
							array( '$slug' => $slug )
						);
						$rules[ $style_property ] = "var($css_var)";
					}
				}
			}
			return $rules;
		}

		// Default rule builder.
		// If the input contains an array, ee assume box model-like properties
		// for styles such as margins and padding.
		if ( is_array( $style_value ) ) {
			foreach ( $style_value as $key => $value ) {
				$rules[ "$style_property-$key" ] = $value;
			}
		} else {
			$rules[ $style_property ] = $style_value;
		}

		return $rules;
	}

	/**
	 * Returns an CSS ruleset.
	 * Styles are bundled based on the instructions in BLOCK_STYLE_DEFINITIONS_METADATA.
	 *
	 * @param array $block_styles An array of styles from a block's attributes.
	 * @param array $options array(
	 *     'enqueue_block_support_styles' => (boolean) Whether to register generated styles and output them together in a style block. A `selector` is required.
	 *     'selector'                     => (string) When a selector is passed, `generate()` will return a full CSS rule `$selector { ...rules }`, otherwise a concatenated string of properties and values.
	 *     'classnames'                   => (boolean) Whether to return classnames. If `true` var:? values will be parsed to return classnames instead of CSS vars. Default is `false`.
	 * );.
	 *
	 * @return array|null array(
	 *     'css'        => (string) A CSS ruleset formatted to be placed in an HTML `style` attribute or tag.  Default is a string of inline styles.
	 *     'classnames' => (string) Classnames separated by a space.
	 * );
	 */
	public function generate( $block_styles, $options ) {
		if ( empty( $block_styles ) || ! is_array( $block_styles ) ) {
			return null;
		}

		$css_rules                               = array();
		$classnames                              = array();
		$should_generate_classnames_from_presets = isset( $options['classnames'] ) && true === $options['classnames'];
		$should_enqueue_block_support_styles     = isset( $options['enqueue_block_support_styles'] ) && true === $options['enqueue_block_support_styles'];

		// Collect CSS and classnames.
		foreach ( self::BLOCK_STYLE_DEFINITIONS_METADATA as $definition_group ) {
			if ( ! $definition_group ) {
				continue;
			}

			foreach ( $definition_group as $style_definition ) {
				$style_value = _wp_array_get( $block_styles, $style_definition['path'], null );

				if ( empty( $style_value ) ) {
					continue;
				}

				// Generate classnames from var:? values.
				if ( $should_generate_classnames_from_presets ) {
					$classnames = array_merge( $classnames, static::get_classnames( $style_value, $style_definition ) );
				}

				$css_rules = array_merge( $css_rules, static::get_css( $style_value, $style_definition, ! $should_generate_classnames_from_presets ) );
			}
		}

		// Build CSS rules output.
		$selector      = isset( $options['selector'] ) ? $options['selector'] : null;
		$css           = array();
		$styles_output = array();

		if ( ! empty( $css_rules ) ) {
			// Generate inline style rules.
			foreach ( $css_rules as $rule => $value ) {
				$filtered_css = esc_html( safecss_filter_attr( "{$rule}: {$value}" ) );
				if ( ! empty( $filtered_css ) ) {
					$css[] = $filtered_css . ';';
				}
			}
		}

		// Return css, if any.
		if ( ! empty( $css ) ) {
			if ( $selector ) {
				$style_block          = "$selector { ";
				$style_block         .= implode( ' ', $css );
				$style_block         .= ' }';
				$styles_output['css'] = $style_block;

				// Enqueue block support styles where there is a selector.
				if ( $should_enqueue_block_support_styles ) {
					if ( isset( $this->registered_block_support_styles[ $selector ] ) ) {
						$css = array_unique( array_merge( $this->registered_block_support_styles[ $selector ], $css ) );
					}
					$this->registered_block_support_styles[ $selector ] = $css;
				}
			} else {
				$styles_output['css'] = implode( ' ', $css );
			}
		}

		// Return classnames, if any.
		if ( ! empty( $classnames ) ) {
			$styles_output['classnames'] = implode( ' ', array_unique( $classnames ) );
		}

		return $styles_output;
	}

	/**
	 * Prints registered styles in the page head or footer.
	 *
	 * @see $this->enqueue_block_support_styles
	 */
	public function output_registered_block_support_styles() {
		if ( empty( $this->registered_block_support_styles ) ) {
			return;
		}

		$output = '';

		foreach ( $this->registered_block_support_styles as $selector => $rules ) {
				$output .= "\t$selector { ";
				$output .= implode( ' ', $rules );
				$output .= " }\n";
		}

		echo "<style>\n$output</style>\n";
	}

	/**
	 * Taken from gutenberg_enqueue_block_support_styles()
	 *
	 * This function takes care of adding inline styles
	 * in the proper place, depending on the theme in use.
	 *
	 * For block themes, it's loaded in the head.
	 * For classic ones, it's loaded in the body
	 * because the wp_head action  happens before
	 * the render_block.
	 *
	 * @see gutenberg_enqueue_block_support_styles()
	 */
	private function enqueue_block_support_styles() {
		$action_hook_name = 'wp_footer';
		if ( wp_is_block_theme() ) {
			$action_hook_name = 'wp_head';
		}
		add_action(
			$action_hook_name,
			array( $this, 'output_registered_block_support_styles' )
		);
	}
}

/**
 * Global public interface method to WP_Style_Engine->generate.
 *
 * Returns an CSS ruleset.
 * Styles are bundled based on the instructions in BLOCK_STYLE_DEFINITIONS_METADATA.
 *
 * @access public
 *
 * @param array $block_styles An array of styles from a block's attributes.
 * @param array $options An array of options to determine the output.
 *
 * @return array|null array(
 *     'styles'     => (string) A CSS ruleset formatted to be placed in an HTML `style` attribute or tag.
 *     'classnames' => (string) Classnames separated by a space.
 * );
 */
function wp_style_engine_generate( $block_styles, $options = array() ) {
	if ( class_exists( 'WP_Style_Engine' ) ) {
		$style_engine = WP_Style_Engine::get_instance();
		return $style_engine->generate( $block_styles, $options );
	}
	return null;
}
