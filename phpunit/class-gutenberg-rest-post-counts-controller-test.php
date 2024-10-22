<?php
/**
 * Unit tests for Gutenberg_REST_Post_Counts_Controller.
 *
 * @package gutenberg
 * @subpackage REST API
 */

/**
 * @group restapi
 */
class Gutenberg_Test_REST_Post_Counts_Controller extends WP_Test_REST_Controller_Testcase {
	/**
	 * @var int
	 */
	protected static $admin_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);

		if ( is_multisite() ) {
			grant_super_admin( self::$admin_id );
		}
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function set_up() {
		parent::set_up();

		register_post_type(
			'private-cpt',
			array(
				'public'             => false,
				'publicly_queryable' => false,
				'show_ui'            => true,
				'show_in_menu'       => true,
				'show_in_rest'       => true,
				'rest_base'          => 'private-cpts',
				'capability_type'    => 'post',
			)
		);
	}

	public function tear_down() {
		unregister_post_type( 'private-cpt' );
		parent::tear_down();
	}

	/**
	 * @covers Gutenberg_REST_Post_Counts_Controller::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/counts/(?P<post_type>[\w-]+)', $routes );
	}

	public function test_context_param() {
		// Single.
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/counts/post' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertSame( array( 'view', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	/**
	 * @covers Gutenberg_REST_Post_Counts_Controller::et_item_schema
	 */
	public function test_get_item_schema() {
		$request    = new WP_REST_Request( 'OPTIONS', '/wp/v2/counts/post' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];

		$this->assertCount( 7, $properties );
		$this->assertArrayHasKey( 'publish', $properties );
		$this->assertArrayHasKey( 'future', $properties );
		$this->assertArrayHasKey( 'draft', $properties );
		$this->assertArrayHasKey( 'pending', $properties );
		$this->assertArrayHasKey( 'private', $properties );
		$this->assertArrayHasKey( 'trash', $properties );
		$this->assertArrayHasKey( 'auto-draft', $properties );
	}

	/**
	 * @covers Gutenberg_REST_Post_Counts_Controller::get_item
	 */
	public function test_get_item_response() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/counts/post' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'publish', $data );
		$this->assertArrayHasKey( 'future', $data );
		$this->assertArrayHasKey( 'draft', $data );
		$this->assertArrayHasKey( 'pending', $data );
		$this->assertArrayHasKey( 'private', $data );
		$this->assertArrayHasKey( 'trash', $data );
		$this->assertArrayHasKey( 'auto-draft', $data );
	}

	/**
	 * @covers Gutenberg_REST_Post_Counts_Controller::get_item
	 */
	public function test_get_item() {
		wp_set_current_user( self::$admin_id );

		$published = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$future    = self::factory()->post->create(
			array(
				'post_status' => 'future',
				'post_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+1 day' ) ),
			)
		);
		$draft     = self::factory()->post->create( array( 'post_status' => 'draft' ) );
		$pending   = self::factory()->post->create( array( 'post_status' => 'pending' ) );
		$private   = self::factory()->post->create( array( 'post_status' => 'private' ) );
		$trashed   = self::factory()->post->create( array( 'post_status' => 'trash' ) );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/counts/post' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 1, $data['publish'], 'Published post count mismatch.' );
		$this->assertSame( 1, $data['future'], 'Future post count mismatch.' );
		$this->assertSame( 1, $data['draft'], 'Draft post count mismatch.' );
		$this->assertSame( 1, $data['pending'], 'Pending post count mismatch.' );
		$this->assertSame( 1, $data['private'], 'Private post count mismatch.' );
		$this->assertSame( 1, $data['trash'], 'Trashed post count mismatch.' );

		wp_delete_post( $published, true );
		wp_delete_post( $future, true );
		wp_delete_post( $draft, true );
		wp_delete_post( $pending, true );
		wp_delete_post( $private, true );
		wp_delete_post( $trashed, true );
	}

	/**
	 * @covers Gutenberg_REST_Post_Counts_Controller::get_item_permissions_check
	 */
	public function test_get_item_private_post_type() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/counts/private-cpt' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * @covers Gutenberg_REST_Post_Counts_Controller::get_item_permissions_check
	 */
	public function test_get_item_invalid_post_type() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/counts/invalid-type' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_post_type', $response, 404 );
	}

	/**
	 * @covers Gutenberg_REST_Post_Counts_Controller::get_item_permissions_check
	 */
	public function test_get_item_invalid_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/counts/post' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_read', $response, 401 );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_items() {
		// Controller does not implement delete_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// Controller does not implement delete_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// Controller does not implement test_create_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// Controller does not implement test_update_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// Controller does not implement test_prepare_item().
	}
}
