<?php
/**
 * Plugin Name: Gutenberg Test Allowed Patterns Disable Blocks
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-allowed-patterns-disable-blocks
 */

/**
 * Restrict the allowed blocks in the editor.
 *
 * @param  Array   $allowed_block_types An array of strings containing the previously allowed blocks.
 * @param  WP_Post $post                The current post object.
 * @return Array                        An array of strings containing the new allowed blocks after the filter is applied.
 */
function my_plugin_allowed_block_types( $allowed_block_types, $post ) {
	if ( 'post' !== $post->post_type ) {
		return $allowed_block_types;
	}
	return array( 'core/heading', 'core/columns', 'core/column', 'core/image', 'core/spacer' );
}

add_filter( 'allowed_block_types', 'my_plugin_allowed_block_types', 10, 2 );
