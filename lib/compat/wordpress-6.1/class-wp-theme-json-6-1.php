<?php
/**
 * WP_Theme_JSON_6_1 class
 *
 * @package gutenberg
 */

/**
 * Class that encapsulates the processing of structures that adhere to the theme.json spec.
 *
 * This class is for internal core usage and is not supposed to be used by extenders (plugins and/or themes).
 * This is a low-level API that may need to do breaking changes. Please,
 * use get_global_settings, get_global_styles, and get_global_stylesheet instead.
 *
 * @access private
 */
class WP_Theme_JSON_6_1 extends WP_Theme_JSON_6_0 {

	/**
	 * Define which defines which pseudo selectors are enabled for
	 * which elements.
	 * Note: this will effect both top level and block level elements.
	 */
	const VALID_ELEMENT_PSEUDO_SELECTORS = array(
		'link' => array( ':hover', ':focus', ':active', ':visited' ),
	);

	/**
	 * Metadata for style properties.
	 *
	 * Each element is a direct mapping from the CSS property name to the
	 * path to the value in theme.json & block attributes.
	 */
	const PROPERTIES_METADATA = array(
		'background'                 => array( 'color', 'gradient' ),
		'background-color'           => array( 'color', 'background' ),
		'border-radius'              => array( 'border', 'radius' ),
		'border-top-left-radius'     => array( 'border', 'radius', 'topLeft' ),
		'border-top-right-radius'    => array( 'border', 'radius', 'topRight' ),
		'border-bottom-left-radius'  => array( 'border', 'radius', 'bottomLeft' ),
		'border-bottom-right-radius' => array( 'border', 'radius', 'bottomRight' ),
		'border-color'               => array( 'border', 'color' ),
		'border-width'               => array( 'border', 'width' ),
		'border-style'               => array( 'border', 'style' ),
		'border-top-color'           => array( 'border', 'top', 'color' ),
		'border-top-width'           => array( 'border', 'top', 'width' ),
		'border-top-style'           => array( 'border', 'top', 'style' ),
		'border-right-color'         => array( 'border', 'right', 'color' ),
		'border-right-width'         => array( 'border', 'right', 'width' ),
		'border-right-style'         => array( 'border', 'right', 'style' ),
		'border-bottom-color'        => array( 'border', 'bottom', 'color' ),
		'border-bottom-width'        => array( 'border', 'bottom', 'width' ),
		'border-bottom-style'        => array( 'border', 'bottom', 'style' ),
		'border-left-color'          => array( 'border', 'left', 'color' ),
		'border-left-width'          => array( 'border', 'left', 'width' ),
		'border-left-style'          => array( 'border', 'left', 'style' ),
		'color'                      => array( 'color', 'text' ),
		'font-family'                => array( 'typography', 'fontFamily' ),
		'font-size'                  => array( 'typography', 'fontSize' ),
		'font-style'                 => array( 'typography', 'fontStyle' ),
		'font-weight'                => array( 'typography', 'fontWeight' ),
		'letter-spacing'             => array( 'typography', 'letterSpacing' ),
		'line-height'                => array( 'typography', 'lineHeight' ),
		'margin'                     => array( 'spacing', 'margin' ),
		'margin-top'                 => array( 'spacing', 'margin', 'top' ),
		'margin-right'               => array( 'spacing', 'margin', 'right' ),
		'margin-bottom'              => array( 'spacing', 'margin', 'bottom' ),
		'margin-left'                => array( 'spacing', 'margin', 'left' ),
		'padding'                    => array( 'spacing', 'padding' ),
		'padding-top'                => array( 'spacing', 'padding', 'top' ),
		'padding-right'              => array( 'spacing', 'padding', 'right' ),
		'padding-bottom'             => array( 'spacing', 'padding', 'bottom' ),
		'padding-left'               => array( 'spacing', 'padding', 'left' ),
		'text-decoration'            => array( 'typography', 'textDecoration' ),
		'text-transform'             => array( 'typography', 'textTransform' ),
		'filter'                     => array( 'filter', 'duotone' ),
	);

	/**
	 * The valid elements that can be found under styles.
	 *
	 * @var string[]
	 */
	const ELEMENTS = array(
		'link'    => 'a:not(.wp-element-button)',
		'heading' => 'h1, h2, h3, h4, h5, h6',
		'h1'      => 'h1',
		'h2'      => 'h2',
		'h3'      => 'h3',
		'h4'      => 'h4',
		'h5'      => 'h5',
		'h6'      => 'h6',
		'button'  => '.wp-element-button, .wp-block-button__link', // We have the .wp-block-button__link class so that this will target older buttons that have been serialized.
		'caption' => '.wp-element-caption, .wp-block-audio figcaption, .wp-block-embed figcaption, .wp-block-gallery figcaption, .wp-block-image figcaption, .wp-block-table figcaption, .wp-block-video figcaption', // The block classes are necessary to target older content that won't use the new class names.
	);

	const __EXPERIMENTAL_ELEMENT_CLASS_NAMES = array(
		'button'  => 'wp-element-button',
		'caption' => 'wp-element-caption',
	);

	/**
	 * Given an element name, returns a class name.
	 *
	 * @param string $element The name of the element.
	 *
	 * @return string The name of the class.
	 *
	 * @since 6.1.0
	 */
	public static function get_element_class_name( $element ) {
		return array_key_exists( $element, static::__EXPERIMENTAL_ELEMENT_CLASS_NAMES ) ? static::__EXPERIMENTAL_ELEMENT_CLASS_NAMES[ $element ] : '';
	}

