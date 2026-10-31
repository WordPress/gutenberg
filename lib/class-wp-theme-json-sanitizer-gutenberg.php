<?php
/**
 * WP_Theme_JSON_Sanitizer_Gutenberg class
 *
 * @package gutenberg
 * @since 7.2.0
 */

if ( class_exists( 'WP_Theme_JSON_Sanitizer_Gutenberg' ) ) {
	return;
}

/**
 * Class that sanitizes theme.json structures against the schema derived from
 * `WP_Theme_JSON_Gutenberg` constants and the registered blocks, elements and style variations.
 *
 * This class is for internal core usage and is not supposed to be used by extenders (plugins and/or themes).
 * This is a low-level API that may need to do breaking changes. Please,
 * use gutenberg_get_global_settings, gutenberg_get_global_styles, and gutenberg_get_global_stylesheet instead.
 *
 * @since 7.2.0
 * @access private
 */
class WP_Theme_JSON_Sanitizer_Gutenberg {

	/**
	 * Diagnostics collected during the current `collect()` call, or null when not collecting.
	 *
	 * Null is the normal state. Sanitization only records what it drops while a `collect()`
	 * callback runs, so the ordinary paths do no extra work.
	 *
	 * @since 7.2.0
	 * @var array[]|null
	 */
	private static $diagnostics = null;

