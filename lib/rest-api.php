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
	$widgets_controller = new WP_REST_Widget_Updater_Controller();
	$widgets_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_widget_updater_routes' );

function gutenberg_register_rest_sidebars_routes() {
	$sidebar_controller = new WP_REST_Sidebars_Controller();
	$sidebar_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_sidebars_routes' );
/**
 * End: Include for phase 2
 */
