<?php
/**
 * API to interact with global settings & styles.
 *
 * @package gutenberg
 */

/**
 * Adds global style rules to the inline style for each block.
 */
function wp_add_global_styles_for_blocks() {
	$tree = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
	// TODO some nodes dont have a name...
	$block_nodes = $tree->get_styles_block_nodes();

	foreach ( $block_nodes as $metadata ) {
		if ( empty( $metadata['name'] ) ) {
			continue;
		}
		$block_css  = $tree->get_styles_for_block( $metadata );
		$block_name = str_replace( 'core/', '', $metadata['name'] );
		// These block styles are added on block_render.
		// This hooks inline CSS to them so that they are loaded conditionally
		// based on whether or not the block is used on the page.
		wp_add_inline_style( 'wp-block-' . $block_name, $block_css );
	}
}
