<?php
/**
 * Temporary compatibility functions for the Gutenberg editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Registers the extension of the WP_REST_Posts_Controller class,
 * to add support for post formats.
 * - Hardcoded the 'post' post type for now.
 */
function gutenberg_post_format_rest_posts_controller() {
	$posts_controller = new Gutenberg_REST_Posts_Controller_6_7( 'post' );
	$posts_controller->register_routes();
}

add_action( 'rest_api_init', 'gutenberg_post_format_rest_posts_controller' );
