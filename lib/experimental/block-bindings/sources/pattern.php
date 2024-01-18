<?php
/**
 * Add the metadata source to the block bindings API.
 *
 * @package gutenberg
 */
if ( function_exists( 'wp_block_bindings_register_source' ) ) {
	$pattern_source_callback = function ( $source_attrs, $block_instance, $attribute_name ) {
		if ( ! _wp_array_get( $block_instance->attributes, array( 'metadata', 'id' ), false ) ) {
			return WP_Block_Bindings::SKIP;
		}
		$block_id = $block_instance->attributes['metadata']['id'];
		return _wp_array_get( $block_instance->context, array( 'pattern/overrides', $block_id, $attribute_name ), WP_Block_Bindings::SKIP );
	};
	wp_block_bindings_register_source(
		'pattern_attributes',
		__( 'Pattern Attributes', 'gutenberg' ),
		$pattern_source_callback
	);
}