	/**
	 * Sanitizes the input according to the schemas.
	 *
	 * @since 5.8.0
	 * @since 5.9.0 Added the `$valid_block_names` and `$valid_element_name` parameters.
	 * @since 6.6.0 Extended schema definition to allow enhanced block style variations.
	 * @since 7.1.1 Updated schema to allow responsive breakpoint states and pseudo-selectors
	 *              at the top level of `styles` for block style variation partials.
	 *
	 * @param array $input               Structure to sanitize.
	 * @param array $valid_block_names   List of valid block names.
	 * @param array $valid_element_names List of valid element names.
	 * @param array $valid_variations    List of valid variations per block.
	 * @return array The sanitized output.
	 */
	public static function sanitize( $input, $valid_block_names, $valid_element_names, $valid_variations ) {

		$output = array();

		if ( ! is_array( $input ) ) {
			static::add_diagnostic( 'theme_json_expected_object', array() );
			return $output;
		}

		// Preserve only the top most level keys.
		$output = array_intersect_key( $input, array_flip( WP_Theme_JSON_Gutenberg::VALID_TOP_LEVEL_KEYS ) );

		if ( null !== self::$diagnostics ) {
			foreach ( array_keys( array_diff_key( $input, $output ) ) as $key ) {
				// `$schema` only points editors at the published JSON Schema, so dropping it is expected.
				if ( '$schema' !== $key ) {
					static::add_diagnostic( 'theme_json_unknown_key', array( $key ) );
				}
			}
			// The schema below only covers registered names, so report these before they vanish as unknown keys.
			$input = static::report_unregistered_names( $input, $valid_block_names, $valid_variations );
		}

		/*
		 * Remove any rules that are annotated as "top" in VALID_STYLES constant.
		 * Some styles are only meant to be available at the top-level (e.g.: blockGap),
		 * hence, the schema for blocks & elements should not have them.
		 */
		$styles_non_top_level = WP_Theme_JSON_Gutenberg::VALID_STYLES;
		foreach ( array_keys( $styles_non_top_level ) as $section ) {
			// array_key_exists() needs to be used instead of isset() because the value can be null.
			if ( array_key_exists( $section, $styles_non_top_level ) && is_array( $styles_non_top_level[ $section ] ) ) {
				foreach ( array_keys( $styles_non_top_level[ $section ] ) as $prop ) {
					if ( 'top' === $styles_non_top_level[ $section ][ $prop ] ) {
						unset( $styles_non_top_level[ $section ][ $prop ] );
					}
				}
			}
		}

		// Build the schema based on valid block & element names.
		$schema                   = array();
		$schema_styles_elements   = array();
		$responsive_media_queries = WP_Theme_JSON_Gutenberg::get_viewport_media_queries( $input['settings']['viewport'] ?? null );

		/*
		 * Set allowed element pseudo selectors and responsive breakpoint states.
		 * Target data structure in schema:
		 * e.g.
		 * - top level elements: `$schema['styles']['elements']['link'][':hover']`.
		 * - block level elements: `$schema['styles']['blocks']['core/button']['elements']['link'][':hover']`.
		 * - block responsive elements: `$schema['styles']['blocks']['core/button']['@tablet']['elements']['link'][':hover']`.
		 */
		foreach ( $valid_element_names as $element ) {
			$schema_styles_elements[ $element ] = $styles_non_top_level;

			if ( isset( WP_Theme_JSON_Gutenberg::VALID_ELEMENT_PSEUDO_SELECTORS[ $element ] ) ) {
				foreach ( WP_Theme_JSON_Gutenberg::VALID_ELEMENT_PSEUDO_SELECTORS[ $element ] as $pseudo_selector ) {
					$schema_styles_elements[ $element ][ $pseudo_selector ] = $styles_non_top_level;
				}
			}

			// Add responsive breakpoint states for elements.
			foreach ( array_keys( $responsive_media_queries ) as $breakpoint_state ) {
				$schema_styles_elements[ $element ][ $breakpoint_state ] = $styles_non_top_level;
			}
		}

		$schema_styles_blocks   = array();
		$schema_settings_blocks = array();
		$breakpoint_states      = array_keys( $responsive_media_queries );

		$common_block_settings = WP_Theme_JSON_Gutenberg::VALID_SETTINGS;
		// `viewport` and `blockVisibility` are global-only settings and cannot be set per block for now.
		unset(
			$common_block_settings['viewport'],
			$common_block_settings['blockVisibility']
		);

		/*
		 * Generate a schema for blocks.
		 * - Block styles can contain `elements`, `variations`, and responsive breakpoint state definitions.
		 * - Variations definitions cannot be nested.
		 * - Variations can contain styles for inner `blocks`, `elements`, and responsive breakpoint states.
		 * - Variation inner `blocks` styles can contain `elements` and responsive breakpoint states.
		 *
		 * As each variation needs both a `blocks` schema and responsive `blocks` schemas
		 * for further nested inner `blocks`, the overall schema is generated in multiple passes.
		 *
		 * All blocks start with the same style schema. Build that common schema
		 * once, then add block-specific pseudo and custom states below.
		 */
		$responsive_block_schema             = $styles_non_top_level;
		$responsive_block_schema['elements'] = $schema_styles_elements;

		$common_block_schema             = $styles_non_top_level;
		$common_block_schema['elements'] = $schema_styles_elements;

		foreach ( $breakpoint_states as $breakpoint_state ) {
			$common_block_schema[ $breakpoint_state ] = $responsive_block_schema;
		}

		foreach ( $valid_block_names as $block ) {
			$schema_settings_blocks[ $block ] = $common_block_settings;
			$schema_styles_blocks[ $block ]   = $common_block_schema;

			// Add responsive pseudo-selectors only to blocks that support them.
			if ( isset( WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS[ $block ] ) ) {
				foreach ( $breakpoint_states as $breakpoint_state ) {
					foreach ( WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS[ $block ] as $pseudo_selector ) {
						$schema_styles_blocks[ $block ][ $breakpoint_state ][ $pseudo_selector ] = $styles_non_top_level;
					}
				}
			}

			// Add pseudo-selectors for blocks that support them.
			if ( isset( WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS[ $block ] ) ) {
				foreach ( WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS[ $block ] as $pseudo_selector ) {
					$schema_styles_blocks[ $block ][ $pseudo_selector ] = $styles_non_top_level;
				}
			}

			// Add custom states for blocks that support them (e.g. '-current' for navigation).
			if ( isset( WP_Theme_JSON_Gutenberg::VALID_BLOCK_CUSTOM_STATES[ $block ] ) ) {
				foreach ( WP_Theme_JSON_Gutenberg::VALID_BLOCK_CUSTOM_STATES[ $block ] as $custom_state ) {
					$custom_state_schema = $styles_non_top_level;
					// The same pseudo-selectors valid for the block at the top level
					// are also valid within each custom state.
					if ( isset( WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS[ $block ] ) ) {
						foreach ( WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS[ $block ] as $pseudo ) {
							$custom_state_schema[ $pseudo ] = $styles_non_top_level;
						}
					}
					$schema_styles_blocks[ $block ][ $custom_state ] = $custom_state_schema;
				}
			}
		}

		$block_style_variation_styles             = WP_Theme_JSON_Gutenberg::VALID_STYLES;
		$block_style_variation_styles['blocks']   = $schema_styles_blocks;
		$block_style_variation_styles['elements'] = $schema_styles_elements;

		foreach ( $valid_block_names as $block ) {
			// Build the schema for each block style variation.
			$style_variation_names = array();
			if (
				! empty( $input['styles']['blocks'][ $block ]['variations'] ) &&
				is_array( $input['styles']['blocks'][ $block ]['variations'] ) &&
				isset( $valid_variations[ $block ] )
			) {
				$style_variation_names = array_intersect(
					array_keys( $input['styles']['blocks'][ $block ]['variations'] ),
					$valid_variations[ $block ]
				);
			}

			$schema_styles_variations = array();
			if ( ! empty( $style_variation_names ) ) {
				foreach ( $style_variation_names as $variation_name ) {
					$variation_schema = $block_style_variation_styles;

					// Add responsive breakpoint states to block style variations.
					foreach ( array_keys( $responsive_media_queries ) as $breakpoint_state ) {
						$variation_schema[ $breakpoint_state ]             = $styles_non_top_level;
						$variation_schema[ $breakpoint_state ]['elements'] = $schema_styles_elements;

						if ( isset( WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS[ $block ] ) ) {
							foreach ( WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS[ $block ] as $pseudo_selector ) {
								$variation_schema[ $breakpoint_state ][ $pseudo_selector ] = $styles_non_top_level;
							}
						}
					}

					// Add pseudo-selectors to variations for blocks that support them.
					if ( isset( WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS[ $block ] ) ) {
						foreach ( WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS[ $block ] as $pseudo_selector ) {
							$variation_schema[ $pseudo_selector ] = $styles_non_top_level;
						}
					}

					$schema_styles_variations[ $variation_name ] = $variation_schema;
				}
			}

			$schema_styles_blocks[ $block ]['variations'] = $schema_styles_variations;
		}

		$schema['styles']                                 = WP_Theme_JSON_Gutenberg::VALID_STYLES;
		$schema['styles']['blocks']                       = $schema_styles_blocks;
		$schema['styles']['elements']                     = $schema_styles_elements;
		$schema['settings']                               = WP_Theme_JSON_Gutenberg::VALID_SETTINGS;
		$schema['settings']['blocks']                     = $schema_settings_blocks;
		$schema['settings']['typography']['fontFamilies'] = static::schema_in_root_and_per_origin( WP_Theme_JSON_Gutenberg::FONT_FAMILY_SCHEMA );

		/*
		 * Add block style variation states to the top-level styles schema.
		 *
		 * Block style variations defined in a standalone JSON partial within a
		 * theme's `styles` directory declare their styles at the root of the
		 * `styles` object, so they are sanitized against the top-level schema.
		 * It needs to allow the same states that are allowed for variations
		 * declared inline in theme.json, otherwise those states are silently
		 * removed as unknown keys.
		 *
		 * The `blockTypes` property is only present on block style variation
		 * partials, so it both identifies the config as a variation and
		 * determines which pseudo-selectors are valid for it. Regular
		 * theme.json files are unaffected.
		 */
		if ( ! empty( $input['blockTypes'] ) && is_array( $input['blockTypes'] ) ) {
			$variation_pseudo_selectors = array();
			foreach ( $input['blockTypes'] as $variation_block_type ) {
				if ( is_string( $variation_block_type ) && isset( WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS[ $variation_block_type ] ) ) {
					$variation_pseudo_selectors = array_merge(
						$variation_pseudo_selectors,
						WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS[ $variation_block_type ]
					);
				}
			}
			$variation_pseudo_selectors = array_unique( $variation_pseudo_selectors );

			foreach ( $breakpoint_states as $breakpoint_state ) {
				$schema['styles'][ $breakpoint_state ]             = $styles_non_top_level;
				$schema['styles'][ $breakpoint_state ]['elements'] = $schema_styles_elements;

				foreach ( $variation_pseudo_selectors as $pseudo_selector ) {
					$schema['styles'][ $breakpoint_state ][ $pseudo_selector ] = $styles_non_top_level;
				}
			}

			foreach ( $variation_pseudo_selectors as $pseudo_selector ) {
				$schema['styles'][ $pseudo_selector ] = $styles_non_top_level;
			}
		}

		// Remove anything that's not present in the schema.
		foreach ( array( 'styles', 'settings' ) as $subtree ) {
			if ( ! isset( $input[ $subtree ] ) ) {
				continue;
			}

			if ( ! is_array( $input[ $subtree ] ) ) {
				static::add_diagnostic( 'theme_json_expected_object', array( $subtree ) );
				unset( $output[ $subtree ] );
				continue;
			}

			$result = static::remove_keys_not_in_schema( $input[ $subtree ], $schema[ $subtree ], array( $subtree ) );

			if ( 'settings' === $subtree ) {
				// Presets live at the root of `settings` and under each `settings.blocks.<name>`.
				$preset_node_paths = array( array() );
				if ( isset( $result['blocks'] ) && is_array( $result['blocks'] ) ) {
					foreach ( array_keys( $result['blocks'] ) as $block_name ) {
						$preset_node_paths[] = array( 'blocks', $block_name );
					}
				}
				foreach ( $preset_node_paths as $node_path ) {
					foreach ( WP_Theme_JSON_Gutenberg::PRESETS_METADATA as $preset_metadata ) {
						$path    = array_merge( $node_path, $preset_metadata['path'] );
						$presets = _wp_array_get( $result, $path, null );
						if ( ! is_array( $presets ) ) {
							continue;
						}
						if ( isset( $presets[0] ) ) {
							$presets = static::remove_invalid_preset_items( $presets, array_merge( array( 'settings' ), $path ) );
						} else {
							foreach ( WP_Theme_JSON_Gutenberg::VALID_ORIGINS as $origin ) {
								if ( isset( $presets[ $origin ] ) && is_array( $presets[ $origin ] ) ) {
									$presets[ $origin ] = static::remove_invalid_preset_items( $presets[ $origin ], array_merge( array( 'settings' ), $path, array( $origin ) ) );
								}
							}
						}
						_wp_array_set( $result, $path, $presets );
					}
				}
			}

			if ( 'settings' === $subtree && array_key_exists( 'viewport', $input[ $subtree ] ) ) {
				$result['viewport'] = static::sanitize_viewport_settings( $input[ $subtree ]['viewport'] );

				if ( null !== self::$diagnostics && $result['viewport'] !== $input[ $subtree ]['viewport'] ) {
					static::add_diagnostic( 'theme_json_invalid_viewport', array( 'settings', 'viewport' ) );
				}
			}

			if ( empty( $result ) ) {
				unset( $output[ $subtree ] );
			} else {
				$output[ $subtree ] = static::resolve_custom_css_format( $result );
			}
		}

		return $output;
	}

