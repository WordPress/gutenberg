<?php
/**
 * WP_REST_Reusable_Blocks_Controller tests
 *
 * @package gutenberg
 */

/**
 * Tests for WP_REST_Reusable_Blocks_Controller.
 */
class REST_Reusable_Blocks_Controller_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * Our fake reusable block's post ID.
	 *
	 * @var int
	 */
	protected static $reusable_block_post_id;

	/**
	 * Our fake editor's user ID.
	 *
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * Our fake subscriber's user ID.
	 *
	 * @var int
	 */
	protected static $subscriber_id;

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$reusable_block_post_id = wp_insert_post( array(
			'post_type'    => 'gb_reusable_block',
			'post_status'  => 'publish',
			'post_name'    => '2d66a5c5-776c-43b1-98c7-49521cef8ea6',
			'post_title'   => 'My cool block',
			'post_content' => '<p class="has-drop-cap">Hello!</p>',
		) );

		self::$editor_id     = $factory->user->create( array(
			'role' => 'editor',
		) );
		self::$subscriber_id = $factory->user->create( array(
			'role' => 'subscriber',
		) );
	}

	/**
	 * Delete our fake data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$reusable_block_post_id );

		self::delete_user( self::$editor_id );
		self::delete_user( self::$subscriber_id );
	}

	/**
	 * Check that our routes get set up properly.
	 */
	public function test_register_routes() {
		$routes = $this->server->get_routes();

		$this->assertArrayHasKey( '/gutenberg/v1/reusable-blocks', $routes );
		$this->assertCount( 1, $routes['/gutenberg/v1/reusable-blocks'] );
		$this->assertArrayHasKey( '/gutenberg/v1/reusable-blocks/(?P<id>[\w-]+)', $routes );
		$this->assertCount( 2, $routes['/gutenberg/v1/reusable-blocks/(?P<id>[\w-]+)'] );
	}

	/**
	 * Check that we can GET a collection of reusable blocks.
	 */
	public function test_get_items() {
		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request( 'GET', '/gutenberg/v1/reusable-blocks' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( array(
			array(
				'id'      => '2d66a5c5-776c-43b1-98c7-49521cef8ea6',
				'name'    => 'My cool block',
				'content' => '<p class="has-drop-cap">Hello!</p>',
			),
		), $response->get_data() );
	}

	/**
	 * Check that users without permission can't GET a collection of reusable blocks.
	 */
	public function test_get_items_when_not_allowed() {
		wp_set_current_user( self::$subscriber_id );

		$request  = new WP_REST_Request( 'GET', '/gutenberg/v1/reusable-blocks' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'gutenberg_reusable_block_cannot_read', $data['code'] );
	}

	/**
	 * Check that we can GET a single reusable block.
	 */
	public function test_get_item() {
		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request( 'GET', '/gutenberg/v1/reusable-blocks/2d66a5c5-776c-43b1-98c7-49521cef8ea6' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( array(
			'id'      => '2d66a5c5-776c-43b1-98c7-49521cef8ea6',
			'name'    => 'My cool block',
			'content' => '<p class="has-drop-cap">Hello!</p>',
		), $response->get_data() );
	}

	/**
	 * Check that users without permission can't GET a single reusable block.
	 */
	public function test_get_item_when_not_allowed() {
		wp_set_current_user( self::$subscriber_id );

		$request  = new WP_REST_Request( 'GET', '/gutenberg/v1/reusable-blocks/2d66a5c5-776c-43b1-98c7-49521cef8ea6' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'gutenberg_reusable_block_cannot_read', $data['code'] );
	}

	/**
	 * Check that invalid UUIDs 404.
	 */
	public function test_get_item_invalid_id() {
		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request( 'GET', '/gutenberg/v1/reusable-blocks/invalid-uuid' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 404, $response->get_status() );
		$this->assertEquals( 'gutenberg_reusable_block_invalid_id', $data['code'] );
	}

	/**
	 * Check that we get a 404 when we GET a non-existent reusable block.
	 */
	public function test_get_item_not_found() {
		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request( 'GET', '/gutenberg/v1/reusable-blocks/6e614ced-e80d-4e10-bd04-1e890b5f7f83' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 404, $response->get_status() );
		$this->assertEquals( 'gutenberg_reusable_block_not_found', $data['code'] );
	}

	/**
	 * Check that we can PUT a single reusable block.
	 */
	public function test_update_item() {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'PUT', '/gutenberg/v1/reusable-blocks/75236553-f4ba-4f12-aa25-4ba402044bd5' );
		$request->set_body_params( array(
			'name'    => 'Another cool block',
			'content' => '<figure class="wp-block-image"><img src="/image.jpg" alt="An image" /></figure>',
		) );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( array(
			'id'      => '75236553-f4ba-4f12-aa25-4ba402044bd5',
			'name'    => 'Another cool block',
			'content' => '<figure class="wp-block-image"><img src="/image.jpg" alt="An image" /></figure>',
		), $response->get_data() );
	}

	/**
	 * Check that users without permission can't PUT a single reusable block.
	 */
	public function test_update_item_when_not_allowed() {
		wp_set_current_user( self::$subscriber_id );

		$request  = new WP_REST_Request( 'PUT', '/gutenberg/v1/reusable-blocks/2d66a5c5-776c-43b1-98c7-49521cef8ea6' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'gutenberg_reusable_block_cannot_edit', $data['code'] );
	}

	/**
	 * Test cases for test_update_item_with_invalid_fields().
	 *
	 * @return array
	 */
	public function data_update_item_with_invalid_fields() {
		return array(
			array(
				array(),
				'Invalid reusable block name.',
			),
			array(
				array(
					'name' => 42,
				),
				'Invalid reusable block name.',
			),
			array(
				array(
					'name' => 'My cool block',
				),
				'Invalid reusable block content.',
			),
			array(
				array(
					'name'    => 'My cool block',
					'content' => 42,
				),
				'Invalid reusable block content.',
			),
		);
	}

	/**
	 * Check that attributes are validated correctly when we PUT a single reusable block.
	 *
	 * @dataProvider data_update_item_with_invalid_fields
	 */
	public function test_update_item_with_invalid_fields( $body_params, $expected_message ) {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'PUT', '/gutenberg/v1/reusable-blocks/75236553-f4ba-4f12-aa25-4ba402044bd5' );
		$request->set_body_params( $body_params );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'gutenberg_reusable_block_invalid_field', $data['code'] );
		$this->assertEquals( $expected_message, $data['message'] );
	}

	/**
	 * Check that we have defined a JSON schema.
	 */
	public function test_get_item_schema() {
		$request    = new WP_REST_Request( 'OPTIONS', '/gutenberg/v1/reusable-blocks' );
		$response   = $this->server->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];

		$this->assertEquals( 3, count( $properties ) );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'content', $properties );
	}

	public function test_context_param() {
		$this->markTestSkipped( 'Controller doesn\'t implement get_context_param().' );
	}
	public function test_create_item() {
		$this->markTestSkipped( 'Controller doesn\'t implement create_item().' );
	}
	public function test_delete_item() {
		$this->markTestSkipped( 'Controller doesn\'t implement delete_item().' );
	}
	public function test_prepare_item() {
		$this->markTestSkipped( 'Controller doesn\'t implement prepare_item().' );
	}
}
