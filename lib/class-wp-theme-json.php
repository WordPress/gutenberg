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
	 * The CSS selector for the global context.
	 *
	 * @var string
	 */
	const GLOBAL_SELECTOR = ':root';

	/**
	 * The block type and name for the global context.
	 *
	 * @var string
	 */
	const GLOBAL_TYPE = 'global';

	/**
	 * The block arguments for the global context.
	 *
	 * @var array
	 */
	const GLOBAL_ARGS = array(
		'supports' => array(
			'__experimentalFontAppearance' => false,
			'__experimentalFontFamily'     => true,
			'__experimentalSelector'       => self::GLOBAL_SELECTOR,
			'__experimentalTextDecoration' => true,
			'__experimentalTextTransform'  => true,
			'color'                        => array(
				'gradients' => true,
				'link'      => true,
			),
			'fontSize'                     => true,
			'lineHeight'                   => true,
		),
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
		'selector' => null,
		'supports' => null,
		'styles'   => array(
			'color'      => array(
				'background' => null,
				'gradient'   => null,
				'link'       => null,
				'text'       => null,
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
				'customFontSize'   => null,
				'customLineHeight' => null,
				'dropCap'          => null,
				'fontFamilies'     => null,
				'fontSizes'        => null,
				'fontStyles'       => null,
				'fontWeights'      => null,
				'textDecorations'  => null,
				'textTransforms'   => null,
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
		array(
			'path'          => array( 'settings', 'typography', 'fontStyles' ),
			'value_key'     => 'slug',
			'css_var_infix' => 'font-style',
			'classes'       => array(
				array(
					'class_suffix'  => 'font-style',
					'property_name' => 'font-style',
				),
			),
		),
		array(
			'path'          => array( 'settings', 'typography', 'fontWeights' ),
			'value_key'     => 'slug',
			'css_var_infix' => 'font-weight',
			'classes'       => array(
				array(
					'class_suffix'  => 'font-weight',
					'property_name' => 'font-weight',
				),
			),
		),
		array(
			'path'          => array( 'settings', 'typography', 'textDecorations' ),
			'value_key'     => 'value',
			'css_var_infix' => 'text-decoration',
			'classes'       => array(
				array(
					'class_suffix'  => 'text-decoration',
					'property_name' => 'text-decoration',
				),
			),
		),
		array(
			'path'          => array( 'settings', 'typography', 'textTransforms' ),
			'value_key'     => 'slug',
			'css_var_infix' => 'text-transform',
			'classes'       => array(
				array(
					'class_suffix'  => 'text-transform',
					'property_name' => 'text-transform',
				),
			),
		),
	);

	/**
	 * Metadata for style properties.
	 *
	 * - 'theme_json' => where the property value is stored
	 * - 'block_json' => whether the block has declared support for it
	 */
	const PROPERTIES_METADATA = array(
		'--wp--style--color--link' => array(
			'theme_json' => array( 'color', 'link' ),
			'block_json' => array( 'color', 'link' ),
		),
		'background'               => array(
			'theme_json' => array( 'color', 'gradient' ),
			'block_json' => array( 'color', 'gradients' ),
		),
		'backgroundColor'          => array(
			'theme_json' => array( 'color', 'background' ),
			'block_json' => array( 'color' ),
		),
		'color'                    => array(
			'theme_json' => array( 'color', 'text' ),
			'block_json' => array( 'color' ),
		),
		'fontFamily'               => array(
			'theme_json' => array( 'typography', 'fontFamily' ),
			'block_json' => array( '__experimentalFontFamily' ),
		),
		'fontSize'                 => array(
			'theme_json' => array( 'typography', 'fontSize' ),
			'block_json' => array( 'fontSize' ),
		),
		'fontStyle'                => array(
			'theme_json' => array( 'typography', 'fontStyle' ),
			'block_json' => array( '__experimentalFontAppearance' ),
		),
		'fontWeight'               => array(
			'theme_json' => array( 'typography', 'fontWeight' ),
			'block_json' => array( '__experimentalFontAppearance' ),
		),
		'lineHeight'               => array(
			'theme_json' => array( 'typography', 'lineHeight' ),
			'block_json' => array( 'lineHeight' ),
		),
		'textDecoration'           => array(
			'theme_json' => array( 'typography', 'textDecoration' ),
			'block_json' => array( '__experimentalTextDecoration' ),
		),
		'textTransform'            => array(
			'theme_json' => array( 'typography', 'textTransform' ),
			'block_json' => array( '__experimentalTextTransform' ),
		),
	);

	/**
	 * Constructor.
	 *
	 * @param array $contexts A structure that follows the theme.json schema.
	 */
	public function __construct( $contexts = array() ) {
		$this->contexts = array();

		if ( ! is_array( $contexts ) ) {
			return;
		}

		$metadata = $this->get_blocks_metadata();
		foreach ( $contexts as $key => $context ) {
			if ( ! array_key_exists( $key, $metadata ) ) {
				// Skip incoming contexts that can't be found
				// within the contexts registered.
				continue;
			}

			// Filter out top-level keys that aren't valid according to the schema.
			$context = array_intersect_key( $context, self::SCHEMA );

			// Selector & Supports are always taken from metadata.
			$this->contexts[ $key ]['selector'] = $metadata[ $key ]['selector'];
			$this->contexts[ $key ]['supports'] = $metadata[ $key ]['supports'];

			// Process styles subtree.
			$this->process_key( 'styles', $context, self::SCHEMA );
			if ( array_key_exists( 'styles', $context ) ) {
				$this->process_key( 'color', $context['styles'], self::SCHEMA['styles'] );
				$this->process_key( 'typography', $context['styles'], self::SCHEMA['styles'] );

				if ( 0 === count( $context['styles'] ) ) {
					unset( $context['styles'] );
				} else {
					$this->contexts[ $key ]['styles'] = $context['styles'];
				}
			}

			// Process settings subtree.
			$this->process_key( 'settings', $context, self::SCHEMA );
			if ( array_key_exists( 'settings', $context ) ) {
				$this->process_key( 'color', $context['settings'], self::SCHEMA['settings'] );
				$this->process_key( 'spacing', $context['settings'], self::SCHEMA['settings'] );
				$this->process_key( 'typography', $context['settings'], self::SCHEMA['settings'] );

				if ( 0 === count( $context['settings'] ) ) {
					unset( $context['settings'] );
				} else {
					$this->contexts[ $key ]['settings'] = $context['settings'];
				}
			}
		}
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
	 *     'blockName': 'global',
	 *   },
	 *   'core/heading/h1': {
	 *     'selector': 'h1'
	 *     'supports': [ 'fontSize', 'backgroundColor' ],
	 *     'blockName': 'core/heading',
	 *   }
	 * }
	 *
	 * @return array Block metadata.
	 */
	public static function get_blocks_metadata() {
		if ( null !== self::$blocks_metadata ) {
			return self::$blocks_metadata;
		}

		self::$blocks_metadata = array();

		$registry = WP_Block_Type_Registry::get_instance();
		$blocks   = array_merge(
			$registry->get_all_registered(),
			array( self::GLOBAL_TYPE => new WP_Block_Type( self::GLOBAL_TYPE, self::GLOBAL_ARGS ) )
		);
		foreach ( $blocks as $block_name => $block_type ) {
			if (
				! property_exists( $block_type, 'supports' ) ||
				empty( $block_type->supports ) ||
				! is_array( $block_type->supports ) ) {

				// Skips blocks that don't declare support.
				//
				// TODO: what if there are blocks that don't support
				// any style but still need the settings passed down?
				continue;
			}

			$block_supports = array();
			foreach ( self::PROPERTIES_METADATA as $key => $metadata ) {
				if ( gutenberg_experimental_get( $block_type->supports, $metadata['block_json'] ) ) {
					$block_supports[] = $key;
				}
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
					'selector'  => $block_type->supports['__experimentalSelector'],
					'supports'  => $block_supports,
					'blockName' => $block_name,
				);
			} elseif (
				isset( $block_type->supports['__experimentalSelector'] ) &&
				is_array( $block_type->supports['__experimentalSelector'] )
			) {
				foreach ( $block_type->supports['__experimentalSelector'] as $key => $selector_metadata ) {
					if (
						! isset( $selector_metadata['selector'] ) ||
						! isset( $selector_metadata['attributes'] ) ||
						! isset( $selector_metadata['title'] )
					) {
						continue;
					}

					self::$blocks_metadata[ $key ] = array(
						'selector'   => $selector_metadata['selector'],
						'title'      => $selector_metadata['title'],
						'supports'   => $block_supports,
						'blockName'  => $block_name,
						'attributes' => $selector_metadata['attributes'],
					);
				}
			} else {
				self::$blocks_metadata[ $block_name ] = array(
					'selector'  => '.wp-block-' . str_replace( '/', '-', str_replace( 'core/', '', $block_name ) ),
					'supports'  => $block_supports,
					'blockName' => $block_name,
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
	 * @param string $key Key of the subtree to normalize.
	 * @param array  $input Whole tree to normalize.
	 * @param array  $schema Schema to use for normalization.
	 */
	private static function process_key( $key, &$input, $schema ) {
		if ( ! is_array( $input ) || ! array_key_exists( $key, $input ) ) {
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
		if (
			! array_key_exists( 'settings', $context ) ||
			empty( $context['settings'] )
		) {
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
	 * @param array $declarations Holds the existing declarations.
	 * @param array $context Input context to process.
	 */
	private static function compute_style_properties( &$declarations, $context ) {
		if (
			! array_key_exists( 'supports', $context ) ||
			empty( $context['supports'] ) ||
			! array_key_exists( 'styles', $context ) ||
			empty( $context['styles'] )
		) {
			return;
		}

		foreach ( self::PROPERTIES_METADATA as $name => $metadata ) {
			if ( ! in_array( $name, $context['supports'], true ) ) {
				continue;
			}

			$value = self::get_property_value( $context['styles'], $metadata['theme_json'] );
			if ( ! empty( $value ) ) {
				$kebabcased_name = strtolower( preg_replace( '/(?<!^)[A-Z]/', '-$0', $name ) );
				$declarations[]  = array(
					'name'  => $kebabcased_name,
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
	 */
	private static function compute_preset_classes( &$stylesheet, $context ) {
		$selector = $context['selector'];
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
	 *
	 * See glossary at https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax
	 *
	 * For each context this creates a new ruleset such as:
	 *
	 *   context-selector {
	 *     style-property-one: value;
	 *     --wp--preset--category--slug: value;
	 *     --wp--custom--variable: value;
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
	 * @param string $stylesheet Stylesheet to append new rules to.
	 * @param array  $context Context to be processed.
	 *
	 * @return string The new stylesheet.
	 */
	private static function to_stylesheet( $stylesheet, $context ) {
		if (
			! array_key_exists( 'selector', $context ) ||
			empty( $context['selector'] )
		) {
			return '';
		}

		$declarations = array();
		self::compute_style_properties( $declarations, $context );
		self::compute_preset_vars( $declarations, $context );
		self::compute_theme_vars( $declarations, $context );

		// If there are no declarations at this point,
		// it won't have any preset classes either,
		// so bail out earlier.
		if ( empty( $declarations ) ) {
			return '';
		}

		// Attach the ruleset for style and custom properties.
		$stylesheet .= self::to_ruleset( $context['selector'], $declarations );

		// Attach the rulesets for the classes.
		self::compute_preset_classes( $stylesheet, $context );

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
	 * Returs the stylesheet that results of processing
	 * the theme.json structure this object represents.
	 *
	 * @return string Stylesheet.
	 */
	public function get_stylesheet() {
		return array_reduce( $this->contexts, array( $this, 'to_stylesheet' ), '' );
	}

	/**
	 * Merge new incoming data.
	 *
	 * @param WP_Theme_JSON $theme_json Data to merge.
	 */
	public function merge( $theme_json ) {
		$incoming_data = $theme_json->get_raw_data();
		$metadata      = $this->get_blocks_metadata();

		foreach ( array_keys( $incoming_data ) as $context ) {
			// Selector & Supports are always taken from metadata.
			$this->contexts[ $context ]['selector'] = $metadata[ $context ]['selector'];
			$this->contexts[ $context ]['supports'] = $metadata[ $context ]['supports'];

			foreach ( array( 'settings', 'styles' ) as $subtree ) {
				if ( ! array_key_exists( $subtree, $incoming_data[ $context ] ) ) {
					continue;
				}

				if ( ! array_key_exists( $subtree, $this->contexts[ $context ] ) ) {
					$this->contexts[ $context ][ $subtree ] = $incoming_data[ $context ][ $subtree ];
					continue;
				}

				foreach ( array_keys( self::SCHEMA[ $subtree ] ) as $leaf ) {
					if ( ! array_key_exists( $leaf, $incoming_data[ $context ][ $subtree ] ) ) {
						continue;
					}

					if ( ! array_key_exists( $leaf, $this->contexts[ $context ][ $subtree ] ) ) {
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
	 * Retuns the raw data.
	 *
	 * @return array Raw data.
	 */
	public function get_raw_data() {
		return $this->contexts;
	}

}
