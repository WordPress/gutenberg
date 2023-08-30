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
 * Registers the block patterns REST API routes.
 */
function gutenberg_register_rest_block_patterns_routes() {
	$block_patterns = new Gutenberg_REST_Block_Patterns_Controller();
	$block_patterns->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_block_patterns_routes' );

/**
 * Registers the Global Styles Revisions REST API routes.
 */
function gutenberg_register_global_styles_revisions_endpoints() {
	$global_styles_revisions_controller = new Gutenberg_REST_Global_Styles_Revisions_Controller_6_4();
	$global_styles_revisions_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_global_styles_revisions_endpoints' );

/**
 * Updates `wp_global_styles` to show in rest api. This way it will appear in the post types response.
 *
 * @param array  $args Array of arguments for registering a post type.
 * @param string $post_type Post type key.
 */
function gutenberg_update_wp_global_styles_post_type( $args, $post_type ) {
	if ( 'wp_global_styles' === $post_type ) {
		$args['show_in_rest'] = true;
	}

	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_update_wp_global_styles_post_type', 10, 2 );
