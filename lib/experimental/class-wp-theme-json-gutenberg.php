<?php
/**
 * WP_Theme_JSON_Gutenberg class
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
class WP_Theme_JSON_Gutenberg extends WP_Theme_JSON_6_1 {
	/**
	 * Holds block metadata extracted from block.json
	 * to be shared among all instances so we don't
	 * process it twice.
	 *
	 * It is necessary to redefine $blocks_metadata here so that it
	 * doesn't get inherited from an earlier instantiation of the
	 * parent class.
	 *
	 * @since 5.8.0
	 * @var array
	 */
	protected static $blocks_metadata = null;

	/**
	 * Sanitizes the input according to the schemas.
	 *
	 * @since 5.8.0
	 * @since 5.9.0 Added the `$valid_block_names` and `$valid_element_name` parameters.
	 * @since 6.1.0 Added support for nested block settings
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
			if ( array_key_exists( $section, $styles_non_top_level ) && is_array( $styles_non_top_level[ $section ] ) ) {
				foreach ( array_keys( $styles_non_top_level[ $section ] ) as $prop ) {
					if ( 'top' === $styles_non_top_level[ $section ][ $prop ] ) {
						unset( $styles_non_top_level[ $section ][ $prop ] );
					}
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

		$schema_styles_blocks = array();
		foreach ( $valid_block_names as $block ) {
			$schema_styles_blocks[ $block ]             = $styles_non_top_level;
			$schema_styles_blocks[ $block ]['elements'] = $schema_styles_elements;
		}

		$schema['styles']             = static::VALID_STYLES;
		$schema['styles']['blocks']   = $schema_styles_blocks;
		$schema['styles']['elements'] = $schema_styles_elements;
		$schema['settings']           = static::VALID_SETTINGS;

		// Remove anything that's not present in the schema.
		foreach ( array( 'styles', 'settings' ) as $subtree ) {
			if ( ! isset( $input[ $subtree ] ) ) {
				continue;
			}

			if ( ! is_array( $input[ $subtree ] ) ) {
				unset( $output[ $subtree ] );
				continue;
			}

			// Clean up everything save for the blocks.
			$result = static::remove_keys_not_in_schema( $input[ $subtree ], $schema[ $subtree ] );

			// Now back in the blocks.
			if ( 'settings' === $subtree && isset( $input[ $subtree ]['blocks'] ) ) {
				$result['blocks'] = static::sanitize_blocks( $input[ $subtree ]['blocks'], $valid_block_names, $schema[ $subtree ] );
			}

			if ( empty( $result ) ) {
				unset( $output[ $subtree ] );
			} else {
				$output[ $subtree ] = $result;
			}
		}

		return $output;
	}

	/**
	 * Sanitize the blocks section that can be found in settings and styles. This ensures
	 * nested blocks are supported through recursion.
	 *
	 * @since 6.1.0
	 *
	 * @param array $current_block              The current block to break down.
	 * @param array $valid_block_names          List of valid block names.
	 * @param array $schema                     Valid schema that is allowed for this block.
	 * @param array $result                     The sanitized version of the block.
	 * @return array The sanitized blocks output
	 */
	protected static function sanitize_blocks( $current_block, $valid_block_names, $schema, $result = array() ) {
		foreach ( $current_block as $block_name => $block ) {
			if ( in_array( $block_name, $valid_block_names, true ) ) {
				$base_result = static::remove_keys_not_in_schema( $block, $schema );
				$sub_result  = static::sanitize_blocks( $block, $valid_block_names, $schema );

				$result[ $block_name ] = array_merge( $base_result, $sub_result );
			}
		}

		return $result;
	}

	/**
	 * Builds metadata for the setting nodes, which returns in the form of:
	 *
	 *     [
	 *       [
	 *         'path'     => ['path', 'to', 'some', 'node' ],
	 *         'selector' => 'CSS selector for some node'
	 *       ],
	 *       [
	 *         'path'     => [ 'path', 'to', 'other', 'node' ],
	 *         'selector' => 'CSS selector for other node'
	 *       ],
	 *     ]
	 *
	 * @since 5.8.0
	 * @since 6.1.0 Added support for nested block settings
	 *
	 * @param array $theme_json The tree to extract setting nodes from.
	 * @param array $selectors  List of selectors per block.
	 * @return array
	 */
	protected static function get_setting_nodes( $theme_json, $selectors = array() ) {
		$nodes = array();
		if ( ! isset( $theme_json['settings'] ) ) {
			return $nodes;
		}

		// Top-level.
		$nodes[] = array(
			'path'     => array( 'settings' ),
			'selector' => static::ROOT_BLOCK_SELECTOR,
		);

		// Calculate paths for blocks.
		if ( ! isset( $theme_json['settings']['blocks'] ) ) {
			return $nodes;
		}

		$valid_block_names = array_keys( static::get_blocks_metadata() );

		return static::get_settings_of_blocks( $selectors, $valid_block_names, $nodes, $theme_json['settings']['blocks'] );
	}

	/**
	 * Builds the metadata for the blocks present in the settings node, by taking into account nested blocks.
	 * This returns in the form of:
	 *
	 *     [
	 *       [
	 *         'path'     => ['path', 'to', 'some', 'node' ],
	 *         'selector' => 'CSS selector for some node'
	 *       ],
	 *       [
	 *         'path'     => [ 'path', 'to', 'other', 'node' ],
	 *         'selector' => 'CSS selector for other node'
	 *       ],
	 *     ]
	 *
	 * @since 6.1.0
	 *
	 * @param array $selectors         List of selectors per block.
	 * @param array $valid_block_names List of valid block names.
	 * @param array $nodes             The metadata of the nodes that have been built so far.
	 * @param array $current_block     The current block to break down.
	 * @param array $current_selector  The current selector of the current block.
	 * @param array $current_path      The current path to the block.
	 * @return array
	 */
	protected static function get_settings_of_blocks( $selectors, $valid_block_names, $nodes, $current_block, $current_selector = null, $current_path = array() ) {
		foreach ( $current_block as $block_name => $block ) {
			// It's not necessary to validate as the blocks have already been validated, but this is cleaner to do in order to catch a nested block.
			if ( in_array( $block_name, $valid_block_names, true ) ) {

				$selector = is_null( $current_selector ) ? null : $current_selector;
				if ( isset( $selectors[ $block_name ]['selector'] ) ) {
					$selector = $selector . ' ' . $selectors[ $block_name ]['selector'];
				}

				$path = empty( $current_path ) ? array( 'settings', 'blocks' ) : $current_path;
				array_push( $path, $block_name );

				$nodes[] = array(
					'path'     => $path,
					'selector' => $selector,
				);

				$nodes = static::get_settings_of_blocks( $selectors, $valid_block_names, $nodes, $block, $selector, $path );
			}
		}

		return $nodes;
	}

}
