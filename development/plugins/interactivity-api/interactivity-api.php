<?php
/**
 * Plugin Name:       Interactivity Api
 * Description:       Example of how to use Interactivity Api
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           0.1.0
 * Author:            The WordPress Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       interactivity-api
 *
 * @package           interactivity-api
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function interactivity_api_interactivity_api_block_init() {
	register_block_type( __DIR__ . '/build/accordion' );
}
add_action( 'init', 'interactivity_api_interactivity_api_block_init' );
