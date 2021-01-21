<?php
/**
 * Process of structures that adhere to the theme.json schema.
 *
 * @package gutenberg
 */

/**
 * Class that encapsulates the processing of
 * structures that adhere to the theme.json spec.
 */
class WP_Theme_JSON {

	/**
	 * Container of data in theme.json format.
	 *
	 * @var array
	 */
	private $contexts = null;

	/**
	 * Holds block metadata extracted from block.json
	 * to be shared among all instances so we don't
	 * process it twice.
	 *
	 * @var array
	 */
	private static $blocks_metadata = null;

	/**
	 * The name of the global context.
	 *
	 * @var string
	 */
	const GLOBAL_NAME = 'global';

	/**
	 * The CSS selector for the global context.
	 *
	 * @var string
	 */
	const GLOBAL_SELECTOR = ':root';

	/**
	 * The supported properties of the global context.
	 *
	 * @var array
	 */
	const GLOBAL_SUPPORTS = array(
		'--wp--style--color--link',
		'background',
		'backgroundColor',
		'border',
		'color',
		'fontFamily',
		'fontSize',
		'fontStyle',
		'fontWeight',
		'lineHeight',
		'textDecoration',
		'textTransform',
	);

	/**
	 * Data schema of each context within a theme.json.
	 *
	 * Example:
	 *
	 * {
	 *   'context-one': {
	 *     'styles': {
	 *       'color': {
	 *         'background': 'color'
	 *       }
	 *     },
	 *     'settings': {
	 *       'color': {
	 *         'custom': true
	 *       }
	 *     }
	 *   },
	 *   'context-two': {
	 *     'styles': {
	 *       'color': {
	 *         'link': 'color'
	 *       }
	 *     }
	 *   }
	 * }
	 */
	const SCHEMA = array(
		'styles'   => array(
			'border'     => array(
				'radius' => null,
			),
			'color'      => array(
				'background' => null,
				'gradient'   => null,
				'link'       => null,
				'text'       => null,
			),
			'spacing'    => array(
				'padding' => array(
					'top'    => null,
					'right'  => null,
					'bottom' => null,
					'left'   => null,
				),
			),
			'typography' => array(
				'fontFamily'     => null,
				'fontSize'       => null,
				'fontStyle'      => null,
				'fontWeight'     => null,
				'lineHeight'     => null,
				'textDecoration' => null,
				'textTransform'  => null,
			),
		),
		'settings' => array(
			'border'     => array(
				'customRadius' => null,
			),
			'color'      => array(
				'custom'         => null,
				'customGradient' => null,
				'gradients'      => null,
				'link'           => null,
				'palette'        => null,
			),
			'spacing'    => array(
				'customPadding' => null,
				'units'         => null,
			),
			'typography' => array(
				'customFontSize'        => null,
				'customLineHeight'      => null,
				'dropCap'               => null,
				'fontFamilies'          => null,
				'fontSizes'             => null,
				'customFontStyle'       => null,
				'customFontWeight'      => null,
				'customTextDecorations' => null,
				'customTextTransforms'  => null,
			),
			'custom'     => null,
		),
	);

	/**
	 * Presets are a set of values that serve
	 * to bootstrap some styles: colors, font sizes, etc.
	 *
	 * They are a unkeyed array of values such as:
	 *
	 * ```php
	 * array(
	 *   array(
	 *     'slug'      => 'unique-name-within-the-set',
	 *     'name'      => 'Name for the UI',
	 *     <value_key> => 'value'
	 *   ),
	 * )
	 * ```
	 *
	 * This contains the necessary metadata to process them:
	 *
	 * - path          => where to find the preset in a theme.json context
	 *
	 * - value_key     => the key that represents the value
	 *
	 * - css_var_infix => infix to use in generating the CSS Custom Property. Example:
	 *                   --wp--preset--<preset_infix>--<slug>: <preset_value>
	 *
	 * - classes      => array containing a structure with the classes to
	 *                   generate for the presets. Each class should have
	 *                   the class suffix and the property name. Example:
	 *
	 *                   .has-<slug>-<class_suffix> {
	 *                       <property_name>: <preset_value>
	 *                   }
	 */
	const PRESETS_METADATA = array(
		array(
			'path'          => array( 'settings', 'color', 'palette' ),
			'value_key'     => 'color',
			'css_var_infix' => 'color',
			'classes'       => array(
				array(
					'class_suffix'  => 'color',
					'property_name' => 'color',
				),
				array(
					'class_suffix'  => 'background-color',
					'property_name' => 'background-color',
				),
			),
		),
		array(
			'path'          => array( 'settings', 'color', 'gradients' ),
			'value_key'     => 'gradient',
			'css_var_infix' => 'gradient',
			'classes'       => array(
				array(
					'class_suffix'  => 'gradient-background',
					'property_name' => 'background',
				),
			),
		),
		array(
			'path'          => array( 'settings', 'typography', 'fontSizes' ),
			'value_key'     => 'size',
			'css_var_infix' => 'font-size',
			'classes'       => array(
				array(
					'class_suffix'  => 'font-size',
					'property_name' => 'font-size',
				),
			),
		),
		array(
			'path'          => array( 'settings', 'typography', 'fontFamilies' ),
			'value_key'     => 'fontFamily',
			'css_var_infix' => 'font-family',
			'classes'       => array(),
		),
	);

