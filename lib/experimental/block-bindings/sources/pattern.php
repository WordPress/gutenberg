<?php
/**
 * Add the metadata source to the block bindings API.
 *
 * @package gutenberg
 */
if ( function_exists( 'wp_block_bindings_register_source' ) ) {
	function override_to_patch( $override ) {
		switch ( $override[0] ) {
			case 0: // remove
				return new WP_Binding_Patch( WP_Binding_Patch_Operation::Remove );
			case 1: // replace
				return new WP_Binding_Patch( WP_Binding_Patch_Operation::Replace, $override[1] );
		}
		return null;
	}

	$pattern_source_callback = function ( $source_attrs, $block_instance, $attribute_name ) {
		if ( ! _wp_array_get( $block_instance->attributes, array( 'metadata', 'id' ), false ) ) {
			return null;
		}
		$block_id = $block_instance->attributes['metadata']['id'];
		$attribute_override = _wp_array_get( $block_instance->context, array( 'pattern/overrides', $block_id, $attribute_name ), null );
		return $attribute_override ? override_to_patch( $attribute_override ) : null;
	};
	wp_block_bindings_register_source(
		'pattern_attributes',
		__( 'Pattern Attributes', 'gutenberg' ),
		$pattern_source_callback
	);
}
