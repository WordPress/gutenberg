<?php
/**
 * Block Comment global attribute support.
 *
 * @package gutenberg
 */

/**
 * Adds blockCommentId as a global attribute to all blocks.
 * This ensures that blockCommentId is always available for REST API validation.
 *
 * @param array  $args       Array of arguments for registering a block type.
 * @param string $block_type Block type name including namespace.
 * @return array Modified arguments.
 */
function gutenberg_add_block_comment_global_attribute( $args, $block_type ) {
	// Ensure attributes array exists.
	if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
		$args['attributes'] = array();
	}

	// Add blockCommentId as a global attribute if not already defined.
	if ( ! array_key_exists( 'blockCommentId', $args['attributes'] ) ) {
		$args['attributes']['blockCommentId'] = array(
			'type' => 'number',
		);
	}

	return $args;
}

// Register the filter to add blockCommentId to all blocks.
add_filter( 'register_block_type_args', 'gutenberg_add_block_comment_global_attribute', 10, 2 );
