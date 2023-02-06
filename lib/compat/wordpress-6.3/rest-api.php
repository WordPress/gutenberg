<?php
/**
 * Overrides Core's wp-includes/rest-api.php and registers the new endpoint for WP 6.3.
 *
 * @package gutenberg
 */

/**
 * Registers the block pattern directory.
 */
function gutenberg_register_rest_pattern_directory() {
	$pattern_directory_controller = new Gutenberg_REST_Pattern_Directory_Controller_6_3();
	$pattern_directory_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_pattern_directory' );

/**
 * Exposes the home page through the WordPress REST API.
 *
 * This is used for fetching this information when user has no rights
 * to update settings.
 *
 * Note: Backports into wp-includes/rest-api/class-wp-rest-server.php file.
 *
 * @param WP_REST_Response $response REST API response.
 * @return WP_REST_Response $response REST API response.
 */
function gutenberg_add_homepage_url_to_index( WP_REST_Response $response ) {
	$show_on_front = get_option( 'show_on_front' );
	$front_page_id = get_option( 'page_on_front' );

	$response->data['homepage'] = $show_on_front && $front_page_id ? $front_page_id : null;

	return $response;
}
add_action( 'rest_index', 'gutenberg_add_homepage_url_to_index' );