	/**
	 * Removes preset items that are not objects, or whose slug is not scalar, and reports them.
	 *
	 * Preset leaves are untyped in VALID_SETTINGS, but consumers read `$preset['slug']` as a string.
	 *
	 * @since 7.2.0
	 *
	 * @param array $items Preset items.
	 * @param array $path  Path of the list within the theme.json structure, used in diagnostics.
	 * @return array The valid items, re-indexed.
	 */
	private static function remove_invalid_preset_items( $items, $path ) {
		$valid = array();

		foreach ( $items as $index => $item ) {
			if ( ! is_array( $item ) ) {
				static::add_diagnostic( 'theme_json_expected_object', array_merge( $path, array( $index ) ) );
				continue;
			}
			if ( isset( $item['slug'] ) && ! is_scalar( $item['slug'] ) ) {
				static::add_diagnostic( 'theme_json_expected_scalar', array_merge( $path, array( $index, 'slug' ) ) );
				continue;
			}
			$valid[] = $item;
		}

		return $valid;
	}

	/**
	 * Given a tree, removes the keys that are not present in the schema.
	 *
	 * It is recursive and modifies the input in-place.
	 *
	 * @since 5.8.0
	 * @since 7.0.0 Added type validation for boolean values.
	 * @since 7.2.0 Added the `$path` parameter.
	 *
	 * @param array $tree   Input to process.
	 * @param array $schema Schema to adhere to.
	 * @param array $path   Optional. Path of `$tree` within the theme.json structure, used in diagnostics. Default empty.
	 * @return array The modified $tree.
	 */
	public static function remove_keys_not_in_schema( $tree, $schema, $path = array() ) {
		if ( ! is_array( $tree ) ) {
			return $tree;
		}

		foreach ( $tree as $key => $value ) {
			$key_path = null === self::$diagnostics ? $path : array_merge( $path, array( $key ) );

			// Remove keys not in the schema or with null/empty values.
			if ( ! array_key_exists( $key, $schema ) ) {
				static::add_diagnostic( 'theme_json_unknown_key', $key_path );
				unset( $tree[ $key ] );
				continue;
			}

			// Validate type if schema specifies a boolean marker.
			if ( is_bool( $schema[ $key ] ) ) {
				// Schema expects a boolean value - validate the input matches.
				if ( ! is_bool( $value ) ) {
					static::add_diagnostic( 'theme_json_expected_boolean', $key_path );
					unset( $tree[ $key ] );
					continue;
				}
				// Type matches, keep the value and continue to next key.
				continue;
			}

			if ( is_array( $schema[ $key ] ) ) {
				if ( ! is_array( $value ) ) {
					static::add_diagnostic( 'theme_json_expected_object', $key_path );
					unset( $tree[ $key ] );
				} elseif ( wp_is_numeric_array( $value ) ) {
					// If indexed, process each item in the array.
					foreach ( $value as $item_key => $item_value ) {
						if ( isset( $schema[ $key ][0] ) && is_array( $schema[ $key ][0] ) ) {
							$tree[ $key ][ $item_key ] = self::remove_keys_not_in_schema( $item_value, $schema[ $key ][0], null === self::$diagnostics ? $path : array_merge( $key_path, array( $item_key ) ) );
						} else {
							// If the schema does not define a further structure, keep the value as is.
							$tree[ $key ][ $item_key ] = $item_value;
						}
					}
				} else {
					// If associative, process as a single object.
					$tree[ $key ] = self::remove_keys_not_in_schema( $value, $schema[ $key ], $key_path );

					if ( empty( $tree[ $key ] ) ) {
						unset( $tree[ $key ] );
					}
				}
			}
		}

		return $tree;
	}

