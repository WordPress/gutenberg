<?php
/**
 * Add the metadata source to the block bindings API.
 *
 * @package gutenberg
 */
function gutenberg_block_bindings_pattern_overrides_callback( $source_attrs, $block_instance, $attribute_name ) {
	if ( ! _wp_array_get( $block_instance->attributes, array( 'metadata', 'id' ), false ) ) {
		return null;
	}
	$block_id           = $block_instance->attributes['metadata']['id'];
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
}

function gutenberg_register_block_bindings_pattern_overrides_source() {
	// Override the "core/pattern-overrides" source from core.
	if ( array_key_exists( 'core/pattern-overrides', get_all_registered_block_bindings_sources() ) ) {
		unregister_block_bindings_source( 'core/pattern-overrides' );
	}
	register_block_bindings_source(
		'core/pattern-overrides',
		array(
			'label'              => __( 'Pattern Overrides' ),
			'get_value_callback' => 'gutenberg_block_bindings_pattern_overrides_callback',
		)
	);
}

add_action( 'init', 'gutenberg_register_block_bindings_pattern_overrides_source' );
