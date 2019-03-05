<?php
/**
 * Plugin Name: Gutenberg Test Allowed Blocks
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-allowed-blocks
 */

/**
 * Restrict the allowed blocks in the editor.
 */
function my_plugin_allowed_block_types( $allowed_block_types, $post ) {
    if ( $post->post_type !== 'post' ) {
        return $allowed_block_types;
    }
    return array( 'core/paragraph', 'core/image' );
}

add_filter( 'allowed_block_types', 'my_plugin_allowed_block_types', 10, 2 );