	/**
	 * Sanitizes the input according to the schemas.
	 *
	 * @since 5.8.0
	 * @since 5.9.0 Added the `$valid_block_names` and `$valid_element_name` parameters.
	 *
	 * @param array $input               Structure to sanitize.
	 * @param array $valid_block_names   List of valid block names.
	 * @param array $valid_element_names List of valid element names.
	 * @return array The sanitized output.
	 */
	protected static function sanitize( $input, $valid_block_names, $valid_element_names ) {

		$output = array();

		if ( ! is_array( $input ) ) {
			return $output;
		}

		// Preserve only the top most level keys.
		$output = array_intersect_key( $input, array_flip( static::VALID_TOP_LEVEL_KEYS ) );

		// Remove any rules that are annotated as "top" in VALID_STYLES constant.
		// Some styles are only meant to be available at the top-level (e.g.: blockGap),
		// hence, the schema for blocks & elements should not have them.
		$styles_non_top_level = static::VALID_STYLES;
		foreach ( array_keys( $styles_non_top_level ) as $section ) {
			foreach ( array_keys( $styles_non_top_level[ $section ] ) as $prop ) {
				if ( 'top' === $styles_non_top_level[ $section ][ $prop ] ) {
					unset( $styles_non_top_level[ $section ][ $prop ] );
				}
			}
		}

		// Build the schema based on valid block & element names.
		$schema                 = array();
		$schema_styles_elements = array();

		// Set allowed element pseudo selectors based on per element allow list.
		// Target data structure in schema:
		// e.g.
		// - top level elements: `$schema['styles']['elements']['link'][':hover']`.
		// - block level elements: `$schema['styles']['blocks']['core/button']['elements']['link'][':hover']`.
		foreach ( $valid_element_names as $element ) {
			$schema_styles_elements[ $element ] = $styles_non_top_level;

			if ( array_key_exists( $element, static::VALID_ELEMENT_PSEUDO_SELECTORS ) ) {
				foreach ( static::VALID_ELEMENT_PSEUDO_SELECTORS[ $element ] as $pseudo_selector ) {
					$schema_styles_elements[ $element ][ $pseudo_selector ] = $styles_non_top_level;
				}
			}
		}

		$schema_styles_blocks   = array();
		$schema_settings_blocks = array();
		foreach ( $valid_block_names as $block ) {
			$schema_settings_blocks[ $block ]           = static::VALID_SETTINGS;
			$schema_styles_blocks[ $block ]             = $styles_non_top_level;
			$schema_styles_blocks[ $block ]['elements'] = $schema_styles_elements;
		}

		$schema['styles']             = static::VALID_STYLES;
		$schema['styles']['blocks']   = $schema_styles_blocks;
		$schema['styles']['elements'] = $schema_styles_elements;
		$schema['settings']           = static::VALID_SETTINGS;
		$schema['settings']['blocks'] = $schema_settings_blocks;

		// Remove anything that's not present in the schema.
		foreach ( array( 'styles', 'settings' ) as $subtree ) {
			if ( ! isset( $input[ $subtree ] ) ) {
				continue;
			}

			if ( ! is_array( $input[ $subtree ] ) ) {
				unset( $output[ $subtree ] );
				continue;
			}

			$result = static::remove_keys_not_in_schema( $input[ $subtree ], $schema[ $subtree ] );

			if ( empty( $result ) ) {
				unset( $output[ $subtree ] );
			} else {
				$output[ $subtree ] = $result;
			}
		}

		return $output;
	}

	/**
	 * Removes insecure data from theme.json.
	 *
	 * @since 5.9.0
	 *
	 * @param array $theme_json Structure to sanitize.
	 * @return array Sanitized structure.
	 */
	public static function remove_insecure_properties( $theme_json ) {
		$sanitized = array();

		$theme_json = WP_Theme_JSON_Schema::migrate( $theme_json );

		$valid_block_names   = array_keys( static::get_blocks_metadata() );
		$valid_element_names = array_keys( static::ELEMENTS );

		$theme_json = static::sanitize( $theme_json, $valid_block_names, $valid_element_names );

		$blocks_metadata = static::get_blocks_metadata();
		$style_nodes     = static::get_style_nodes( $theme_json, $blocks_metadata );

		foreach ( $style_nodes as $metadata ) {
			$input = _wp_array_get( $theme_json, $metadata['path'], array() );
			if ( empty( $input ) ) {
				continue;
			}

			$output = static::remove_insecure_styles( $input );

			// Get a reference to element name from path.
			// $metadata['path'] = array('styles','elements','link');.
			$current_element = $metadata['path'][ count( $metadata['path'] ) - 1 ];

			// $output is stripped of pseudo selectors. Readd and process them
			// for insecure styles here.
			if ( isset( static::VALID_ELEMENT_PSEUDO_SELECTORS[ $current_element ] ) ) {

				foreach ( static::VALID_ELEMENT_PSEUDO_SELECTORS[ $current_element ] as $pseudo_selector ) {
					if ( isset( $input[ $pseudo_selector ] ) ) {
						$output[ $pseudo_selector ] = static::remove_insecure_styles( $input[ $pseudo_selector ] );
					}
				}
			}

			if ( ! empty( $output ) ) {
				_wp_array_set( $sanitized, $metadata['path'], $output );
			}
		}

		$setting_nodes = static::get_setting_nodes( $theme_json );
		foreach ( $setting_nodes as $metadata ) {
			$input = _wp_array_get( $theme_json, $metadata['path'], array() );
			if ( empty( $input ) ) {
				continue;
			}

			$output = static::remove_insecure_settings( $input );
			if ( ! empty( $output ) ) {
				_wp_array_set( $sanitized, $metadata['path'], $output );
			}
		}

		if ( empty( $sanitized['styles'] ) ) {
			unset( $theme_json['styles'] );
		} else {
			$theme_json['styles'] = $sanitized['styles'];
		}

		if ( empty( $sanitized['settings'] ) ) {
			unset( $theme_json['settings'] );
		} else {
			$theme_json['settings'] = $sanitized['settings'];
		}

		return $theme_json;
	}

