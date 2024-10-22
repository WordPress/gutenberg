<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Registers the Post Counts REST API routes.
 */
function gutenberg_register_post_counts_routes() {
	$post_counts_controller = new Gutenberg_REST_Post_Counts_Controller();
	$post_counts_controller->register_routes();
}

add_action( 'rest_api_init', 'gutenberg_register_post_counts_routes' );
