<?php
/**
 * Plugin Name: Gutenberg Test Register Block Type Hooks
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-register-block-type-hooks
 */

/**
 * Changes the category for the paragraph block.
 *
 * @param array $metadata Array of metadata for registering a block type.
 *
 * @return array Filtered metadata for registering a block type.
 */
function gutenberg_test_block_type_metadata( $metadata ) {
	if ( 'core/paragraph' !== $metadata['name'] ) {
		return $metadata;
	}

	return array_merge(
		$metadata,
		array( 'category' => 'widgets' )
	);
}

add_filter( 'block_type_metadata', 'gutenberg_test_block_type_metadata' );