	/**
	 * The valid properties under the styles key.
	 *
	 * @var array
	 */
	const VALID_STYLES = array(
		'border'     => array(
			'color'  => null,
			'radius' => null,
			'style'  => null,
			'width'  => null,
			'top'    => null,
			'right'  => null,
			'bottom' => null,
			'left'   => null,
		),
		'color'      => array(
			'background' => null,
			'gradient'   => null,
			'text'       => null,
		),
		'filter'     => array(
			'duotone' => null,
		),
		'spacing'    => array(
			'margin'   => null,
			'padding'  => null,
			'blockGap' => null,
		),
		'typography' => array(
			'fontFamily'     => null,
			'fontSize'       => null,
			'fontStyle'      => null,
			'fontWeight'     => null,
			'letterSpacing'  => null,
			'lineHeight'     => null,
			'textDecoration' => null,
			'textTransform'  => null,
		),
	);

	/**
	 * Returns the metadata for each block.
	 *
	 * Example:
	 *
	 *     {
	 *       'core/paragraph': {
	 *         'selector': 'p',
	 *         'elements': {
	 *           'link' => 'link selector',
	 *           'etc'  => 'element selector'
	 *         }
	 *       },
	 *       'core/heading': {
	 *         'selector': 'h1',
	 *         'elements': {}
	 *       },
	 *       'core/image': {
	 *         'selector': '.wp-block-image',
	 *         'duotone': 'img',
	 *         'elements': {}
	 *       }
	 *     }
	 *
	 * @return array Block metadata.
	 */
	protected static function get_blocks_metadata() {
		if ( null !== static::$blocks_metadata ) {
			return static::$blocks_metadata;
		}

		static::$blocks_metadata = array();

		$registry = WP_Block_Type_Registry::get_instance();
		$blocks   = $registry->get_all_registered();
		foreach ( $blocks as $block_name => $block_type ) {
			if (
				isset( $block_type->supports['__experimentalSelector'] ) &&
				is_string( $block_type->supports['__experimentalSelector'] )
			) {
				static::$blocks_metadata[ $block_name ]['selector'] = $block_type->supports['__experimentalSelector'];
			} else {
				static::$blocks_metadata[ $block_name ]['selector'] = '.wp-block-' . str_replace( '/', '-', str_replace( 'core/', '', $block_name ) );
			}

			if (
				isset( $block_type->supports['color']['__experimentalDuotone'] ) &&
				is_string( $block_type->supports['color']['__experimentalDuotone'] )
			) {
				static::$blocks_metadata[ $block_name ]['duotone'] = $block_type->supports['color']['__experimentalDuotone'];
			}

			// Assign defaults, then overwrite those that the block sets by itself.
			// If the block selector is compounded, will append the element to each
			// individual block selector.
			$block_selectors = explode( ',', static::$blocks_metadata[ $block_name ]['selector'] );
			foreach ( static::ELEMENTS as $el_name => $el_selector ) {
				$element_selector = array();
				foreach ( $block_selectors as $selector ) {
					if ( $selector === $el_selector ) {
						$element_selector = array( $el_selector );
						break;
					}

					// This converts selectors like '.wp-element-button, .wp-block-button__link'
					// to an array, so that the block selector is added to both parts of the selector.
					$el_selectors = explode( ',', $el_selector );
					foreach ( $el_selectors as $el_selector_item ) {
						$element_selector[] = $selector . ' ' . $el_selector_item;
					}
				}
				static::$blocks_metadata[ $block_name ]['elements'][ $el_name ] = implode( ',', $element_selector );
			}
		}

		return static::$blocks_metadata;
	}

	/**
	 * Builds metadata for the style nodes, which returns in the form of:
	 *
	 *     [
	 *       [
	 *         'path'     => [ 'path', 'to', 'some', 'node' ],
	 *         'selector' => 'CSS selector for some node',
	 *         'duotone'  => 'CSS selector for duotone for some node'
	 *       ],
	 *       [
	 *         'path'     => ['path', 'to', 'other', 'node' ],
	 *         'selector' => 'CSS selector for other node',
	 *         'duotone'  => null
	 *       ],
	 *     ]
	 *
	 * @since 5.8.0
	 *
	 * @param array $theme_json The tree to extract style nodes from.
	 * @param array $selectors  List of selectors per block.
	 * @return array
	 */
	protected static function get_style_nodes( $theme_json, $selectors = array() ) {
		$nodes = array();
		if ( ! isset( $theme_json['styles'] ) ) {
			return $nodes;
		}

		// Top-level.
		$nodes[] = array(
			'path'     => array( 'styles' ),
			'selector' => static::ROOT_BLOCK_SELECTOR,
		);

		if ( isset( $theme_json['styles']['elements'] ) ) {
			foreach ( self::ELEMENTS as $element => $selector ) {
				if ( ! isset( $theme_json['styles']['elements'][ $element ] ) ) {
					continue;
				}

				// Handle element defaults.
				$nodes[] = array(
					'path'     => array( 'styles', 'elements', $element ),
					'selector' => static::ELEMENTS[ $element ],
				);

				// Handle any pseudo selectors for the element.
				if ( isset( static::VALID_ELEMENT_PSEUDO_SELECTORS[ $element ] ) ) {
					foreach ( static::VALID_ELEMENT_PSEUDO_SELECTORS[ $element ] as $pseudo_selector ) {

						if ( isset( $theme_json['styles']['elements'][ $element ][ $pseudo_selector ] ) ) {
							$nodes[] = array(
								'path'     => array( 'styles', 'elements', $element ),
								'selector' => static::ELEMENTS[ $element ] . $pseudo_selector,
							);
						}
					}
				}
			}
		}

		// Blocks.
		if ( ! isset( $theme_json['styles']['blocks'] ) ) {
			return $nodes;
		}

		$nodes = array_merge( $nodes, static::get_block_nodes( $theme_json, $selectors ) );

		// This filter allows us to modify the output of WP_Theme_JSON so that we can do things like loading block CSS independently.
		return apply_filters( 'gutenberg_get_style_nodes', $nodes );
	}

	/**
	 * A public helper to get the block nodes from a theme.json file.
	 *
	 * @return array The block nodes in theme.json.
	 */
	public function get_styles_block_nodes() {
		return static::get_block_nodes( $this->theme_json );
	}

