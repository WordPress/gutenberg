<?php
/**
 * Shims the /wp/v2/widget-types/<id>/render endpoint in WP versions where it's missing
 *
 * @package gutenberg
 */

// Load the polyfill class.
require_once __DIR__ . '/class-gb-rest-widget-render-endpoint-polyfill.php';

/**
 * Registers routes from the GB_REST_Widget_Render_Endpoint_Polyfill class.
 */
function setup_widget_render_api_endpoint_polyfill() {
	$polyfill = new GB_REST_Widget_Render_Endpoint_Polyfill();
	$polyfill->register_routes();
}

// Priority should be larger than 99 which is the one used for registering the core routes.
add_action( 'rest_api_init', 'setup_widget_render_api_endpoint_polyfill', 100 );


