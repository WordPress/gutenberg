<?php
/**
 * Extend WordPress core blocks to use the Interactivity API.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Replaces view script for the Image block with version using Interactivity API.
 *
 * @param array $metadata Block metadata as read in via block.json.
 *
 * @return array Filtered block type metadata.
 */
function gutenberg_block_update_interactive_view_script( $metadata ) {
	if (
		array_key_exists( 'name', $metadata ) &&
		in_array( $metadata['name'], array( 'core/image' ), true ) &&
		array_key_exists( 'file', $metadata ) &&
		str_contains( $metadata['file'], 'build/block-library/blocks' )
	) {
		$metadata['viewScript'] = array( 'file:./view-interactivity.min.js' );
	}
	return $metadata;
}
add_filter( 'block_type_metadata', 'gutenberg_block_update_interactive_view_script', 10, 1 );
