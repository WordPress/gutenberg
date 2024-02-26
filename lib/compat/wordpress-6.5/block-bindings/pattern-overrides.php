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
	if ( empty( $block_instance->attributes['metadata']['id'] ) ) {
		return null;
	}
	$block_id = $block_instance->attributes['metadata']['id'];
	return _wp_array_get( $block_instance->context, array( 'pattern/overrides', $block_id, 'values', $attribute_name ), null );
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
