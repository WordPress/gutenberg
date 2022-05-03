<?php
/**
 * Temporary compatibility shims for navigation block.
 *
 * @package gutenberg
 */

/**
 * Iterate through all inner blocks recursively and get navigation link block's post ids..
 *
 * @param WP_Block_List $inner_blocks Block list class instance.
 *
 * @return array Array of post ids.
 */
function block_core_navigation_get_post_ids( $inner_blocks ) {
	$post_ids = array_map( 'block_core_navigation_get_post_ids_from_block', iterator_to_array( $inner_blocks ) );
	return array_unique( array_merge( ...$post_ids ) );
}

/**
 * Get post ids from a navigation link block instance.
 *
 * @param WP_Block $block Instance of a block.
 *
 * @return array Array of post ids.
 */
function block_core_navigation_get_post_ids_from_block( $block ) {
	$post_ids = array();

	if ( $block->inner_blocks ) {
		$post_ids = block_core_navigation_get_post_ids( $block->inner_blocks );
	}
	if ( 'core/navigation-link' === $block->name || 'core/navigation-submenu' === $block->name ) {
		if ( $block->attributes && isset( $block->attributes['kind'] ) && 'post-type' === $block->attributes['kind'] ) {
			$post_ids[] = $block->attributes['id'];
		}
	}

	return $post_ids;
}
