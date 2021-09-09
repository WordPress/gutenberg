<?php
/**
 * Unit tests covering WP_REST_Menus_Controller functionality
 *
 * @package    Gutenberg
 */

/**
 * Core class used to manage menus via the REST API.
 *
 * @see WP_REST_Controller
 */
class WP_REST_Menus_Controller_Test extends WP_REST_Menus_Controller {
	public function test_it_allows_batch_requests_when_updating_menus() {
		$rest_server = rest_get_server();
		// This call is needed to initialize route_options.
		$rest_server->get_routes();
		$route_options = $rest_server->get_route_options( '/__experimental/menus/(?P<id>[\d]+)' );

		$this->assertArrayHasKey( 'allow_batch', $route_options );
		$this->assertSame( array( 'v1' => true ), $route_options['allow_batch'] );
	}
}
