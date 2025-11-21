<?php
/**
 * WordPress 7.0 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Registers the Block Patterns REST API routes.
 */
function gutenberg_register_block_patterns_controller_endpoints() {
	$block_patterns_controller = new Gutenberg_REST_Block_Patterns_Controller_7_0();
	$block_patterns_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_block_patterns_controller_endpoints' );

/**
 * Registers the Registered Templates REST API routes.
 * The template activation experiment registers its own routes, so we only register the registered templates controller if the experiment is not enabled.
 *
 * @see Gutenberg_REST_Registered_Templates_Controller
 * @see Gutenberg_REST_Templates_Controller_7_0
 */
if ( ! gutenberg_is_experiment_enabled( 'active_templates' ) ) {
	function gutenberg_modify_wp_template_post_type_args_7_0( $args, $post_type ) {
		if ( 'wp_template' === $post_type || 'wp_template_part' === $post_type ) {
			$args['rest_controller_class']   = 'Gutenberg_REST_Templates_Controller_7_0';
			$args['late_route_registration'] = true;
		}
		return $args;
	}
	add_filter( 'register_post_type_args', 'gutenberg_modify_wp_template_post_type_args_7_0', 10, 2 );
}
