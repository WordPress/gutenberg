<?php
/**
 * Block compatibility functions for WordPress 7.0
 *
 * Adds support for the `mediaRoles` property in block.json metadata.
 * This ensures that the mediaRoles property is passed to JavaScript
 * when blocks are registered via register_block_type_from_metadata().
 *
 * @package gutenberg
 */

/**
 * Filters the settings determined from the block type metadata.
 *
 * WordPress core doesn't yet support the mediaRoles property in block.json.
 * This filter adds it to the registered block type so it gets passed to JavaScript.
 *
 * @param WP_Block_Type $block_type Block type object.
 * @param array         $metadata   Block metadata from block.json.
 * @return WP_Block_Type Modified block type with mediaRoles if present.
 */
function gutenberg_add_media_roles_to_block_type( $block_type, $metadata ) {
	// Check if mediaRoles exists in the metadata.
	if ( isset( $metadata['mediaRoles'] ) && is_array( $metadata['mediaRoles'] ) ) {
		// Add mediaRoles as a public property on the block type.
		// This will be included when the block type is passed to JavaScript.
		$block_type->media_roles = $metadata['mediaRoles'];
	}

	return $block_type;
}

add_filter( 'register_block_type_args', 'gutenberg_add_media_roles_to_block_type', 10, 2 );
