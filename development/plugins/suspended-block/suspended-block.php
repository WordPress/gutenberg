<?php
/**
 * Plugin Name:       Suspended Block
 * Description:       An example of React Suspended applied to Gutenberg Blocks
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           1.0.0
 * Author:            suspended-block
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       suspended-block
 * Domain Path:       suspended-block
 *
 * @package           suspended-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */
function suspended_block_suspended_block_block_init() {
	register_block_type( __DIR__ . '/build' );
}
add_action( 'init', 'suspended_block_suspended_block_block_init' );
