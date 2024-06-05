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

if ( ! function_exists( 'gutenberg_add_post_type_rendering_mode' ) ) {
	/**
	 * Add Block Editor default rendering mode to the post type response.
	 */
	function gutenberg_add_post_type_rendering_mode() {
		$controller = new Gutenberg_REST_Post_Types_Controller_6_7();
		$controller->register_routes();
	}
}
add_action( 'rest_api_init', 'gutenberg_add_post_type_rendering_mode' );
