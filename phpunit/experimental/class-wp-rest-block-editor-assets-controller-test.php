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
	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * @var int
	 */
	protected static $subscriber_id;

	public function set_up() {
		parent::set_up();
	}

	/**
	 * Create fake data before test runs.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetupBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);

		self::$subscriber_id = $factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);
	}

	/**
	 * Clean up fake data.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$subscriber_id );
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

	public function test_get_items_without_user() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', '/wp-block-editor/v1/editor-assets' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_read_block_editor_assets', $response, 401 );
	}

	public function test_get_items_without_permissions() {
		wp_set_current_user( self::$subscriber_id );

		$request  = new WP_REST_Request( 'GET', '/wp-block-editor/v1/editor-assets' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_read_block_editor_assets', $response, 403 );
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
