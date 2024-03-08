<?php
/**
 * Pattern Overrides source for the Block Bindings.
 *
 * @package gutenberg
 */

/**
 * Gets value for the Pattern Overrides source.
 *
 * @param array    $source_args    Array containing source arguments used to look up the override value.
 *                                 Example: array( "key" => "foo" ).
 * @param WP_Block $block_instance The block instance.
 * @param string   $attribute_name The name of the target attribute.
 * @return mixed The value computed for the source.
 */
function gutenberg_block_bindings_pattern_overrides_callback( $source_attrs, $block_instance, $attribute_name ) {
	if ( ! isset( $block_instance->context['pattern/overrides'] ) ) {
		return null;
	}

	$override_content = $block_instance->context['pattern/overrides'];

	// Back compat. Pattern overrides previously used a metadata `id` instead of `name`.
	// We check first for the name, and if it exists, use that value.
	if ( isset( $block_instance->attributes['metadata']['name'] ) ) {
		$metadata_name = $block_instance->attributes['metadata']['name'];
		if ( array_key_exists( $metadata_name, $override_content ) ) {
			return _wp_array_get( $override_content, array( $metadata_name, $attribute_name ), null );
		}
	}

	// Next check for the `id`.
	if ( isset( $block_instance->attributes['metadata']['id'] ) ) {
		$metadata_id = $block_instance->attributes['metadata']['id'];
		if ( array_key_exists( $metadata_id, $override_content ) ) {
			return _wp_array_get( $override_content, array( $metadata_id, $attribute_name ), null );
		}
	}

	return null;
}

/**
 * Registers Pattern Overrides source in the Block Bindings registry.
 */
function gutenberg_register_block_bindings_pattern_overrides_source() {
	// Override the "core/pattern-overrides" source from core.
	if ( array_key_exists( 'core/pattern-overrides', get_all_registered_block_bindings_sources() ) ) {
		unregister_block_bindings_source( 'core/pattern-overrides' );
	}
	register_block_bindings_source(
		'core/pattern-overrides',
		array(
			'label'              => _x( 'Pattern Overrides', 'block bindings source' ),
			'get_value_callback' => 'gutenberg_block_bindings_pattern_overrides_callback',
			'uses_context'       => array( 'pattern/overrides' ),
		)
	);
}

add_action( 'init', 'gutenberg_register_block_bindings_pattern_overrides_source' );