	/**
	 * Return the input schema at the root and per origin.
	 *
	 * @since 6.5.0
	 *
	 * @param array $schema The base schema.
	 * @return array The schema at the root and per origin.
	 *
	 * Example:
	 * schema_in_root_and_per_origin(
	 *   array(
	 *    'fontFamily' => null,
	 *    'slug' => null,
	 *   )
	 * )
	 *
	 * Returns:
	 * array(
	 *  'fontFamily' => null,
	 *  'slug' => null,
	 *  'default' => array(
	 *    'fontFamily' => null,
	 *    'slug' => null,
	 *  ),
	 *  'blocks' => array(
	 *    'fontFamily' => null,
	 *    'slug' => null,
	 *  ),
	 *  'theme' => array(
	 *     'fontFamily' => null,
	 *     'slug' => null,
	 *  ),
	 *  'custom' => array(
	 *     'fontFamily' => null,
	 *     'slug' => null,
	 *  ),
	 * )
	 */
	public static function schema_in_root_and_per_origin( $schema ) {
		$schema_in_root_and_per_origin = $schema;
		foreach ( WP_Theme_JSON_Gutenberg::VALID_ORIGINS as $origin ) {
			$schema_in_root_and_per_origin[ $origin ] = $schema;
		}
		return $schema_in_root_and_per_origin;
	}

