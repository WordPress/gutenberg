<?php
/**
 * Block hooks compatibility layer.
 *
 * @package gutenberg
 */

function respect_ignored_hooked_blocks_post_meta_on_wp_navigation_post( $hooked_block_types, $relative_position, $anchor_block_type, $context ) {
	// Only apply this filter if $context is a wp_navigation post object.
	if ( ! $context instanceof WP_Post || 'wp_navigation' !== $context->post_type ) {
		return $hooked_block_types;
	}

	// Only apply this filter if the anchor block is a Navigation block.
	if (
		'core/navigation' !== $anchor_block_type || (
			'first_child' !== $relative_position &&
			'last_child' !== $relative_position
		)
	) {
		return $hooked_block_types;
	}

	$ignored_hooked_blocks = get_post_meta( $context->ID, '_wp_ignored_hooked_blocks', true );
	if ( ! empty( $ignored_hooked_blocks ) ) {
		$ignored_hooked_blocks = json_decode( $ignored_hooked_blocks, true );
	}

	if ( ! isset( $ignored_hooked_blocks ) || ! is_array( $ignored_hooked_blocks ) ) {
		$ignored_hooked_blocks = array();
	}

	$hooked_block_types = array_diff( $hooked_block_types, $ignored_hooked_blocks );

	// FIXME. The problem is that we don't have any way of telling if this is being invoked
	// upon read or write access. As a consequence, we're always writing the post meta, even
	// if we're only reading. That means that the ignoredHookedBlocks meta will be set
	// when first loading the frontend, and will cause hooked blocks to be omitted when loading
	// it for the second time :(
	$ignored_hooked_blocks = array_merge( $ignored_hooked_blocks, $hooked_block_types );
	update_post_meta( $context->ID, '_wp_ignored_hooked_blocks', json_encode( $ignored_hooked_blocks ) );

	return $hooked_block_types;
}

if ( version_compare( get_bloginfo( 'version' ), '6.5', '<' ) ) {
	add_filter( 'hooked_block_types', 'respect_ignored_hooked_blocks_post_meta_on_wp_navigation_post', 10, 4 );
}
