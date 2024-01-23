<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Shim for the `variation_callback` block type argument.
 *
 * @param array $args The block type arguments.
 * @return array The updated block type arguments.
 */
function gutenberg_register_block_type_args_shim( $args ) {
	if ( isset( $args['variation_callback'] ) && is_callable( $args['variation_callback'] ) ) {
		$args['variations'] = call_user_func( $args['variation_callback'] );
		unset( $args['variation_callback'] );
	}
	return $args;
}

if ( ! method_exists( 'WP_Block_Type', 'get_variations' ) ) {
	add_filter( 'register_block_type_args', 'gutenberg_register_block_type_args_shim' );
}


/**
 * Registers the metadata block attribute for all block types.
 *
 * @param array $args Array of arguments for registering a block type.
 * @return array $args
 */
function gutenberg_register_metadata_attribute( $args ) {
	// Setup attributes if needed.
	if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
		$args['attributes'] = array();
	}

	if ( ! array_key_exists( 'metadata', $args['attributes'] ) ) {
		$args['attributes']['metadata'] = array(
			'type' => 'object',
		);
	}

	return $args;
}
add_filter( 'register_block_type_args', 'gutenberg_register_metadata_attribute' );
