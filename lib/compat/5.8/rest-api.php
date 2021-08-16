<?php
/**
 * Registers REST API endpoints.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Registers the block pattern directory.
 */
function gutenberg_register_rest_pattern_directory() {
	$block_directory_controller = new WP_REST_Pattern_Directory_Controller();
	$block_directory_controller->register_routes();
}
add_filter( 'rest_api_init', 'gutenberg_register_rest_pattern_directory' );

/**
 * Registers the Sidebars & Widgets REST API routes.
 */
function gutenberg_register_sidebars_and_widgets_endpoint() {
	$sidebars = new WP_REST_Sidebars_Controller();
	$sidebars->register_routes();

	$widgets = new WP_REST_Widgets_Controller();
	$widgets->register_routes();

	$widget_types = new WP_REST_Widget_Types_Controller();
	$widget_types->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_sidebars_and_widgets_endpoint' );
