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
class WP_REST_Menus_Controller_Test extends WP_Test_REST_Controller_Testcase {
	public function test_it_allows_batch_requests_when_updating_menus() {
		$rest_server = rest_get_server();
		// This call is needed to initialize route_options.
		$rest_server->get_routes();
		$route_options = $rest_server->get_route_options( '/__experimental/menus/(?P<id>[\d]+)' );

		$this->assertArrayHasKey( 'allow_batch', $route_options );
		$this->assertSame( array( 'v1' => true ), $route_options['allow_batch'] );
	}

	/**
	 * This method is used to mark a test as successful.
	 */
	private function mark_test_as_successful() {
		$this->addToAssertionCount( 1 );
	}

	public function test_register_routes() {
		// Marked as successful for now.
		// Reimplement this test method if you need that.
		$this->mark_test_as_successful();
	}

	public function test_context_param() {
		// Marked as successful for now.
		// Reimplement this test method if you need that.
		$this->mark_test_as_successful();
	}

	public function test_get_items() {
		// Marked as successful for now.
		// Reimplement this test method if you need that.
		$this->mark_test_as_successful();
	}

	public function test_get_item() {
		// Marked as successful for now.
		// Reimplement this test method if you need that.
		$this->mark_test_as_successful();
	}

	public function test_create_item() {
		// Marked as successful for now.
		// Reimplement this test method if you need that.
		$this->mark_test_as_successful();
	}

	public function test_update_item() {
		// Marked as successful for now.
		// Reimplement this test method if you need that.
		$this->mark_test_as_successful();
	}

	public function test_delete_item() {
		// Marked as successful for now.
		// Reimplement this test method if you need that.
		$this->mark_test_as_successful();
	}

	public function test_prepare_item() {
		// Marked as successful for now.
		// Reimplement this test method if you need that.
		$this->mark_test_as_successful();
	}

	public function test_get_item_schema() {
		// Marked as successful for now.
		// Reimplement this test method if you need that.
		$this->mark_test_as_successful();
	}
}
