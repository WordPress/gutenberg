<?php
/**
 * WP_Style_Engine_Block_Style_Metadata
 *
 * Stores block support metadata and associated rules.
 *
 * @package Gutenberg
 */

if ( class_exists( 'WP_Style_Engine_Block_Style_Metadata' ) ) {
	return;
}

/**
 * Stores block support metadata and associated rules.
 *
 * @access private
 */
class WP_Style_Engine_Block_Style_Metadata {
	/**
	 * A variable to cache original metadata.
	 *
	 * @var array
	 */
	protected $base_metadata = array();

	/**
	 * The merged metadata.
	 *
	 * @var array
	 */
	protected $merged_block_support_metadata = array();

	/**
	 * Constructor for this object.
	 *
	 * @param array $base_metadata An associative array of block style metadata to extend.
	 */
	public function __construct( $base_metadata = array() ) {
		$this->base_metadata = $base_metadata;
		$this->reset_metadata();
	}

	/**
	 * Adds block style metadata.
	 *
	 * @param array $metadata The $metadata.
	 *
	 * @return WP_Style_Engine_Block_Style_Metadata Returns the object to allow chaining methods.
	 */
	public function add_metadata( $metadata = array() ) {
		foreach ( $metadata as $definition_group_key => $definition_group_style ) {
			if ( ! is_array( $definition_group_style ) || empty( $definition_group_style ) ) {
				continue;
			}

			if ( ! array_key_exists( $definition_group_key, $this->merged_block_support_metadata ) ) {
				$this->merged_block_support_metadata[ $definition_group_key ] = array();
			}

			foreach ( $definition_group_style as $style_definition_key => $style_definition ) {
				// Bails early if merging metadata is attempting to overwrite existing, original style metadata.
				if ( array_key_exists( $definition_group_key, $this->base_metadata )
					&& array_key_exists( $style_definition_key, $this->base_metadata[ $definition_group_key ] ) ) {
					continue;
				}

				if ( ! is_array( $style_definition ) || empty( $style_definition ) ) {
					continue;
				}

				$array_to_extend         = array_key_exists( $style_definition_key, $this->merged_block_support_metadata[ $definition_group_key ] ) ? $this->merged_block_support_metadata[ $definition_group_key ][ $style_definition_key ] : array();
				$merged_style_definition = $this->merge_custom_style_definitions_metadata( $array_to_extend, $style_definition );

				if ( $merged_style_definition ) {
					$this->merged_block_support_metadata[ $definition_group_key ][ $style_definition_key ] = $merged_style_definition;
				}
			}
		}
		return $this;
	}

	/**
	 * Returns merged metadata.
	 *
	 * @param array $path A path to an array item in static::$merged_block_support_metadata.
	 * @return array
	 */
	public function get_metadata( $path = array() ) {
		if ( ! empty( $path ) ) {
			return _wp_array_get( $this->merged_block_support_metadata, $path, null );
		}
		return $this->merged_block_support_metadata;
	}

	/**
	 * Resets the de-referenced metadata array.
	 *
	 * @return void
	 */
	public function reset_metadata() {
		$this->merged_block_support_metadata = json_decode( wp_json_encode( $this->base_metadata ), true );
	}

	/**
	 * Merges single style definitions with incoming custom style definitions.
	 *
	 * @param array $style_definition The internal style definition metadata.
	 * @param array $custom_definition The custom style definition metadata to be merged.
	 *
	 * @return array|void The merged definition metadata.
	 */
	protected function merge_custom_style_definitions_metadata( $style_definition, $custom_definition = array() ) {
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

		$custom_definition['property_keys']['default'] = sanitize_key( $custom_definition['property_keys']['default'] );

		// A white list of keys that may be merged. Note the absence of the callable `value_func`.
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