	/**
	 * Runs a callback while recording what sanitization drops or coerces, and returns the diagnostics.
	 *
	 * Collection is scoped to the callback. Nothing is recorded outside it, so the ordinary
	 * construction paths pay no cost. Calls can nest; the outer collection resumes afterwards.
	 *
	 * @since 7.2.0
	 *
	 * @param callable $callback Code to run, typically a `sanitize()` call.
	 * @return array[] Diagnostics recorded while the callback ran, in no particular order. Each has:
	 *                 - `code`    string  Stable identifier, one of the codes `get_diagnostic_message()` knows.
	 *                 - `path`    array   Keys from the root of the structure to the value.
	 *                 - `message` string  Translated text for display. Not part of the contract; never branch on it.
	 */
	public static function collect( callable $callback ) {
		$previous          = self::$diagnostics;
		self::$diagnostics = array();

		try {
			$callback();
		} finally {
			$collected         = self::$diagnostics;
			self::$diagnostics = $previous;
		}

		return $collected;
	}

	/**
	 * Records a diagnostic, when a `collect()` callback is running.
	 *
	 * Outside `collect()` this returns immediately. The message is built here rather than at the
	 * call site, so translation only runs when something is collecting.
	 *
	 * @since 7.2.0
	 *
	 * @param string $code Diagnostic code, one of the codes `get_diagnostic_message()` knows.
	 * @param array  $path Path to the value in the theme.json structure. Empty for the whole structure.
	 */
	public static function add_diagnostic( $code, $path ) {
		if ( null === self::$diagnostics ) {
			return;
		}

		self::$diagnostics[] = array(
			'code'    => $code,
			'path'    => $path,
			'message' => static::get_diagnostic_message( $code, $path ),
		);
	}

