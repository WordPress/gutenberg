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
 * Overrides the REST controller for the `wp_global_styles` post type.
 *
 * @param array $args Array of arguments for registering a post type.
 *                          See the register_post_type() function for accepted arguments.
 *
 * @return array Array of arguments for registering a post type.
 */
function gutenberg_override_global_styles_endpoint( array $args ): array {
	$args['rest_controller_class']   = 'WP_REST_Global_Styles_Controller_Gutenberg';
	$args['late_route_registration'] = true;
	$args['show_in_rest']            = true;
	$args['rest_base']               = 'global-styles';

	return $args;
}
add_filter( 'register_wp_global_styles_post_type_args', 'gutenberg_override_global_styles_endpoint' );

/**
 * Registers the Edit Site Export REST API routes.
 */
function gutenberg_register_edit_site_export_controller_endpoints() {
	$edit_site_export_controller = new WP_REST_Edit_Site_Export_Controller_Gutenberg();
	$edit_site_export_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_edit_site_export_controller_endpoints' );

/**
 * Registers the Icons Registry REST API routes.
 */
if ( gutenberg_is_experiment_enabled( 'gutenberg-svg-icon-registry' ) ) {
	function gutenberg_register_icon_controller_endpoints() {
		$icons_registry = new WP_REST_Icons_Controller();
		$icons_registry->register_routes();
	}
	add_action( 'rest_api_init', 'gutenberg_register_icon_controller_endpoints' );
}

/**
 * Registers the Style Variations REST API routes.
 *
 * Only registered when the template style variations experiment is enabled.
 *
 */
function gutenberg_register_style_variations_controller_endpoints() {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-template-style-variations' ) ) {
		return;
	}

	$style_variations_controller = new WP_REST_Style_Variations_Controller_Gutenberg();
	$style_variations_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_style_variations_controller_endpoints' );

/**
 * Registers the Base Themes REST API routes.
 *
 * Only registered when the template style variations experiment is enabled.
 *
 */
function gutenberg_register_base_themes_controller_endpoints() {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-template-style-variations' ) ) {
		return;
	}

	$base_themes_controller = new WP_REST_Base_Themes_Controller_Gutenberg();
	$base_themes_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_base_themes_controller_endpoints' );
