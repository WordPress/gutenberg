<?php
/**
 * WP_Style_Engine_Block_Supports
 *
 * Stores block support metadata and associated rules.
 *
 * @package Gutenberg
 */

if ( class_exists( 'WP_Style_Engine_Block_Supports' ) ) {
	return;
}

/**
 * Stores block support metadata and associated rules.
 *
 * @access private
 */
final class WP_Style_Engine_Block_Supports {
	/**
	 * The merged metadata.
	 *
	 * @var array
	 */
	protected static $merged_block_support_metadata = array();

	/**
	 * Add block style metadata.
	 *
	 * @param array $metadata The $metadata.
	 *
	 * @return void
	 */
	public static function add_metadata( $metadata = array() ) {
		// Assigns value to $merged_block_support_metadata if not already set.
		if ( empty( static::$merged_block_support_metadata ) ) {
			static::reset_metadata();
		}

		foreach ( $metadata as $definition_group_key => $definition_group_style ) {
			if ( ! is_array( $definition_group_style ) || empty( $definition_group_style ) ) {
				continue;
			}

			if ( ! array_key_exists( $definition_group_key, static::$merged_block_support_metadata ) ) {
				static::$merged_block_support_metadata[ $definition_group_key ] = array();
			}

			foreach ( $definition_group_style as $style_definition_key => $style_definition ) {
				if ( ! is_array( $style_definition ) || empty( $style_definition ) ) {
					continue;
				}

				$array_to_extend         = array_key_exists( $style_definition_key, static::$merged_block_support_metadata[ $definition_group_key ] ) ? static::$merged_block_support_metadata[ $definition_group_key ][ $style_definition_key ] : array();
				$merged_style_definition = static::merge_custom_style_definitions_metadata( $array_to_extend, $style_definition );

				if ( $merged_style_definition ) {
					static::$merged_block_support_metadata[ $definition_group_key ][ $style_definition_key ] = $merged_style_definition;
				}
			}
		}
	}

	/**
	 * Get the metadata array.
	 *
	 * @param array $path A path to an array item in static::$merged_block_support_metadata.
	 * @return array
	 */
	public static function get_metadata( $path = array() ) {
		// Assigns value to $merged_block_support_metadata if not already set.
		if ( empty( static::$merged_block_support_metadata ) ) {
			static::reset_metadata();
		}
		if ( ! empty( $path ) ) {
			return _wp_array_get( static::$merged_block_support_metadata, $path, null );
		}
		return static::$merged_block_support_metadata;
	}

	/**
	 * Resets the de-referenced metadata array.
	 *
	 * @return void
	 */
	public static function reset_metadata() {
		static::$merged_block_support_metadata = wp_json_decode( wp_json_encode( WP_Style_Engine::BLOCK_STYLE_DEFINITIONS_METADATA ), true );
	}

	/**
	 * Merges single style definitions with incoming custom style definitions.
	 *
	 * @param array $style_definition The internal style definition metadata.
	 * @param array $custom_definition The custom style definition metadata to be merged.
	 *
	 * @return array|void The merged definition metadata.
	 */
	protected static function merge_custom_style_definitions_metadata( $style_definition, $custom_definition = array() ) {
		// Required metadata.
		if ( ! isset( $style_definition['path'] ) && ! isset( $custom_definition['path'] ) && ! is_array( $custom_definition['path'] ) ) {
			return;
		}

		// Only allow strings for valid property keys.
		if ( ! isset( $custom_definition['property_keys']['default'] ) && ! is_string( $custom_definition['property_keys']['default'] ) ) {
			return;
		}

		// Only allow strings for valid property keys.
		if ( isset( $custom_definition['property_keys']['individual'] ) && ! is_string( $custom_definition['property_keys']['individual'] ) ) {
			return;
		}

		// Only allow specific value_func.
		if ( isset( $custom_definition['value_func'] ) && 'WP_Style_Engine::get_individual_property_css_declarations' !== $custom_definition['value_func'] ) {
			return;
		}

		$custom_definition['property_keys']['default'] = sanitize_key( $custom_definition['property_keys']['default'] );

		$valid_keys = array( 'path', 'property_keys', 'css_vars', 'classnames' );
		foreach ( $valid_keys as $key ) {
			if ( isset( $custom_definition[ $key ] ) && is_array( $custom_definition[ $key ] ) ) {
				if ( ! isset( $style_definition[ $key ] ) ) {
					$style_definition[ $key ] = array();
				}
				$style_definition[ $key ] = array_merge( $style_definition[ $key ], $custom_definition[ $key ] );
			}
		}

		return $style_definition;
	}
}