	/**
	 * Builds the human readable message for a diagnostic.
	 *
	 * @since 7.2.0
	 *
	 * @param string $code Diagnostic code.
	 * @param array  $path Path to the value.
	 * @return string The message.
	 */
	private static function get_diagnostic_message( $code, $path ) {
		$dotted = implode( '.', $path );

		switch ( $code ) {
			case 'theme_json_missing_version':
				return __( 'The structure has no "version" key, so all of it is ignored.', 'gutenberg' );

			case 'theme_json_unknown_key':
				if ( 1 === count( $path ) ) {
					/* translators: %s: theme.json key. */
					return sprintf( __( 'Unknown top-level key "%s".', 'gutenberg' ), $path[0] );
				}
				/* translators: 1: theme.json key, 2: dot-separated path to its parent. */
				return sprintf( __( 'Unknown key "%1$s" under "%2$s".', 'gutenberg' ), end( $path ), implode( '.', array_slice( $path, 0, -1 ) ) );

			case 'theme_json_unregistered_block':
				/* translators: %s: block name. */
				return sprintf( __( 'Block "%s" is not registered.', 'gutenberg' ), $path[2] );

			case 'theme_json_unregistered_variation':
				if ( 'variations' === $path[1] ) {
					/* translators: %s: block style variation name. */
					return sprintf( __( 'Block style variation "%s" is not registered for any block.', 'gutenberg' ), $path[2] );
				}
				/* translators: 1: block style variation name, 2: block name. */
				return sprintf( __( 'Block style variation "%1$s" is not registered for block "%2$s".', 'gutenberg' ), $path[4], $path[2] );

			case 'theme_json_expected_object':
				if ( empty( $path ) ) {
					return __( 'The theme.json structure must be an object.', 'gutenberg' );
				}
				/* translators: %s: dot-separated theme.json path. */
				return sprintf( __( '"%s" must be an object.', 'gutenberg' ), $dotted );

			case 'theme_json_expected_boolean':
				/* translators: %s: dot-separated theme.json path. */
				return sprintf( __( '"%s" must be a boolean.', 'gutenberg' ), $dotted );

			case 'theme_json_expected_scalar':
				/* translators: %s: dot-separated theme.json path. */
				return sprintf( __( '"%s" must be a string or a number.', 'gutenberg' ), $dotted );

			case 'theme_json_invalid_viewport':
				return __( 'Viewport breakpoints were normalized, or replaced by the defaults because no valid breakpoint was found.', 'gutenberg' );
		}

		return '';
	}