	/**
	 * An internal method to get the block nodes from a theme.json file.
	 *
	 * @param array $theme_json The theme.json converted to an array.
	 * @param array $selectors  Optional list of selectors per block.
	 *
	 * @return array The block nodes in theme.json.
	 */
	private static function get_block_nodes( $theme_json, $selectors = array() ) {
		$selectors = empty( $selectors ) ? static::get_blocks_metadata() : $selectors;
		$nodes     = array();
		if ( ! isset( $theme_json['styles'] ) ) {
			return $nodes;
		}

		// Blocks.
		if ( ! isset( $theme_json['styles']['blocks'] ) ) {
			return $nodes;
		}

		foreach ( $theme_json['styles']['blocks'] as $name => $node ) {
			$selector = null;
			if ( isset( $selectors[ $name ]['selector'] ) ) {
				$selector = $selectors[ $name ]['selector'];
			}

			$duotone_selector = null;
			if ( isset( $selectors[ $name ]['duotone'] ) ) {
				$duotone_selector = $selectors[ $name ]['duotone'];
			}

			$nodes[] = array(
				'name'     => $name,
				'path'     => array( 'styles', 'blocks', $name ),
				'selector' => $selector,
				'duotone'  => $duotone_selector,
			);

			if ( isset( $theme_json['styles']['blocks'][ $name ]['elements'] ) ) {
				foreach ( $theme_json['styles']['blocks'][ $name ]['elements'] as $element => $node ) {
					$nodes[] = array(
						'path'     => array( 'styles', 'blocks', $name, 'elements', $element ),
						'selector' => $selectors[ $name ]['elements'][ $element ],
					);

					// Handle any pseudo selectors for the element.
					if ( isset( static::VALID_ELEMENT_PSEUDO_SELECTORS[ $element ] ) ) {
						foreach ( static::VALID_ELEMENT_PSEUDO_SELECTORS[ $element ] as $pseudo_selector ) {
							if ( isset( $theme_json['styles']['blocks'][ $name ]['elements'][ $element ][ $pseudo_selector ] ) ) {
								$nodes[] = array(
									'path'     => array( 'styles', 'blocks', $name, 'elements', $element ),
									'selector' => $selectors[ $name ]['elements'][ $element ] . $pseudo_selector,
								);
							}
						}
					}
				}
			}
		}

		return $nodes;
	}

	/**
	 * Returns the stylesheet that results of processing
	 * the theme.json structure this object represents.
	 *
	 * @param array $types    Types of styles to load. Will load all by default. It accepts:
	 *                         'variables': only the CSS Custom Properties for presets & custom ones.
	 *                         'styles': only the styles section in theme.json.
	 *                         'presets': only the classes for the presets.
	 * @param array $origins A list of origins to include. By default it includes VALID_ORIGINS.
	 * @return string Stylesheet.
	 */
	public function get_stylesheet( $types = array( 'variables', 'styles', 'presets' ), $origins = null ) {
		if ( null === $origins ) {
			$origins = static::VALID_ORIGINS;
		}

		if ( is_string( $types ) ) {
			// Dispatch error and map old arguments to new ones.
			_deprecated_argument( __FUNCTION__, '5.9' );
			if ( 'block_styles' === $types ) {
				$types = array( 'styles', 'presets' );
			} elseif ( 'css_variables' === $types ) {
				$types = array( 'variables' );
			} else {
				$types = array( 'variables', 'styles', 'presets' );
			}
		}

		$blocks_metadata = static::get_blocks_metadata();
		$style_nodes     = static::get_style_nodes( $this->theme_json, $blocks_metadata );
		$setting_nodes   = static::get_setting_nodes( $this->theme_json, $blocks_metadata );

		$stylesheet = '';

		if ( in_array( 'variables', $types, true ) ) {
			$stylesheet .= $this->get_css_variables( $setting_nodes, $origins );
		}

		if ( in_array( 'styles', $types, true ) ) {
			$stylesheet .= $this->get_block_classes( $style_nodes );
		} elseif ( in_array( 'base-layout-styles', $types, true ) ) {
			// Base layout styles are provided as part of `styles`, so only output separately if explicitly requested.
			// For backwards compatibility, the Columns block is explicitly included, to support a different default gap value.
			$base_styles_nodes = array(
				array(
					'path'     => array( 'styles' ),
					'selector' => static::ROOT_BLOCK_SELECTOR,
				),
				array(
					'path'     => array( 'styles', 'blocks', 'core/columns' ),
					'selector' => '.wp-block-columns',
					'name'     => 'core/columns',
				),
			);

			foreach ( $base_styles_nodes as $base_style_node ) {
				$stylesheet .= $this->get_layout_styles( $base_style_node );
			}
		}

		if ( in_array( 'presets', $types, true ) ) {
			$stylesheet .= $this->get_preset_classes( $setting_nodes, $origins );
		}

		return $stylesheet;
	}