	/**
	 * Metadata for style properties.
	 *
	 * Each property declares:
	 *
	 * - 'value': path to the value in theme.json and block attributes.
	 * - 'support': path to the block support in block.json.
	 */
	const PROPERTIES_METADATA = array(
		'--wp--style--color--link' => array(
			'value'   => array( 'color', 'link' ),
			'support' => array( 'color', 'link' ),
		),
		'background'               => array(
			'value'   => array( 'color', 'gradient' ),
			'support' => array( 'color', 'gradients' ),
		),
		'backgroundColor'          => array(
			'value'   => array( 'color', 'background' ),
			'support' => array( 'color' ),
		),
		'borderRadius'             => array(
			'value'   => array( 'border', 'radius' ),
			'support' => array( '__experimentalBorder', 'radius' ),
		),
		'color'                    => array(
			'value'   => array( 'color', 'text' ),
			'support' => array( 'color' ),
		),
		'fontFamily'               => array(
			'value'   => array( 'typography', 'fontFamily' ),
			'support' => array( '__experimentalFontFamily' ),
		),
		'fontSize'                 => array(
			'value'   => array( 'typography', 'fontSize' ),
			'support' => array( 'fontSize' ),
		),
		'fontStyle'                => array(
			'value'   => array( 'typography', 'fontStyle' ),
			'support' => array( '__experimentalFontStyle' ),
		),
		'fontWeight'               => array(
			'value'   => array( 'typography', 'fontWeight' ),
			'support' => array( '__experimentalFontWeight' ),
		),
		'lineHeight'               => array(
			'value'   => array( 'typography', 'lineHeight' ),
			'support' => array( 'lineHeight' ),
		),
		'padding'                  => array(
			'value'      => array( 'spacing', 'padding' ),
			'support'    => array( 'spacing', 'padding' ),
			'properties' => array( 'top', 'right', 'bottom', 'left' ),
		),
		'textDecoration'           => array(
			'value'   => array( 'typography', 'textDecoration' ),
			'support' => array( '__experimentalTextDecoration' ),
		),
		'textTransform'            => array(
			'value'   => array( 'typography', 'textTransform' ),
			'support' => array( '__experimentalTextTransform' ),
		),
	);

	/**
	 * Constructor.
	 *
	 * @param array   $contexts A structure that follows the theme.json schema.
	 * @param boolean $should_escape_styles Whether the incoming styles should be escaped.
	 */
	public function __construct( $contexts = array(), $should_escape_styles = false ) {
		$this->contexts = array();

		if ( ! is_array( $contexts ) ) {
			return;
		}

		$metadata = $this->get_blocks_metadata();
		foreach ( $contexts as $key => $context ) {
			if ( ! isset( $metadata[ $key ] ) ) {
				// Skip incoming contexts that can't be found
				// within the contexts registered.
				continue;
			}

			// Filter out top-level keys that aren't valid according to the schema.
			$context = array_intersect_key( $context, self::SCHEMA );

			// Process styles subtree.
			$this->process_key( 'styles', $context, self::SCHEMA );
			if ( isset( $context['styles'] ) ) {
				$this->process_key( 'border', $context['styles'], self::SCHEMA['styles'], $should_escape_styles );
				$this->process_key( 'color', $context['styles'], self::SCHEMA['styles'], $should_escape_styles );
				$this->process_key( 'spacing', $context['styles'], self::SCHEMA['styles'], $should_escape_styles );
				$this->process_key( 'typography', $context['styles'], self::SCHEMA['styles'], $should_escape_styles );

				if ( empty( $context['styles'] ) ) {
					unset( $context['styles'] );
				} else {
					$this->contexts[ $key ]['styles'] = $context['styles'];
				}
			}

			// Process settings subtree.
			$this->process_key( 'settings', $context, self::SCHEMA );
			if ( isset( $context['settings'] ) ) {
				$this->process_key( 'border', $context['settings'], self::SCHEMA['settings'] );
				$this->process_key( 'color', $context['settings'], self::SCHEMA['settings'] );
				$this->process_key( 'spacing', $context['settings'], self::SCHEMA['settings'] );
				$this->process_key( 'typography', $context['settings'], self::SCHEMA['settings'] );

				if ( empty( $context['settings'] ) ) {
					unset( $context['settings'] );
				} else {
					$this->contexts[ $key ]['settings'] = $context['settings'];
				}
			}
		}
	}

