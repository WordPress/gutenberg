<?php

class WP_Theme_JSON {

	/**
	 * Container of data in theme.json format.
	*/
	private $contexts = null;

	/**
	 * Holds block metadata extracted from block.json
	 * to be shared among all instances.
	 *
	 * @var array
	 */
	private static $blocks_metadata = null;

	private const SCHEMA = array(
		'selector' => null,
		'supports' => null,
		'styles' => array(
			'color' => array(
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
			'color' => array(
				'custom'         => null,
				'customGradient' => null,
				'gradients'      => null,
				'link'           => null,
				'palette'        => null,
			),
			'spacing' => array(
				'customPadding' => null,
				'units'         => null,
			),
			'typography' => array(
				'customFontSize'   => null,
				'customLineHeight' => null,
				'dropCap'          => null,
				'fontSizes'        => null,
				'fontFamilies'     => null
			),
			'custom' => null,
		),
	);

	private const PRESETS = array(
		array(
			'path'         => array( 'settings', 'color', 'palette' ),
			'value_key'    => 'color',
			'preset_infix' => 'color',
			'class' => array(
				array(
					'suffix' => 'color',
					'property' => 'color'
				),
				array(
					'suffix'   => 'background-color',
					'property' => 'background-color',
				),
			),
		),
		array(
			'path'         => array( 'settings', 'color', 'gradients' ),
			'value_key'    => 'gradient',
			'preset_infix' => 'gradient',
			'class' => array(
				array(
					'suffix'   => 'gradient-background',
					'property' => 'background'
				),
			),
		),
		array(
			'path'         => array( 'settings', 'typography', 'fontSizes' ),
			'value_key'    => 'size',
			'preset_infix' => 'font-size',
			'class' => array(
				array(
					'suffix'   => 'font-size',
					'property' => 'font-size',
				),
			),
		),
		array(
			'path'         => array( 'settings', 'typography', 'fontFamilies' ),
			'value_key'    => 'fontFamily',
			'preset_infix' => 'font-family',
			'class' => array(
				array(
					'suffix'   => 'font-family',
					'property' => 'font-family',
				),
			),
		),
		array(
			'path'         => array( 'settings', 'typography', 'fontStyles' ),
			'value_key'    => 'slug',
			'preset_infix' => 'font-style',
			'class' => array(
				array(
					'suffix'   => 'font-style',
					'property' => 'font-style',
				),
			),
		),
		array(
			'path'         => array( 'settings', 'typography', 'fontWeights' ),
			'value_key'    => 'slug',
			'preset_infix' => 'font-weight',
			'class' => array(
				array(
					'suffix'   => 'font-weight',
					'property' => 'font-weight',
				),
			),
		),
		array(
			'path'         => array( 'settings', 'typography', 'textDecorations' ),
			'value_key'    => 'value',
			'preset_infix' => 'text-decoration',
			'class' => array(
				array(
					'suffix'   => 'text-decoration',
					'property' => 'text-decoration',
				),
			),
		),
		array(
			'path'         => array( 'settings', 'typography', 'textTransforms' ),
			'value_key'    => 'slug',
			'preset_infix' => 'text-transform',
			'class' => array(
				array(
					'suffix'   => 'text-transform',
					'property' => 'text-transform',
				),
			),
		),
	);

	private const SUPPORTED_PROPERTIES = array(
		'--wp--style--color--link' => array(
			'theme_json' => array( 'color', 'link' ),
			'block_json' => array( 'color', 'link' ),
			'property'   => '--wp--style--color--link',
		),
		'background'               => array(
			'theme_json' => array( 'color', 'gradient' ),
			'block_json' => array( 'color', 'gradients' ),
			'property'   => 'background',
		),
		'backgroundColor'          => array(
			'theme_json' => array( 'color', 'background' ),
			'block_json' => array( 'color' ),
			'property'   => 'background-color',
		),
		'color'                    => array(
			'theme_json' => array( 'color', 'text' ),
			'block_json' => array( 'color' ),
			'property'   => 'color',
		),
		'fontFamily'               => array(
			'theme_json' => array( 'typography', 'fontFamily' ),
			'block_json' => array( '__experimentalFontFamily' ),
			'property'   => 'font-family',
		),
		'fontSize'                 => array(
			'theme_json' => array( 'typography', 'fontSize' ),
			'block_json' => array( 'fontSize' ),
			'property'   => 'font-size'
		),
		'fontStyle'                => array(
			'theme_json' => array( 'typography', 'fontStyle' ),
			'block_json' => array( '__experimentalFontAppearance' ),
			'property'   => 'font-style',
		),
		'fontWeight'               => array(
			'theme_json' => array( 'typography', 'fontWeight' ),
			'block_json' => array( '__experimentalFontAppearance' ),
			'property' => 'font-weight',
		),
		'lineHeight'               => array(
			'theme_json' => array( 'typography', 'lineHeight' ),
			'block_json' => array( 'lineHeight' ),
			'property'   => 'line-height',
		),
		'textDecoration'           => array(
			'theme_json' => array( 'typography', 'textDecoration' ),
			'block_json' => array( '__experimentalTextDecoration' ),
			'property'   => 'text-decoration',
		),
		'textTransform'            => array(
			'theme_json' => array( 'typography', 'textTransform' ),
			'block_json' => array( '__experimentalTextTransform' ),
			'property'   => 'text-transform',
		),
	);

	/**
	 * Constructor.
	 *
	 * @param array $contexts Definitions.
	 */
	public function __construct( $contexts = array() ){
		$this->contexts = array();

		if ( ! is_array( $contexts ) ) {
			return;
		}

		$metadata = $this->get_blocks_metadata();
		foreach ( $contexts as $key => $context ) {
			if ( ! array_key_exists( $key, $metadata ) ) {
				// Skip incoming contexts that can't be found
				// within the contexts registered by blocks.
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

	public function get_blocks_metadata() {
		if ( null !== self::$blocks_metadata ) {
			return self::$blocks_metadata;
		}

		self::$blocks_metadata = array();

		$registry = WP_Block_Type_Registry::get_instance();
		$blocks   = array_merge(
			$registry->get_all_registered(),
			array(
				'global' => new WP_Block_Type(
					'global',
					array(
						'supports' => array(
							'__experimentalFontAppearance' => false,
							'__experimentalFontFamily'     => true,
							'__experimentalSelector'       => ':root',
							'__experimentalTextDecoration' => true,
							'__experimentalTextTransform'  => true,
							'color'                        => array(
								'gradients' => true,
								'link'      => true,
							),
							'fontSize'                     => true,
							'lineHeight'                   => true,
						),
					),
				),
			),
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
			foreach ( self::SUPPORTED_PROPERTIES as $key => $metadata ) {
				if ( $this->get_from_path( $block_type->supports, $metadata['block_json'] ) ) {
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
				foreach ( $block_type->supports['__experimentalSelector'] as $key => $selector ) {
					self::$blocks_metadata[ $key ] = array(
						'selector'  => $selector,
						'supports'  => $block_supports,
						'blockName' => $block_name,
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

	private function process_key( $key, &$input, $schema ) {
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
			$schema[ $key ],
		);

		if ( 0 === count( $input[ $key ] ) ) {
			unset( $input[ $key ] );
		}
	}

	private function extract_settings( $context ) {
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
	private function flatten_tree( $tree, $prefix = '', $token = '--' ) {
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
					$this->flatten_tree( $value, $new_prefix, $token )
				);
			} else {
				$result[ $new_key ] = $value;
			}
		}
		return $result;
	}

	private function get_from_path( $array, $path, $default = array() ) {
		// Confirm input values are expected type to avoid notice warnings.
		if ( ! is_array( $array ) || ! is_array( $path ) ) {
			return $default;
		}

		$path_length = count( $path );
		for ( $i = 0; $i < $path_length; ++$i ) {
			if ( ! isset( $array[ $path[ $i ] ] ) ) {
				return $default;
			}
			$array = $array[ $path[ $i ] ];
		}
		return $array;
	}

	private function compute_style_properties( &$declarations, $context ) {
		if (
			! array_key_exists( 'supports', $context ) ||
			empty( $context['supports'] ) ||
			! array_key_exists( 'styles', $context ) ||
			empty( $context['styles'] )
		) {
			return;
		}

		foreach ( self::SUPPORTED_PROPERTIES as $name => $metadata ) {
			if ( ! in_array( $name, $context['supports'] ) ) {
				continue;
			}

			$value = $this->get_from_path( $context['styles'], $metadata['theme_json'], '' );
			if ( ! empty( $value ) ) {
				$declarations[] = array(
					'name'  => $metadata['property'],
					'value' => $value
				);
			}
		}

		return $declarations;
	}

	private function compute_preset_classes( &$stylesheet, $context ) {
		foreach ( self::PRESETS as $preset ) {
			$values = $this->get_from_path( $context, $preset['path'], array() );
			foreach ( $values as $value ) {
				foreach ( $preset['class'] as $class ) {
					$stylesheet .= $this->to_ruleset(
						$context['selector'] . ".has-" . $value['slug'] . "-" . $class['suffix'],
						array(
							array(
								'name'  => $class['property'],
								'value' => $value[ $preset['value_key'] ]
							)
						)
					);
				}
			}
		}
	}

	private function compute_preset_vars( &$declarations, $context ) {
		foreach ( self::PRESETS as $preset ) {
			$values = $this->get_from_path( $context, $preset['path'], array() );
			foreach ( $values as $value ) {
				$declarations[] = array(
					'name'  => '--wp--preset--' . $preset['preset_infix'] . '--' . $value['slug'],
					'value' => $value[ $preset['value_key'] ],
				);
			}
		}
	}

	private function compute_theme_vars( &$declarations, $context ) {
		$custom_values = $this->get_from_path( $context, [ 'settings', 'custom' ] );
		$css_vars      = $this->flatten_tree( $custom_values );
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
	 * @param array $declarations List of declarations.
	 *
	 * @return string CSS ruleset.
	 */
	private function to_ruleset( $selector, $declarations ) {
		$ruleset = '';

		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			$declaration_block = array_reduce(
				$declarations,
				function ( $carry, $element ) { return $carry .= "\t" . $element['name'] . ': ' . $element['value'] . ";\n"; },
				'',
			);
			$ruleset .= $selector . " {\n" . $declaration_block . "}\n";
		} else {
			$declaration_block = array_reduce(
				$declarations,
				function ( $carry, $element ) { return $carry .= $element['name'] . ': ' . $element['value'] . ';'; },
				'',
			);
			$ruleset .= $selector . '{' . $declaration_block . '}';
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
	 * @param string $stylesheet
	 * @param array $context Context to be processed.
	 *
	 * @return string The new stylesheet.
	 */
	private function to_stylesheet( $stylesheet, $context ) {
		if (
			! array_key_exists( 'selector', $context ) ||
			empty( $context['selector'] )
		) {
			return '';
		}

		$declarations = array();
		$this->compute_style_properties( $declarations, $context );
		$this->compute_preset_vars( $declarations, $context );
		$this->compute_theme_vars( $declarations, $context );

		// If there are no declarations at this point,
		// it won't have any preset classes either,
		// so bail out earlier.
		if ( empty( $declarations ) ) {
			return '';
		}

		// Attach the ruleset for style and custom properties.
		$stylesheet .= $this->to_ruleset( $context['selector'], $declarations );

		// Attach the rulesets for the classes.
		$this->compute_preset_classes( $stylesheet, $context );

		return $stylesheet;
	}

	public function get_settings() {
		return array_filter(
			array_map( array( $this, 'extract_settings' ), $this->contexts ),
			function ( $element ) { return $element !== null; }
		);
	}

	public function get_stylesheet() {
		return array_reduce( $this->contexts, array( $this, 'to_stylesheet' ), '' );
	}

	/**
	 * Merge new incoming data.
	 *
	 * @param WP_Theme_JSON $incoming Data to merge.
	 */
	public function merge( $theme_json ) {
		$incoming_data = $theme_json->get_raw_data();

		foreach ( array_keys( $incoming_data ) as $context ) {
			$this->contexts[ $context ]['selector'] = $incoming_data[ $context ]['selector'];
			$this->contexts[ $context ]['supports'] = $incoming_data[ $context ]['supports'];

			foreach ( [ 'settings', 'styles' ] as $subtree ) {
				if ( ! array_key_exists( $subtree, $incoming_data[ $context ] ) ) {
					continue;
				}

				if ( ! array_key_exists( $subtree, $this->contexts[ $context ] ) ) {
					$this->contexts[ $context ][ $subtree ] = $incoming_data[ $context ][ $subtree ];
					continue;
				}

				$this->contexts[ $context ][ $subtree ] = array_replace_recursive(
					$this->contexts[ $context ][ $subtree ],
					$incoming_data[ $context ][ $subtree ],
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