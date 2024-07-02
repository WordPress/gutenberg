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


if ( ! function_exists( 'wp_api_template_revision_args' ) ) {
	/**
	 * Hook in to the template and template part post types and decorate
	 * the rest endpoint with the revision count.
	 *
	 * @param array  $args Current registered post type args.
	 * @param string $post_type Name of post type.
	 *
	 * @return array
	 */
	function wp_api_template_revision_args( $args, $post_type ) {
		if ( 'wp_template' === $post_type || 'wp_template_part' === $post_type ) {
			$args['rest_controller_class'] = 'Gutenberg_REST_Templates_Controller_6_4';
		}
		return $args;
	}
}
add_filter( 'register_post_type_args', 'wp_api_template_revision_args', 10, 2 );