	/**
	 * Reports block names and block style variation names that are not registered, and removes them.
	 *
	 * The sanitization schema is only built for registered names, so without this step they would be
	 * reported as unknown keys. Removing them here, and the containers that become empty, matches what
	 * `remove_keys_not_in_schema()` would do, so the sanitized output does not change. Numeric lists are
	 * left alone because the walk keeps them as they are.
	 *
	 * @since 7.2.0
	 *
	 * @param array $input             Structure to sanitize.
	 * @param array $valid_block_names List of valid block names.
	 * @param array $valid_variations  List of valid variations per block.
	 * @return array The structure without the unregistered names.
	 */
	private static function report_unregistered_names( $input, $valid_block_names, $valid_variations ) {
		foreach ( array( 'settings', 'styles' ) as $subtree ) {
			if ( ! isset( $input[ $subtree ]['blocks'] ) || ! is_array( $input[ $subtree ]['blocks'] ) || wp_is_numeric_array( $input[ $subtree ]['blocks'] ) ) {
				continue;
			}

			foreach ( array_keys( $input[ $subtree ]['blocks'] ) as $block_name ) {
				if ( ! in_array( $block_name, $valid_block_names, true ) ) {
					static::add_diagnostic( 'theme_json_unregistered_block', array( $subtree, 'blocks', $block_name ) );
					unset( $input[ $subtree ]['blocks'][ $block_name ] );
					continue;
				}

				if ( 'styles' !== $subtree || ! isset( $input['styles']['blocks'][ $block_name ]['variations'] ) || ! is_array( $input['styles']['blocks'][ $block_name ]['variations'] ) || wp_is_numeric_array( $input['styles']['blocks'][ $block_name ]['variations'] ) ) {
					continue;
				}

				foreach ( array_keys( $input['styles']['blocks'][ $block_name ]['variations'] ) as $variation_name ) {
					if ( ! in_array( $variation_name, $valid_variations[ $block_name ] ?? array(), true ) ) {
						static::add_diagnostic( 'theme_json_unregistered_variation', array( 'styles', 'blocks', $block_name, 'variations', $variation_name ) );
						unset( $input['styles']['blocks'][ $block_name ]['variations'][ $variation_name ] );
					}
				}

				if ( empty( $input['styles']['blocks'][ $block_name ]['variations'] ) ) {
					unset( $input['styles']['blocks'][ $block_name ]['variations'] );
				}
				if ( empty( $input['styles']['blocks'][ $block_name ] ) ) {
					unset( $input['styles']['blocks'][ $block_name ] );
				}
			}

			if ( empty( $input[ $subtree ]['blocks'] ) ) {
				unset( $input[ $subtree ]['blocks'] );
			}
		}

		return $input;
	}

	/**
	 * Sanitizes and normalizes viewport breakpoint settings.
	 *
	 * Keeps only supported breakpoint keys, trims valid CSS lengths, and returns
	 * the default breakpoints when no valid custom breakpoint is provided. When
	 * only one breakpoint is valid, it remains keyed by its configured state and
	 * uses a single max-width media query. When `tablet` is not larger than
	 * `mobile`, it is removed.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $viewport_settings Viewport settings from theme.json.
	 * @return array Sanitized viewport breakpoint settings.
	 */
	public static function sanitize_viewport_settings( $viewport_settings ) {
		if ( ! is_array( $viewport_settings ) ) {
			return WP_Theme_JSON_Gutenberg::DEFAULT_VIEWPORT_BREAKPOINTS;
		}

		$breakpoints = array();
		foreach ( array_keys( WP_Theme_JSON_Gutenberg::DEFAULT_VIEWPORT_BREAKPOINTS ) as $breakpoint ) {
			$value = $viewport_settings[ $breakpoint ] ?? null;
			$px    = static::get_viewport_breakpoint_value_in_pixels( $value );
			if ( null !== $px ) {
				$breakpoints[ $breakpoint ] = array(
					'value' => trim( $value ),
					'px'    => $px,
				);
			}
		}

		if ( empty( $breakpoints ) ) {
			return WP_Theme_JSON_Gutenberg::DEFAULT_VIEWPORT_BREAKPOINTS;
		}

		if ( 1 === count( $breakpoints ) ) {
			$breakpoint = key( $breakpoints );
			return array( $breakpoint => $breakpoints[ $breakpoint ]['value'] );
		}

		$sanitized = array( 'mobile' => $breakpoints['mobile']['value'] );

		if ( isset( $breakpoints['tablet'] ) && $breakpoints['mobile']['px'] < $breakpoints['tablet']['px']
		) {
			$sanitized['tablet'] = $breakpoints['tablet']['value'];
		}

		return $sanitized;
	}