	/**
	 * Returns a mapping on metadata properties to avoid having to constantly
	 * transforms properties between camel case and kebab.
	 *
	 * @return array Containing three mappings
	 *  "to_kebab_case" mapping properties in camel case to
	 *    properties in kebab case e.g: "paddingTop" to "padding-top".
	 *  "to_camel_case" mapping properties in kebab case to
	 *    properties in camel case e.g: "padding-top" to "paddingTop".
	 *  "to_property" mapping properties in kebab case to
	 *    the main properties in camel case e.g: "padding-top" to "padding".
	 */
	private static function get_properties_metadata_case_mappings() {
		static $properties_metadata_case_mappings;
		if ( null === $properties_metadata_case_mappings ) {
			$properties_metadata_case_mappings = array(
				'to_kebab_case' => array(),
				'to_camel_case' => array(),
				'to_property'   => array(),
			);
			foreach ( self::PROPERTIES_METADATA as $key => $metadata ) {
				$kebab_case = strtolower( preg_replace( '/(?<!^)[A-Z]/', '-$0', $key ) );
				$properties_metadata_case_mappings['to_kebab_case'][ $key ]        = $kebab_case;
				$properties_metadata_case_mappings['to_camel_case'][ $kebab_case ] = $key;
				$properties_metadata_case_mappings['to_property'][ $kebab_case ]   = $key;
				if ( self::has_properties( $metadata ) ) {
					foreach ( $metadata['properties'] as $property ) {
						$camel_case = $key . ucfirst( $property );
						$kebab_case = strtolower( preg_replace( '/(?<!^)[A-Z]/', '-$0', $camel_case ) );
						$properties_metadata_case_mappings['to_kebab_case'][ $camel_case ] = $kebab_case;
						$properties_metadata_case_mappings['to_camel_case'][ $kebab_case ] = $camel_case;
						$properties_metadata_case_mappings['to_property'][ $kebab_case ]   = $key;
					}
				}
			}
		}
		return $properties_metadata_case_mappings;
	}