	/**
	 * Gets the CSS rules for a particular block from theme.json.
	 *
	 * @param array $block_metadata Metadata about the block to get styles for.
	 *
	 * @return string Styles for the block.
	 */
	public function get_styles_for_block( $block_metadata ) {
		$node = _wp_array_get( $this->theme_json, $block_metadata['path'], array() );

		$selector = $block_metadata['selector'];
		$settings = _wp_array_get( $this->theme_json, array( 'settings' ) );

		// Get a reference to element name from path.
		// $block_metadata['path'] = array('styles','elements','link');
		// Make sure that $block_metadata['path'] describes an element node, like ['styles', 'element', 'link'].
		// Skip non-element paths like just ['styles'].
		$is_processing_element = in_array( 'elements', $block_metadata['path'], true );

		$current_element = $is_processing_element ? $block_metadata['path'][ count( $block_metadata['path'] ) - 1 ] : null;

		$element_pseudo_allowed = isset( static::VALID_ELEMENT_PSEUDO_SELECTORS[ $current_element ] ) ? static::VALID_ELEMENT_PSEUDO_SELECTORS[ $current_element ] : array();

		// Check for allowed pseudo classes (e.g. ":hover") from the $selector ("a:hover").
		// This also resets the array keys.
		$pseudo_matches = array_values(
			array_filter(
				$element_pseudo_allowed,
				function( $pseudo_selector ) use ( $selector ) {
					return str_contains( $selector, $pseudo_selector );
				}
			)
		);

		$pseudo_selector = isset( $pseudo_matches[0] ) ? $pseudo_matches[0] : null;

		// If the current selector is a pseudo selector that's defined in the allow list for the current
		// element then compute the style properties for it.
		// Otherwise just compute the styles for the default selector as normal.
		if ( $pseudo_selector && isset( $node[ $pseudo_selector ] ) && isset( static::VALID_ELEMENT_PSEUDO_SELECTORS[ $current_element ] ) && in_array( $pseudo_selector, static::VALID_ELEMENT_PSEUDO_SELECTORS[ $current_element ], true ) ) {
			$declarations = static::compute_style_properties( $node[ $pseudo_selector ], $settings, null, $this->theme_json );
		} else {
			$declarations = static::compute_style_properties( $node, $settings, null, $this->theme_json );
		}

		$block_rules = '';

		// 1. Separate the ones who use the general selector
		// and the ones who use the duotone selector.
		$declarations_duotone = array();
		foreach ( $declarations as $index => $declaration ) {
			if ( 'filter' === $declaration['name'] ) {
				unset( $declarations[ $index ] );
				$declarations_duotone[] = $declaration;
			}
		}

		/*
		 * Reset default browser margin on the root body element.
		 * This is set on the root selector **before** generating the ruleset
		 * from the `theme.json`. This is to ensure that if the `theme.json` declares
		 * `margin` in its `spacing` declaration for the `body` element then these
		 * user-generated values take precedence in the CSS cascade.
		 * @link https://github.com/WordPress/gutenberg/issues/36147.
		 */
		if ( static::ROOT_BLOCK_SELECTOR === $selector ) {
			$block_rules .= 'body { margin: 0; }';
		}

		// 2. Generate and append the rules that use the general selector.
		$block_rules .= static::to_ruleset( $selector, $declarations );

		// 3. Generate and append the rules that use the duotone selector.
		if ( isset( $block_metadata['duotone'] ) && ! empty( $declarations_duotone ) ) {
			$selector_duotone = static::scope_selector( $block_metadata['selector'], $block_metadata['duotone'] );
			$block_rules     .= static::to_ruleset( $selector_duotone, $declarations_duotone );
		}

		// 4. Generate Layout block gap styles.
		if (
			static::ROOT_BLOCK_SELECTOR !== $selector &&
			! empty( $block_metadata['name'] )
		) {
			$block_rules .= $this->get_layout_styles( $block_metadata );
		}

		if ( static::ROOT_BLOCK_SELECTOR === $selector ) {
			$block_gap_value = _wp_array_get( $this->theme_json, array( 'styles', 'spacing', 'blockGap' ), '0.5em' );

			$block_rules .= '.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }';
			$block_rules .= '.wp-site-blocks > .alignright { float: right; margin-left: 2em; }';
			$block_rules .= '.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

			$has_block_gap_support = _wp_array_get( $this->theme_json, array( 'settings', 'spacing', 'blockGap' ) ) !== null;
			if ( $has_block_gap_support ) {
				$block_rules .= '.wp-site-blocks > * { margin-block-start: 0; margin-block-end: 0; }';
				$block_rules .= ".wp-site-blocks > * + * { margin-block-start: $block_gap_value; }";
				// For backwards compatibility, ensure the legacy block gap CSS variable is still available.
				$block_rules .= "$selector { --wp--style--block-gap: $block_gap_value; }";
			}
			$block_rules .= $this->get_layout_styles( $block_metadata );
		}

		return $block_rules;
	}

	/**
	 * Converts each style section into a list of rulesets
	 * containing the block styles to be appended to the stylesheet.
	 *
	 * See glossary at https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax
	 *
	 * For each section this creates a new ruleset such as:
	 *
	 *   block-selector {
	 *     style-property-one: value;
	 *   }
	 *
	 * @param array $style_nodes Nodes with styles.
	 * @return string The new stylesheet.
	 */
	protected function get_block_classes( $style_nodes ) {
		$block_rules = '';

		foreach ( $style_nodes as $metadata ) {
			if ( null === $metadata['selector'] ) {
				continue;
			}
			$block_rules .= static::get_styles_for_block( $metadata );
		}

		return $block_rules;
	}

	/**
	 * Given a styles array, it extracts the style properties
	 * and adds them to the $declarations array following the format:
	 *
	 * ```php
	 * array(
	 *   'name'  => 'property_name',
	 *   'value' => 'property_value,
	 * )
	 * ```
	 *
	 * @param array $styles Styles to process.
	 * @param array $settings Theme settings.
	 * @param array $properties Properties metadata.
	 * @param array $theme_json Theme JSON array.
	 * @return array Returns the modified $declarations.
	 */
	protected static function compute_style_properties( $styles, $settings = array(), $properties = null, $theme_json = null ) {
		if ( null === $properties ) {
			$properties = static::PROPERTIES_METADATA;
		}

		$declarations = array();
		if ( empty( $styles ) ) {
			return $declarations;
		}

		foreach ( $properties as $css_property => $value_path ) {
			$value = static::get_property_value( $styles, $value_path, $theme_json );

			// Look up protected properties, keyed by value path.
			// Skip protected properties that are explicitly set to `null`.
			if ( is_array( $value_path ) ) {
				$path_string = implode( '.', $value_path );
				if (
					array_key_exists( $path_string, static::PROTECTED_PROPERTIES ) &&
					_wp_array_get( $settings, static::PROTECTED_PROPERTIES[ $path_string ], null ) === null
				) {
					continue;
				}
			}

			// Skip if empty and not "0" or value represents array of longhand values.
			$has_missing_value = empty( $value ) && ! is_numeric( $value );
			if ( $has_missing_value || is_array( $value ) ) {
				continue;
			}

			$declarations[] = array(
				'name'  => $css_property,
				'value' => $value,
			);
		}

		return $declarations;
	}