	/**
	 * Checks whether a viewport breakpoint value is a safe CSS length.
	 *
	 * Viewport breakpoints are limited to numeric `px`, `em`, and `rem` lengths.
	 * CSS functions, percentages, and other units are rejected because breakpoint
	 * values are interpolated into generated media queries.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $value Value to check.
	 * @return bool Whether the value is valid.
	 */
	private static function is_valid_viewport_breakpoint_size( $value ) {
		if ( ! is_string( $value ) ) {
			return false;
		}

		$value = trim( $value );
		if ( '' === $value ) {
			return false;
		}

		return 1 === preg_match( '/^(?:\d+|\d*\.\d+)(?:px|em|rem)$/', $value );
	}

	/**
	 * Converts a valid viewport breakpoint size to pixels for ordering checks.
	 *
	 * Generated media queries keep the original units. This method only
	 * normalizes values so `mobile` and `tablet` can be compared safely. `em`
	 * and `rem` lengths use a 16px base for comparison.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $value Viewport breakpoint size.
	 * @return float|null Viewport breakpoint size in pixels, or null when invalid.
	 */
	private static function get_viewport_breakpoint_value_in_pixels( $value ) {
		if ( ! static::is_valid_viewport_breakpoint_size( $value ) ) {
			return null;
		}

		$value = trim( $value );
		$unit  = substr( $value, -3 );
		if ( 'rem' === $unit ) {
			$number = (float) substr( $value, 0, -3 );
		} else {
			$unit   = substr( $value, -2 );
			$number = (float) substr( $value, 0, -2 );
		}

		/*
		 * Use the most common browser default font size as the base for em/rem
		 * media query conversions. This pixel value is only used to compare
		 * breakpoint order; generated media queries keep the original units.
		 */
		return 'px' === $unit ? $number : $number * 16;
	}

	/**
	 * Given a tree, converts the internal representation of variables to the CSS representation.
	 * It is recursive and modifies the input in-place.
	 *
	 * @since 6.3.0
	 * @param array $tree Input to process.
	 * @return array The modified $tree.
	 */
	private static function resolve_custom_css_format( $tree ) {
		$prefix = 'var:';

		foreach ( $tree as $key => $data ) {
			if ( is_string( $data ) && str_starts_with( $data, $prefix ) ) {
				$tree[ $key ] = self::convert_custom_properties( $data );
			} elseif ( is_array( $data ) ) {
				$tree[ $key ] = self::resolve_custom_css_format( $data );
			}
		}

		return $tree;
	}

	/**
	 * This is used to convert the internal representation of variables to the CSS representation.
	 * For example, `var:preset|color|vivid-green-cyan` becomes `var(--wp--preset--color--vivid-green-cyan)`.
	 *
	 * @since 6.3.0
	 * @since 7.2.0 Preset reference slugs are kebab-cased to match the generated custom properties.
	 * @param string $value The variable such as var:preset|color|vivid-green-cyan to convert.
	 * @return string The converted variable.
	 */
	private static function convert_custom_properties( $value ) {
		$prefix     = 'var:';
		$prefix_len = strlen( $prefix );
		$token_in   = '|';
		$token_out  = '--';
		if ( str_starts_with( $value, $prefix ) ) {
			$parts = explode( $token_in, substr( $value, $prefix_len ) );

			/*
			 * The slug of a preset reference is kebab-cased so the resulting
			 * custom property matches the one generated from the preset,
			 * whose slug is also kebab-cased (see `get_settings_values_by_slug()`).
			 * For slugs that are not already kebab-cased (e.g. `n27`), a verbatim
			 * conversion produces a reference to a custom property that does
			 * not exist (`--wp--preset--font-family--n27` instead of the
			 * generated `--wp--preset--font-family--n-27`).
			 *
			 * Duotone is the exception: its custom properties are generated by
			 * `WP_Duotone_Gutenberg` from the presets it registers in
			 * `get_all_global_styles_presets()`. Duotone references are
			 * kebab-cased all the same: the editor and the JS style engine
			 * kebab-case the references of every preset type, and
			 * `WP_Duotone_Gutenberg` looks up presets by kebab-cased filter ID.
			 */
			if ( 3 === count( $parts ) && 'preset' === $parts[0] ) {
				$parts[2] = _wp_to_kebab_case( $parts[2] );
			}

			$value = 'var(--wp--' . implode( $token_out, $parts ) . ')';
		}

		return $value;
	}
}
