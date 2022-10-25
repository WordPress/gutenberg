<?php
/**
 * Overrides Core's wp-includes/rest-api.php and registers the new endpoint for WP 6.2.
 *
 * @package gutenberg
 */

/**
 * Registers the block pattern categories REST API routes.
 */
function gutenberg_register_rest_block_pattern_categories() {
	$block_patterns = new Gutenberg_REST_Block_Pattern_Categories_Controller();
	$block_patterns->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_block_pattern_categories' );

/**
 * Registers the block pattern directory.
 */
function gutenberg_register_rest_pattern_directory_6_2() {
	$pattern_directory_controller = new Gutenberg_REST_Pattern_Directory_Controller_6_2();
	$pattern_directory_controller->register_routes();
}
// Unhook the 6.0 registration to use the 6.2 controller instead.
remove_action( 'rest_api_init', 'gutenberg_register_rest_pattern_directory' );
add_action( 'rest_api_init', 'gutenberg_register_rest_pattern_directory_6_2' );