	/**
	 * Returns the metadata for each block.
	 *
	 * Example:
	 *
	 * {
	 *   'global': {
	 *     'selector': ':root'
	 *     'supports': [ 'fontSize', 'backgroundColor' ],
	 *   },
	 *   'core/heading/h1': {
	 *     'selector': 'h1'
	 *     'supports': [ 'fontSize', 'backgroundColor' ],
	 *   }
	 * }
	 *
	 * @return array Block metadata.
	 */
	private static function get_blocks_metadata() {
		if ( null !== self::$blocks_metadata ) {
			return self::$blocks_metadata;
		}

		self::$blocks_metadata = array(
			self::GLOBAL_NAME => array(
				'selector' => self::GLOBAL_SELECTOR,
				'supports' => self::GLOBAL_SUPPORTS,
			),
		);

		$registry = WP_Block_Type_Registry::get_instance();
		$blocks   = $registry->get_all_registered();
		foreach ( $blocks as $block_name => $block_type ) {
			/*
			 * Skips blocks that don't declare support,
			 * they don't generate styles.
			 */
			if (
				! property_exists( $block_type, 'supports' ) ||
				! is_array( $block_type->supports ) ||
				empty( $block_type->supports )
			) {
				continue;
			}

			/*
			 * Extract block support keys that are related to the style properties.
			 */
			$block_supports = array();
			foreach ( self::PROPERTIES_METADATA as $key => $metadata ) {
				if ( gutenberg_experimental_get( $block_type->supports, $metadata['support'] ) ) {
					$block_supports[] = $key;
				}
			}

			/*
			 * Skip blocks that don't support anything related to styles.
			 */
			if ( empty( $block_supports ) ) {
				continue;
			}

			/*
			 * Assign the selector for the block.
			 *
			 * Some blocks can declare multiple selectors:
			 *
			 * - core/heading represents the H1-H6 HTML elements
			 * - core/list represents the UL and OL HTML elements
			 * - core/group is meant to represent DIV and other HTML elements
			 *
			 * Some other blocks don't provide a selector,
			 * so we generate a class for them based on their name:
			 *
			 * - 'core/group' => '.wp-block-group'
			 * - 'my-custom-library/block-name' => '.wp-block-my-custom-library-block-name'
			 *
			 * Note that, for core blocks, we don't add the `core/` prefix to its class name.
			 * This is for historical reasons, as they come with a class without that infix.
			 *
			 */
			if (
				isset( $block_type->supports['__experimentalSelector'] ) &&
				is_string( $block_type->supports['__experimentalSelector'] )
			) {
				self::$blocks_metadata[ $block_name ] = array(
					'selector' => $block_type->supports['__experimentalSelector'],
					'supports' => $block_supports,
				);
			} elseif (
				isset( $block_type->supports['__experimentalSelector'] ) &&
				is_array( $block_type->supports['__experimentalSelector'] )
			) {
				foreach ( $block_type->supports['__experimentalSelector'] as $key => $selector_metadata ) {
					if ( ! isset( $selector_metadata['selector'] ) ) {
						continue;
					}

					self::$blocks_metadata[ $key ] = array(
						'selector' => $selector_metadata['selector'],
						'supports' => $block_supports,
					);
				}
			} else {
				self::$blocks_metadata[ $block_name ] = array(
					'selector' => '.wp-block-' . str_replace( '/', '-', str_replace( 'core/', '', $block_name ) ),
					'supports' => $block_supports,
				);
			}
		}

		return self::$blocks_metadata;
	}

	/**
	 * Normalize the subtree according to the given schema.
	 * This function modifies the given input by removing
	 * the nodes that aren't valid per the schema.
	 *
	 * @param string  $key Key of the subtree to normalize.
	 * @param array   $input Whole tree to normalize.
	 * @param array   $schema Schema to use for normalization.
	 * @param boolean $should_escape Whether the subproperties should be escaped.
	 */
	private static function process_key( $key, &$input, $schema, $should_escape = false ) {
		if ( ! isset( $input[ $key ] ) ) {
			return;
		}

		// Consider valid the input value.
		if ( null === $schema[ $key ] ) {
			return;
		}

		if ( ! is_array( $input[ $key ] ) ) {
			unset( $input[ $key ] );
			return;
		}

		$input[ $key ] = array_intersect_key(
			$input[ $key ],
			$schema[ $key ]
		);

		if ( $should_escape ) {
			$subtree = $input[ $key ];
			foreach ( $subtree as $property => $value ) {
				$name = 'background-color';
				if ( 'gradient' === $property ) {
					$name = 'background';
				}

				if ( is_array( $value ) ) {
					$result = array();
					foreach ( $value as $subproperty => $subvalue ) {
						$result_subproperty = safecss_filter_attr( "$name: $subvalue" );
						if ( '' !== $result_subproperty ) {
							$result[ $subproperty ] = $result_subproperty;
						}
					}

					if ( empty( $result ) ) {
						unset( $input[ $key ][ $property ] );
					}
				} else {
					$result = safecss_filter_attr( "$name: $value" );

					if ( '' === $result ) {
						unset( $input[ $key ][ $property ] );
					}
				}
			}
		}

		if ( 0 === count( $input[ $key ] ) ) {
			unset( $input[ $key ] );
		}
	}

	/**
	 * Given a context, it returns its settings subtree.
	 *
	 * @param array $context Context adhering to the theme.json schema.
	 *
	 * @return array|null The settings subtree.
	 */
	private static function extract_settings( $context ) {
		if ( empty( $context['settings'] ) ) {
			return null;
		}

		return $context['settings'];
	}

