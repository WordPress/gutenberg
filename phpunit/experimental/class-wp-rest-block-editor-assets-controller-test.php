<?php
/**
 * Unit tests covering WP_REST_Block_Editor_Assets_Controller functionality.
 *
 * @package gutenberg
 */

if ( ! defined( 'REST_REQUEST' ) ) {
	define( 'REST_REQUEST', true );
}

class WP_REST_Block_Editor_Assets_Controller_Test extends WP_Test_REST_Controller_Testcase {
	public function set_up() {
		parent::set_up();
	}

	public function tear_down() {
		parent::tear_down();
	}

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey(
			'/wp-block-editor/v1/editor-assets',
			$routes
		);
	}


	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_items() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item_schema() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {}
}
