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
 * Handle a failing oEmbed proxy request to try embedding as a shortcode.
 *
 * @see https://core.trac.wordpress.org/ticket/45447
 *
 * @since 2.3.0
 *
 * @param  WP_HTTP_Response|WP_Error $response The REST Request response.
 * @param  WP_REST_Server            $handler  ResponseHandler instance (usually WP_REST_Server).
 * @param  WP_REST_Request           $request  Request used to generate the response.
 * @return WP_HTTP_Response|object|WP_Error    The REST Request response.
 */
function gutenberg_filter_oembed_result( $response, $handler, $request ) {
	if ( ! is_wp_error( $response ) || 'oembed_invalid_url' !== $response->get_error_code() ||
			'/oembed/1.0/proxy' !== $request->get_route() ) {
		return $response;
	}

	// Try using a classic embed instead.
	global $wp_embed;
	$html = $wp_embed->shortcode( array(), $_GET['url'] );
	if ( ! $html ) {
		return $response;
	}

	global $wp_scripts;

	// Check if any scripts were enqueued by the shortcode, and include them in
	// the response.
	$enqueued_scripts = array();
	foreach ( $wp_scripts->queue as $script ) {
		$enqueued_scripts[] = $wp_scripts->registered[ $script ]->src;
	}

	return array(
		'provider_name' => __( 'Embed Handler', 'gutenberg' ),
		'html'          => $html,
		'scripts'       => $enqueued_scripts,
	);
}
add_filter( 'rest_request_after_callbacks', 'gutenberg_filter_oembed_result', 10, 3 );



/**
 * Start: Include for phase 2
 */
/**
 * Registers the REST API routes needed by the legacy widget block.
 *
 * @since 5.0.0
 */
function gutenberg_register_rest_widget_updater_routes() {
	$widget_forms = new WP_REST_Widget_Forms();
	$widget_forms->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_widget_updater_routes' );

/**
 * Registers the widget area REST API routes.
 *
 * @since 5.7.0
 */
function gutenberg_register_rest_widget_areas() {
	$widget_areas_controller = new WP_REST_Widget_Areas_Controller();
	$widget_areas_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_widget_areas' );

/**
 * Registers the block directory.
 *
 * @since 6.5.0
 */
function gutenberg_register_rest_block_directory() {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-block-directory' ) ) {
		return;
	}

	$block_directory_controller = new WP_REST_Block_Directory_Controller();
	$block_directory_controller->register_routes();
}
add_filter( 'rest_api_init', 'gutenberg_register_rest_block_directory' );

/**
 * Registers the menu locations area REST API routes.
 */
function gutenberg_register_rest_menu_location() {
	$nav_menu_location = new WP_REST_Menu_Locations_Controller();
	$nav_menu_location->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_menu_location' );
/**
 * Hook in to the nav menu item post type and enable a post type rest endpoint.
 *
 * @param array  $args Current registered post type args.
 * @param string $post_type Name of post type.
 *
 * @return array
 */
function wp_api_nav_menus_post_type_args( $args, $post_type ) {
	if ( 'nav_menu_item' === $post_type ) {
		$args['show_in_rest']          = true;
		$args['rest_base']             = 'menu-items';
		$args['rest_controller_class'] = 'WP_REST_Menu_Items_Controller';
	}

	return $args;
}
add_filter( 'register_post_type_args', 'wp_api_nav_menus_post_type_args', 10, 2 );

/**
 * Hook in to the nav_menu taxonomy and enable a taxonomy rest endpoint.
 *
 * @param array  $args Current registered taxonomy args.
 * @param string $taxonomy Name of taxonomy.
 *
 * @return array
 */
function wp_api_nav_menus_taxonomy_args( $args, $taxonomy ) {
	if ( 'nav_menu' === $taxonomy ) {
		$args['show_in_rest']          = true;
		$args['rest_base']             = 'menus';
		$args['rest_controller_class'] = 'WP_REST_Menus_Controller';
	}

	return $args;
}
add_filter( 'register_taxonomy_args', 'wp_api_nav_menus_taxonomy_args', 10, 2 );