	/**
	 * Given a tree, it creates a flattened one
	 * by merging the keys and binding the leaf values
	 * to the new keys.
	 *
	 * It also transforms camelCase names into kebab-case
	 * and substitutes '/' by '-'.
	 *
	 * This is thought to be useful to generate
	 * CSS Custom Properties from a tree,
	 * although there's nothing in the implementation
	 * of this function that requires that format.
	 *
	 * For example, assuming the given prefix is '--wp'
	 * and the token is '--', for this input tree:
	 *
	 * {
	 *   'some/property': 'value',
	 *   'nestedProperty': {
	 *     'sub-property': 'value'
	 *   }
	 * }
	 *
	 * it'll return this output:
	 *
	 * {
	 *   '--wp--some-property': 'value',
	 *   '--wp--nested-property--sub-property': 'value'
	 * }
	 *
	 * @param array  $tree Input tree to process.
	 * @param string $prefix Prefix to prepend to each variable. '' by default.
	 * @param string $token Token to use between levels. '--' by default.
	 *
	 * @return array The flattened tree.
	 */
	private static function flatten_tree( $tree, $prefix = '', $token = '--' ) {
		$result = array();
		foreach ( $tree as $property => $value ) {
			$new_key = $prefix . str_replace(
				'/',
				'-',
				strtolower( preg_replace( '/(?<!^)[A-Z]/', '-$0', $property ) ) // CamelCase to kebab-case.
			);

			if ( is_array( $value ) ) {
				$new_prefix = $new_key . $token;
				$result     = array_merge(
					$result,
					self::flatten_tree( $value, $new_prefix, $token )
				);
			} else {
				$result[ $new_key ] = $value;
			}
		}
		return $result;
	}

	/**
	 * Returns the style property for the given path.
	 *
	 * It also converts CSS Custom Property stored as
	 * "var:preset|color|secondary" to the form
	 * "--wp--preset--color--secondary".
	 *
	 * @param array $styles Styles subtree.
	 * @param array $path Which property to process.
	 *
	 * @return string Style property value.
	 */
	private static function get_property_value( $styles, $path ) {
		$value = gutenberg_experimental_get( $styles, $path, '' );

		if ( '' === $value ) {
			return $value;
		}

		$prefix     = 'var:';
		$prefix_len = strlen( $prefix );
		$token_in   = '|';
		$token_out  = '--';
		if ( 0 === strncmp( $value, $prefix, $prefix_len ) ) {
			$unwrapped_name = str_replace(
				$token_in,
				$token_out,
				substr( $value, $prefix_len )
			);
			$value          = "var(--wp--$unwrapped_name)";
		}

		return $value;
	}

