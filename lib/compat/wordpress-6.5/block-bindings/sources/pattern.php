<?php
/**
 * Add the metadata source to the block bindings API.
 *
 * @package gutenberg
 */
if ( function_exists( 'wp_block_bindings_register_source' ) ) {
	$pattern_source_callback = function ( $source_attrs, $block_instance, $attribute_name ) {
		if ( ! _wp_array_get( $block_instance->attributes, array( 'metadata', 'name' ), false ) ) {
			return null;
		}
		$block_id           = $block_instance->attributes['metadata']['name'];
		$attribute_override = _wp_array_get( $block_instance->context, array( 'pattern/overrides', $block_id, $attribute_name ), null );
		if ( null === $attribute_override ) {
			return null;
		}
		switch ( $attribute_override[0] ) {
			case 0: // remove
				/**
				 * TODO: This currently doesn't remove the attribute, but only set it to an empty string.
				 * It's a temporary solution until the block binding API supports different operations.
				 */
				return '';
			case 1: // replace
				return $attribute_override[1];
			default:
				return null;
		}
	};
	wp_block_bindings_register_source(
		'pattern_attributes',
		array(
			'label' => __( 'Pattern Attributes' ),
			'apply' => $pattern_source_callback,
		)
	);
}