	/**
	 * Returns the style property for the given path.
	 *
	 * It also converts CSS Custom Property stored as
	 * "var:preset|color|secondary" to the form
	 * "--wp--preset--color--secondary".
	 *
	 * It also converts references to a path to the value
	 * stored at that location, e.g.
	 * { "ref": "style.color.background" } => "#fff".
	 *
	 * @param array $styles Styles subtree.
	 * @param array $path   Which property to process.
	 * @param array $theme_json Theme JSON array.
	 * @return string Style property value.
	 */
	protected static function get_property_value( $styles, $path, $theme_json = null ) {
		$value = _wp_array_get( $styles, $path, '' );

		// This converts references to a path to the value at that path
		// where the values is an array with a "ref" key, pointing to a path.
		// For example: { "ref": "style.color.background" } => "#fff".
		if ( is_array( $value ) && array_key_exists( 'ref', $value ) ) {
			$value_path = explode( '.', $value['ref'] );
			$ref_value  = _wp_array_get( $theme_json, $value_path );
			// Only use the ref value if we find anything.
			if ( ! empty( $ref_value ) && is_string( $ref_value ) ) {
				$value = $ref_value;
			}

			if ( is_array( $ref_value ) && array_key_exists( 'ref', $ref_value ) ) {
				$path_string      = json_encode( $path );
				$ref_value_string = json_encode( $ref_value );
				_doing_it_wrong( 'get_property_value', "Your theme.json file uses a dynamic value (${ref_value_string}) for the path at ${path_string}. However, the value at ${path_string} is also a dynamic value (pointing to ${ref_value['ref']}) and pointing to another dynamic value is not supported. Please update ${path_string} to point directly to ${ref_value['ref']}.", '6.1.0' );
			}
		}

		if ( '' === $value || is_array( $value ) ) {
			return $value;
		}

		// Convert custom CSS properties.
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
	 * - path             => Where to find the preset within the settings section.
	 * - prevent_override => Disables override of default presets by theme presets.
	 *                       The relationship between whether to override the defaults
	 *                       and whether the defaults are enabled is inverse:
	 *                         - If defaults are enabled  => theme presets should not be overriden
	 *                         - If defaults are disabled => theme presets should be overriden
	 *                       For example, a theme sets defaultPalette to false,
	 *                       making the default palette hidden from the user.
	 *                       In that case, we want all the theme presets to be present,
	 *                       so they should override the defaults by setting this false.
	 * - use_default_names => whether to use the default names
	 * - value_key        => the key that represents the value
	 * - value_func       => optionally, instead of value_key, a function to generate
	 *                       the value that takes a preset as an argument
	 *                       (either value_key or value_func should be present)
	 * - css_vars         => template string to use in generating the CSS Custom Property.
	 *                       Example output: "--wp--preset--duotone--blue: <value>" will generate as many CSS Custom Properties as presets defined
	 *                       substituting the $slug for the slug's value for each preset value.
	 * - classes          => array containing a structure with the classes to
	 *                       generate for the presets, where for each array item
	 *                       the key is the class name and the value the property name.
	 *                       The "$slug" substring will be replaced by the slug of each preset.
	 *                       For example:
	 *                       'classes' => array(
	 *                         '.has-$slug-color'            => 'color',
	 *                         '.has-$slug-background-color' => 'background-color',
	 *                         '.has-$slug-border-color'     => 'border-color',
	 *                       )
	 * - properties       => array of CSS properties to be used by kses to
	 *                       validate the content of each preset
	 *                       by means of the remove_insecure_properties method.
	 */
	const PRESETS_METADATA = array(
		array(
			'path'              => array( 'color', 'palette' ),
			'prevent_override'  => array( 'color', 'defaultPalette' ),
			'use_default_names' => false,
			'value_key'         => 'color',
			'css_vars'          => '--wp--preset--color--$slug',
			'classes'           => array(
				'.has-$slug-color'            => 'color',
				'.has-$slug-background-color' => 'background-color',
				'.has-$slug-border-color'     => 'border-color',
			),
			'properties'        => array( 'color', 'background-color', 'border-color' ),
		),
		array(
			'path'              => array( 'color', 'gradients' ),
			'prevent_override'  => array( 'color', 'defaultGradients' ),
			'use_default_names' => false,
			'value_key'         => 'gradient',
			'css_vars'          => '--wp--preset--gradient--$slug',
			'classes'           => array( '.has-$slug-gradient-background' => 'background' ),
			'properties'        => array( 'background' ),
		),
		array(
			'path'              => array( 'color', 'duotone' ),
			'prevent_override'  => array( 'color', 'defaultDuotone' ),
			'use_default_names' => false,
			'value_func'        => 'gutenberg_get_duotone_filter_property',
			'css_vars'          => '--wp--preset--duotone--$slug',
			'classes'           => array(),
			'properties'        => array( 'filter' ),
		),
		array(
			'path'              => array( 'typography', 'fontSizes' ),
			'prevent_override'  => false,
			'use_default_names' => true,
			'value_key'         => 'size',
			'css_vars'          => '--wp--preset--font-size--$slug',
			'classes'           => array( '.has-$slug-font-size' => 'font-size' ),
			'properties'        => array( 'font-size' ),
		),
		array(
			'path'              => array( 'typography', 'fontFamilies' ),
			'prevent_override'  => false,
			'use_default_names' => false,
			'value_key'         => 'fontFamily',
			'css_vars'          => '--wp--preset--font-family--$slug',
			'classes'           => array( '.has-$slug-font-family' => 'font-family' ),
			'properties'        => array( 'font-family' ),
		),
		array(
			'path'              => array( 'spacing', 'spacingSizes' ),
			'prevent_override'  => false,
			'use_default_names' => true,
			'value_key'         => 'size',
			'css_vars'          => '--wp--preset--spacing--$slug',
			'classes'           => array(),
			'properties'        => array( 'padding', 'margin' ),
		),
		array(
			'path'              => array( 'spacing', 'spacingScale' ),
			'prevent_override'  => false,
			'use_default_names' => true,
			'value_key'         => 'size',
			'css_vars'          => '--wp--preset--spacing--$slug',
			'classes'           => array(),
			'properties'        => array( 'padding', 'margin' ),
		),
	);

	/**
	 * The valid properties under the settings key.
	 *
	 * @var array
	 */
	const VALID_SETTINGS = array(
		'appearanceTools' => null,
		'border'          => array(
			'color'  => null,
			'radius' => null,
			'style'  => null,
			'width'  => null,
		),
		'color'           => array(
			'background'       => null,
			'custom'           => null,
			'customDuotone'    => null,
			'customGradient'   => null,
			'defaultDuotone'   => null,
			'defaultGradients' => null,
			'defaultPalette'   => null,
			'duotone'          => null,
			'gradients'        => null,
			'link'             => null,
			'palette'          => null,
			'text'             => null,
		),
		'custom'          => null,
		'layout'          => array(
			'contentSize' => null,
			'definitions' => null,
			'wideSize'    => null,
		),
		'spacing'         => array(
			'customSpacingSize' => null,
			'spacingSizes'      => null,
			'spacingScale'      => null,
			'blockGap'          => null,
			'margin'            => null,
			'padding'           => null,
			'units'             => null,
		),
		'typography'      => array(
			'customFontSize' => null,
			'dropCap'        => null,
			'fontFamilies'   => null,
			'fontSizes'      => null,
			'fontStyle'      => null,
			'fontWeight'     => null,
			'letterSpacing'  => null,
			'lineHeight'     => null,
			'textDecoration' => null,
			'textTransform'  => null,
		),
	);

	/**
	 * Transform the spacing scale values into an array of spacing scale presets.
	 */
	public function set_spacing_sizes() {
		$spacing_scale = _wp_array_get( $this->theme_json, array( 'settings', 'spacing', 'spacingScale' ), array() );

		if ( ! is_numeric( $spacing_scale['steps'] )
			|| ! $spacing_scale['steps'] > 0
			|| ! isset( $spacing_scale['mediumStep'] )
			|| ! isset( $spacing_scale['unit'] )
			|| ! isset( $spacing_scale['operator'] )
			|| ! isset( $spacing_scale['increment'] )
			|| ! isset( $spacing_scale['steps'] )
			|| ! is_numeric( $spacing_scale['increment'] )
			|| ! is_numeric( $spacing_scale['mediumStep'] )
			|| ( '+' !== $spacing_scale['operator'] && '*' !== $spacing_scale['operator'] ) ) {
			if ( ! empty( $spacing_scale ) ) {
				trigger_error( __( 'Some of the theme.json settings.spacing.spacingScale values are invalid', 'gutenberg' ), E_USER_NOTICE );
			}
			return null;
		}

		$unit            = sanitize_title( $spacing_scale['unit'] );
		$current_step    = $spacing_scale['mediumStep'];
		$steps_mid_point = round( ( ( $spacing_scale['steps'] ) / 2 ), 0 );
		$x_small_count   = null;
		$below_sizes     = array();
		$slug            = 40;
		$remainder       = 0;

		for ( $x = $steps_mid_point - 1; $spacing_scale['steps'] > 1 && $slug > 0 && $x > 0; $x-- ) {
			$current_step = '+' === $spacing_scale['operator']
				? $current_step - $spacing_scale['increment']
				: ( $spacing_scale['increment'] > 1 ? $current_step / $spacing_scale['increment'] : $current_step * $spacing_scale['increment'] );

			if ( $current_step <= 0 ) {
				$remainder = $x;
				break;
			}

			$below_sizes[] = array(
				/* translators: %s: Muliple of t-shirt sizing, eg. 2X-Small */
				'name' => $x === $steps_mid_point - 1 ? __( 'Small', 'gutenberg' ) : sprintf( __( '%sX-Small', 'gutenberg' ), strval( $x_small_count ) ),
				'slug' => $slug,
				'size' => round( $current_step, 2 ) . $unit,
			);

			if ( $x === $steps_mid_point - 2 ) {
				$x_small_count = 2;
			}

			if ( $x < $steps_mid_point - 2 ) {
				$x_small_count++;
			}

			$slug = $slug - 10;
		}

		$below_sizes = array_reverse( $below_sizes );

		$below_sizes[] = array(
			'name' => __( 'Medium', 'gutenberg' ),
			'slug' => 50,
			'size' => $spacing_scale['mediumStep'] . $unit,
		);

		$current_step  = $spacing_scale['mediumStep'];
		$x_large_count = null;
		$above_sizes   = array();
		$slug          = 60;
		$steps_above   = ( $spacing_scale['steps'] - $steps_mid_point ) + $remainder;

		for ( $x = 0; $x < $steps_above; $x++ ) {
			$current_step = '+' === $spacing_scale['operator']
				? $current_step + $spacing_scale['increment']
				: ( $spacing_scale['increment'] >= 1 ? $current_step * $spacing_scale['increment'] : $current_step / $spacing_scale['increment'] );

			$above_sizes[] = array(
				/* translators: %s: Muliple of t-shirt sizing, eg. 2X-Large */
				'name' => 0 === $x ? __( 'Large', 'gutenberg' ) : sprintf( __( '%sX-Large', 'gutenberg' ), strval( $x_large_count ) ),
				'slug' => $slug,
				'size' => round( $current_step, 2 ) . $unit,
			);

			if ( 1 === $x ) {
				$x_large_count = 2;
			}

			if ( $x > 1 ) {
				$x_large_count++;
			}

			$slug = $slug + 10;
		}

		_wp_array_set( $this->theme_json, array( 'settings', 'spacing', 'spacingSizes', 'default' ), array_merge( $below_sizes, $above_sizes ) );
	}

	/**
	 * Get the CSS layout rules for a particular block from theme.json layout definitions.
	 *
	 * @param array $block_metadata Metadata about the block to get styles for.
	 *
	 * @return string Layout styles for the block.
	 */
	protected function get_layout_styles( $block_metadata ) {
		$block_rules = '';
		$block_type  = null;

		if ( isset( $block_metadata['name'] ) ) {
			$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_metadata['name'] );
			if ( ! block_has_support( $block_type, array( '__experimentalLayout' ), false ) ) {
				return $block_rules;
			}
		}

		$selector                 = isset( $block_metadata['selector'] ) ? $block_metadata['selector'] : '';
		$has_block_gap_support    = _wp_array_get( $this->theme_json, array( 'settings', 'spacing', 'blockGap' ) ) !== null;
		$has_fallback_gap_support = ! $has_block_gap_support; // This setting isn't useful yet: it exists as a placeholder for a future explicit fallback gap styles support.
		$node                     = _wp_array_get( $this->theme_json, $block_metadata['path'], array() );
		$layout_definitions       = _wp_array_get( $this->theme_json, array( 'settings', 'layout', 'definitions' ), array() );
		$layout_selector_pattern  = '/^[a-zA-Z0-9\-\.\ *+>]*$/'; // Allow alphanumeric classnames, spaces, wildcard, sibling, and child combinator selectors.

		// Gap styles will only be output if the theme has block gap support, or supports a fallback gap.
		// Default layout gap styles will be skipped for themes that do not explicitly opt-in to blockGap with a `true` or `false` value.
		if ( $has_block_gap_support || $has_fallback_gap_support ) {
			$block_gap_value = null;
			// Use a fallback gap value if block gap support is not available.
			if ( ! $has_block_gap_support ) {
				$block_gap_value = static::ROOT_BLOCK_SELECTOR === $selector ? '0.5em' : null;
				if ( ! empty( $block_type ) ) {
					$block_gap_value = _wp_array_get( $block_type->supports, array( 'spacing', 'blockGap', '__experimentalDefault' ), null );
				}
			} else {
				$block_gap_value = _wp_array_get( $node, array( 'spacing', 'blockGap' ), null );
			}

			// Support split row / column values and concatenate to a shorthand value.
			if ( is_array( $block_gap_value ) ) {
				if ( isset( $block_gap_value['top'] ) && isset( $block_gap_value['left'] ) ) {
					$gap_row         = $block_gap_value['top'];
					$gap_column      = $block_gap_value['left'];
					$block_gap_value = $gap_row === $gap_column ? $gap_row : $gap_row . ' ' . $gap_column;
				} else {
					// Skip outputting gap value if not all sides are provided.
					$block_gap_value = null;
				}
			}

			if ( $block_gap_value ) {
				foreach ( $layout_definitions as $layout_definition_key => $layout_definition ) {
					// Allow skipping default layout for themes that opt-in to block styles, but opt-out of blockGap.
					if ( ! $has_block_gap_support && 'default' === $layout_definition_key ) {
						continue;
					}

					$class_name    = sanitize_title( _wp_array_get( $layout_definition, array( 'className' ), false ) );
					$spacing_rules = _wp_array_get( $layout_definition, array( 'spacingStyles' ), array() );

					if (
						! empty( $class_name ) &&
						! empty( $spacing_rules )
					) {
						foreach ( $spacing_rules as $spacing_rule ) {
							$declarations = array();
							if (
								isset( $spacing_rule['selector'] ) &&
								preg_match( $layout_selector_pattern, $spacing_rule['selector'] ) &&
								! empty( $spacing_rule['rules'] )
							) {
								// Iterate over each of the styling rules and substitute non-string values such as `null` with the real `blockGap` value.
								foreach ( $spacing_rule['rules'] as $css_property => $css_value ) {
									$current_css_value = is_string( $css_value ) ? $css_value : $block_gap_value;
									if ( static::is_safe_css_declaration( $css_property, $current_css_value ) ) {
										$declarations[] = array(
											'name'  => $css_property,
											'value' => $current_css_value,
										);
									}
								}

								$format          = static::ROOT_BLOCK_SELECTOR === $selector ? '%s .%s%s' : '%s.%s%s';
								$layout_selector = sprintf(
									$format,
									$selector,
									$class_name,
									$spacing_rule['selector']
								);
								$block_rules    .= static::to_ruleset( $layout_selector, $declarations );
							}
						}
					}
				}
			}
		}

		// Output base styles.
		if (
			static::ROOT_BLOCK_SELECTOR === $selector
		) {
			$valid_display_modes = array( 'block', 'flex', 'grid' );
			foreach ( $layout_definitions as $layout_definition ) {
				$class_name       = sanitize_title( _wp_array_get( $layout_definition, array( 'className' ), false ) );
				$base_style_rules = _wp_array_get( $layout_definition, array( 'baseStyles' ), array() );

				if (
					! empty( $class_name ) &&
					! empty( $base_style_rules )
				) {
					// Output display mode. This requires special handling as `display` is not exposed in `safe_style_css_filter`.
					if (
						! empty( $layout_definition['displayMode'] ) &&
						is_string( $layout_definition['displayMode'] ) &&
						in_array( $layout_definition['displayMode'], $valid_display_modes, true )
					) {
						$layout_selector = sprintf(
							'%s .%s',
							$selector,
							$class_name
						);
						$block_rules    .= static::to_ruleset(
							$layout_selector,
							array(
								array(
									'name'  => 'display',
									'value' => $layout_definition['displayMode'],
								),
							)
						);
					}

					foreach ( $base_style_rules as $base_style_rule ) {
						$declarations = array();

						if (
							isset( $base_style_rule['selector'] ) &&
							preg_match( $layout_selector_pattern, $base_style_rule['selector'] ) &&
							! empty( $base_style_rule['rules'] )
						) {
							foreach ( $base_style_rule['rules'] as $css_property => $css_value ) {
								if ( static::is_safe_css_declaration( $css_property, $css_value ) ) {
									$declarations[] = array(
										'name'  => $css_property,
										'value' => $css_value,
									);
								}
							}

							$layout_selector = sprintf(
								'%s .%s%s',
								$selector,
								$class_name,
								$base_style_rule['selector']
							);
							$block_rules    .= static::to_ruleset( $layout_selector, $declarations );
						}
					}
				}
			}
		}
		return $block_rules;
	}
}
