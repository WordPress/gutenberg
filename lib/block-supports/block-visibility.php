<?php
/**
 * Block visibility block support flag.
 *
 * @package gutenberg
 */

/**
 * Render nothing if the block is hidden.
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 * @return string Filtered block content.
 */
function gutenberg_render_block_visibility_support( $block_content, $block ) {
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );

	if (
		! $block_type ||
		! block_has_support( $block_type, 'visibility', true ) &&
		// This condition is not needed in core.
		! block_has_support( $block_type, 'blockVisibility', true )
	) {
		return $block_content;
	}

	// The block support key used to be `blockVisibility` and was later renamed
	// to `visibility`. When the Gutenberg plugin is updated, hidden content could
	// unexpectedly render on the front end if the new key is only checked.
	// To prevent this, we continue checking the old support key too.
	// This conditional statement is not needed in core.
	if ( isset( $block['attrs']['metadata']['blockVisibility'] ) && false === $block['attrs']['metadata']['blockVisibility'] ) {
		return '';
	}

	if ( isset( $block['attrs']['metadata']['visibility'] ) && false === $block['attrs']['metadata']['visibility'] ) {
		return '';
	}

	return $block_content;
}

if ( function_exists( 'wp_render_block_visibility_support' ) ) {
	remove_filter( 'render_block', 'wp_render_block_visibility_support' );
}
add_filter( 'render_block', 'gutenberg_render_block_visibility_support', 10, 2 );
