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
		$block_css  = $tree->get_styles_for_block( $metadata );
		$block_name = str_replace( 'core/', '', $metadata['name'] );
		wp_add_inline_style( 'wp-block-' . $block_name, $block_css );
	}
}