	/**
	 * Whether the medatata contains a key named properties.
	 *
	 * @param array $metadata Description of the style property.
	 *
	 * @return boolean True if properties exists, false otherwise.
	 */
	private static function has_properties( $metadata ) {
		if ( array_key_exists( 'properties', $metadata ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Given a context, it extracts the style properties
	 * and adds them to the $declarations array following the format:
	 *
	 * ```php
	 * array(
	 *   'name'  => 'property_name',
	 *   'value' => 'property_value,
	 * )
	 * ```
	 *
	 * Note that this modifies the $declarations in place.
	 *
	 * @param array $declarations     Holds the existing declarations.
	 * @param array $context Input    context to process.
	 * @param array $context_supports Supports information for this context.
	 */
	private static function compute_style_properties( &$declarations, $context, $context_supports ) {
		if ( empty( $context['styles'] ) ) {
			return;
		}
		$metadata_mappings = self::get_properties_metadata_case_mappings();
		$properties        = array();
		foreach ( self::PROPERTIES_METADATA as $name => $metadata ) {
			if ( ! in_array( $name, $context_supports, true ) ) {
				continue;
			}

			// Some properties can be shorthand properties, meaning that
			// they contain multiple values instead of a single one.
			if ( self::has_properties( $metadata ) ) {
				foreach ( $metadata['properties'] as $property ) {
					$properties[] = array(
						'name'  => $name . ucfirst( $property ),
						'value' => array_merge( $metadata['value'], array( $property ) ),
					);
				}
			} else {
				$properties[] = array(
					'name'  => $name,
					'value' => $metadata['value'],
				);
			}
		}

		foreach ( $properties as $prop ) {
			$value = self::get_property_value( $context['styles'], $prop['value'] );
			if ( ! empty( $value ) ) {
				$kebab_cased_name = $metadata_mappings['to_kebab_case'][ $prop['name'] ];
				$declarations[]   = array(
					'name'  => $kebab_cased_name,
					'value' => $value,
				);
			}
		}
	}

	/**
	 * Given a context, it extracts its presets
	 * and adds them to the given input $stylesheet.
	 *
	 * Note this function modifies $stylesheet in place.
	 *
	 * @param string $stylesheet Input stylesheet to add the presets to.
	 * @param array  $context Context to process.
	 * @param string $selector Selector wrapping the classes.
	 */
	private static function compute_preset_classes( &$stylesheet, $context, $selector ) {
		if ( self::GLOBAL_SELECTOR === $selector ) {
			// Classes at the global level do not need any CSS prefixed,
			// and we don't want to increase its specificity.
			$selector = '';
		}

		foreach ( self::PRESETS_METADATA as $preset ) {
			$values = gutenberg_experimental_get( $context, $preset['path'], array() );
			foreach ( $values as $value ) {
				foreach ( $preset['classes'] as $class ) {
					$stylesheet .= self::to_ruleset(
						$selector . '.has-' . $value['slug'] . '-' . $class['class_suffix'],
						array(
							array(
								'name'  => $class['property_name'],
								'value' => $value[ $preset['value_key'] ],
							),
						)
					);
				}
			}
		}
	}

	/**
	 * Given a context, it extracts the CSS Custom Properties
	 * for the presets and adds them to the $declarations array
	 * following the format:
	 *
	 * ```php
	 * array(
	 *   'name'  => 'property_name',
	 *   'value' => 'property_value,
	 * )
	 * ```
	 *
	 * Note that this modifies the $declarations in place.
	 *
	 * @param array $declarations Holds the existing declarations.
	 * @param array $context Input context to process.
	 */
	private static function compute_preset_vars( &$declarations, $context ) {
		foreach ( self::PRESETS_METADATA as $preset ) {
			$values = gutenberg_experimental_get( $context, $preset['path'], array() );
			foreach ( $values as $value ) {
				$declarations[] = array(
					'name'  => '--wp--preset--' . $preset['css_var_infix'] . '--' . $value['slug'],
					'value' => $value[ $preset['value_key'] ],
				);
			}
		}
	}

	/**
	 * Given a context, it extracts the CSS Custom Properties
	 * for the custom values and adds them to the $declarations
	 * array following the format:
	 *
	 * ```php
	 * array(
	 *   'name'  => 'property_name',
	 *   'value' => 'property_value,
	 * )
	 * ```
	 *
	 * Note that this modifies the $declarations in place.
	 *
	 * @param array $declarations Holds the existing declarations.
	 * @param array $context Input context to process.
	 */
	private static function compute_theme_vars( &$declarations, $context ) {
		$custom_values = gutenberg_experimental_get( $context, array( 'settings', 'custom' ) );
		$css_vars      = self::flatten_tree( $custom_values );
		foreach ( $css_vars as $key => $value ) {
			$declarations[] = array(
				'name'  => '--wp--custom--' . $key,
				'value' => $value,
			);
		}
	}

	/**
	 * Given a selector and a declaration list,
	 * creates the corresponding ruleset.
	 *
	 * To help debugging, will add some space
	 * if SCRIPT_DEBUG is defined and true.
	 *
	 * @param string $selector CSS selector.
	 * @param array  $declarations List of declarations.
	 *
	 * @return string CSS ruleset.
	 */
	private static function to_ruleset( $selector, $declarations ) {
		if ( empty( $declarations ) ) {
			return '';
		}
		$ruleset = '';

		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			$declaration_block = array_reduce(
				$declarations,
				function ( $carry, $element ) {
					return $carry .= "\t" . $element['name'] . ': ' . $element['value'] . ";\n"; },
				''
			);
			$ruleset          .= $selector . " {\n" . $declaration_block . "}\n";
		} else {
			$declaration_block = array_reduce(
				$declarations,
				function ( $carry, $element ) {
					return $carry .= $element['name'] . ': ' . $element['value'] . ';'; },
				''
			);
			$ruleset          .= $selector . '{' . $declaration_block . '}';
		}

		return $ruleset;
	}

	/**
	 * Converts each context into a list of rulesets
	 * to be appended to the stylesheet.
	 * These rulesets contain all the css variables (custom variables and preset variables).
	 *
	 * See glossary at https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax
	 *
	 * For each context this creates a new ruleset such as:
	 *
	 *   context-selector {
	 *     --wp--preset--category--slug: value;
	 *     --wp--custom--variable: value;
	 *   }
	 *
	 * @return string The new stylesheet.
	 */
	private function get_css_variables() {
		$stylesheet = '';
		$metadata   = $this->get_blocks_metadata();
		foreach ( $this->contexts as $context_name => $context ) {
			if ( empty( $metadata[ $context_name ]['selector'] ) ) {
				continue;
			}
			$selector = $metadata[ $context_name ]['selector'];

			$declarations = array();
			self::compute_preset_vars( $declarations, $context );
			self::compute_theme_vars( $declarations, $context );

			// Attach the ruleset for style and custom properties.
			$stylesheet .= self::to_ruleset( $selector, $declarations );
		}
		return $stylesheet;
	}

	/**
	 * Converts each context into a list of rulesets
	 * containing the block styles to be appended to the stylesheet.
	 *
	 * See glossary at https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax
	 *
	 * For each context this creates a new ruleset such as:
	 *
	 *   context-selector {
	 *     style-property-one: value;
	 *   }
	 *
	 * Additionally, it'll also create new rulesets
	 * as classes for each preset value such as:
	 *
	 *   .has-value-color {
	 *     color: value;
	 *   }
	 *
	 *   .has-value-background-color {
	 *     background-color: value;
	 *   }
	 *
	 *   .has-value-font-size {
	 *     font-size: value;
	 *   }
	 *
	 *   .has-value-gradient-background {
	 *     background: value;
	 *   }
	 *
	 *   p.has-value-gradient-background {
	 *     background: value;
	 *   }
	 *
	 * @return string The new stylesheet.
	 */
	private function get_block_styles() {
		$stylesheet = '';
		$metadata   = $this->get_blocks_metadata();
		foreach ( $this->contexts as $context_name => $context ) {
			if ( empty( $metadata[ $context_name ]['selector'] ) || empty( $metadata[ $context_name ]['supports'] ) ) {
				continue;
			}
			$selector = $metadata[ $context_name ]['selector'];
			$supports = $metadata[ $context_name ]['supports'];

			$declarations = array();
			self::compute_style_properties( $declarations, $context, $supports );

			$stylesheet .= self::to_ruleset( $selector, $declarations );

			// Attach the rulesets for the classes.
			self::compute_preset_classes( $stylesheet, $context, $selector );
		}

		return $stylesheet;
	}

	/**
	 * Returns the existing settings for each context.
	 *
	 * Example:
	 *
	 * {
	 *   'global': {
	 *     'color': {
	 *       'custom': true
	 *     }
	 *   },
	 *   'core/paragraph': {
	 *     'spacing': {
	 *       'customPadding': true
	 *     }
	 *   }
	 * }
	 *
	 * @return array Settings per context.
	 */
	public function get_settings() {
		return array_filter(
			array_map( array( $this, 'extract_settings' ), $this->contexts ),
			function ( $element ) {
				return null !== $element;
			}
		);
	}

	/**
	 * Returns the stylesheet that results of processing
	 * the theme.json structure this object represents.
	 *
	 * @param string $type Type of stylesheet we want accepts 'all', 'block_styles', and 'css_variables'.
	 * @return string Stylesheet.
	 */
	public function get_stylesheet( $type = 'all' ) {
		switch ( $type ) {
			case 'block_styles':
				return $this->get_block_styles();
			case 'css_variables':
				return $this->get_css_variables();
			default:
				return $this->get_css_variables() . $this->get_block_styles();
		}
	}

	/**
	 * Merge new incoming data.
	 *
	 * @param WP_Theme_JSON $theme_json Data to merge.
	 */
	public function merge( $theme_json ) {
		$incoming_data = $theme_json->get_raw_data();

		foreach ( array_keys( $incoming_data ) as $context ) {
			foreach ( array( 'settings', 'styles' ) as $subtree ) {
				if ( ! isset( $incoming_data[ $context ][ $subtree ] ) ) {
					continue;
				}

				if ( ! isset( $this->contexts[ $context ][ $subtree ] ) ) {
					$this->contexts[ $context ][ $subtree ] = $incoming_data[ $context ][ $subtree ];
					continue;
				}

				foreach ( array_keys( self::SCHEMA[ $subtree ] ) as $leaf ) {
					if ( ! isset( $incoming_data[ $context ][ $subtree ][ $leaf ] ) ) {
						continue;
					}

					if ( ! isset( $this->contexts[ $context ][ $subtree ][ $leaf ] ) ) {
						$this->contexts[ $context ][ $subtree ][ $leaf ] = $incoming_data[ $context ][ $subtree ][ $leaf ];
						continue;
					}

					$this->contexts[ $context ][ $subtree ][ $leaf ] = array_merge(
						$this->contexts[ $context ][ $subtree ][ $leaf ],
						$incoming_data[ $context ][ $subtree ][ $leaf ]
					);
				}
			}
		}
	}

	/**
	 * Removes insecure data from theme.json.
	 */
	public function remove_insecure_properties() {
		$blocks_metadata   = self::get_blocks_metadata();
		$metadata_mappings = self::get_properties_metadata_case_mappings();
		foreach ( $this->contexts as $context_name => &$context ) {
			// Escape the context key.
			if ( empty( $blocks_metadata[ $context_name ] ) ) {
				unset( $this->contexts[ $context_name ] );
				continue;
			}

			$escaped_settings = null;
			$escaped_styles   = null;

			// Style escaping.
			if ( ! empty( $context['styles'] ) ) {
				$supports     = $blocks_metadata[ $context_name ]['supports'];
				$declarations = array();
				self::compute_style_properties( $declarations, $context, $supports );
				foreach ( $declarations as $declaration ) {
					$style_to_validate = $declaration['name'] . ': ' . $declaration['value'];
					if ( esc_html( safecss_filter_attr( $style_to_validate ) ) === $style_to_validate ) {
						if ( null === $escaped_styles ) {
							$escaped_styles = array();
						}
						$property = $metadata_mappings['to_property'][ $declaration['name'] ];
						$path     = self::PROPERTIES_METADATA[ $property ]['value'];
						if ( self::has_properties( self::PROPERTIES_METADATA[ $property ] ) ) {
							$declaration_divided = explode( '-', $declaration['name'] );
							$path[]              = $declaration_divided[1];
							gutenberg_experimental_set(
								$escaped_styles,
								$path,
								gutenberg_experimental_get( $context['styles'], $path )
							);
						} else {
							gutenberg_experimental_set(
								$escaped_styles,
								$path,
								gutenberg_experimental_get( $context['styles'], $path )
							);
						}
					}
				}
			}

			// Settings escaping.
			// For now the ony allowed settings are presets.
			if ( ! empty( $context['settings'] ) ) {
				foreach ( self::PRESETS_METADATA as $preset_metadata ) {
					$current_preset = gutenberg_experimental_get( $context, $preset_metadata['path'], null );
					if ( null !== $current_preset ) {
						$escaped_preset = array();
						foreach ( $current_preset as $single_preset ) {
							if (
								esc_attr( esc_html( $single_preset['name'] ) ) === $single_preset['name'] &&
								sanitize_html_class( $single_preset['slug'] ) === $single_preset['slug']
							) {
								$value                  = $single_preset[ $preset_metadata['value_key'] ];
								$single_preset_is_valid = null;
								if ( isset( $preset_metadata['classes'] ) && count( $preset_metadata['classes'] ) > 0 ) {
									$single_preset_is_valid = true;
									foreach ( $preset_metadata['classes'] as $class_meta_data ) {
										$property          = $class_meta_data['property_name'];
										$style_to_validate = $property . ': ' . $value;
										if ( esc_html( safecss_filter_attr( $style_to_validate ) ) !== $style_to_validate ) {
											$single_preset_is_valid = false;
											break;
										}
									}
								} else {
									$property               = $preset_metadata['css_var_infix'];
									$style_to_validate      = $property . ': ' . $value;
									$single_preset_is_valid = esc_html( safecss_filter_attr( $style_to_validate ) ) === $style_to_validate;
								}
								if ( $single_preset_is_valid ) {
									$escaped_preset[] = $single_preset;
								}
							}
						}
						if ( count( $escaped_preset ) > 0 ) {
							if ( null === $escaped_settings ) {
								$escaped_settings = array();
							}
							gutenberg_experimental_set( $escaped_settings, $preset_metadata['path'], $escaped_preset );
						}
					}
				}
				if ( null !== $escaped_settings ) {
					$escaped_settings = $escaped_settings['settings'];
				}
			}

			if ( null === $escaped_settings && null === $escaped_styles ) {
				unset( $this->contexts[ $context_name ] );
			} elseif ( null !== $escaped_settings && null !== $escaped_styles ) {
				$context = array(
					'styles'   => $escaped_styles,
					'settings' => $escaped_settings,
				);
			} elseif ( null === $escaped_settings ) {
				$context = array(
					'styles' => $escaped_styles,
				);
			} else {
				$context = array(
					'settings' => $escaped_settings,
				);
			}
		}
	}

	/**
	 * Retuns the raw data.
	 *
	 * @return array Raw data.
	 */
	public function get_raw_data() {
		return $this->contexts;
	}

}
