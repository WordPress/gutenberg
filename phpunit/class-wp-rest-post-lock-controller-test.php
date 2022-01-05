<?php
/**
 * Unit tests covering WP_REST_Post_Lock_Controller functionality.
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 * @coversDefaultClass WP_REST_Post_Lock_Controller
 */
class WP_REST_Post_Lock_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * Contributor user id.
	 *
	 * @var int
	 */
	protected static $contributor;

	/**
	 * Editor user id.
	 *
	 * @var int
	 */
	protected static $editor;

	/**
	 * Set up class test fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory WordPress unit test factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$contributor = $factory->user->create(
			array(
				'role' => 'contributor',
			)
		);

		self::$editor = $factory->user->create(
			array(
				'role'       => 'editor',
				'user_email' => 'editor@example.com',
			)
		);
	}

	/**
	 * @covers ::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/wp/v2/posts/(?P<id>[\d]+)/lock', $routes );
		$this->assertCount( 3, $routes['/wp/v2/posts/(?P<id>[\d]+)/lock'] );
	}

	/**
	 * @covers ::get_context_param
	 */
	public function test_context_param() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/posts/999/lock' );
		$response = rest_get_server()->dispatch( $request );
		$patterns = $response->get_data();

		$this->assertSame( 'view', $patterns['endpoints'][0]['args']['context']['default'] );
		$this->assertSame( array( 'view', 'embed', 'edit' ), $patterns['endpoints'][0]['args']['context']['enum'] );
	}

	public function test_get_items() {
		$this->markTestSkipped( 'Controller does not have get_items route.' );
	}

	/**
	 * @covers ::get_item
	 */
	public function test_get_item() {
		wp_set_current_user( self::$editor );
		$post_id  = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$editor,
			)
		);
		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/wp/v2/posts/' . $post_id . '/lock' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_lock', $response, 404 );

		$now     = time();
		$user_id = self::$editor;
		$lock    = "$now:$user_id";

		update_post_meta( $post_id, '_edit_lock', $lock );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/wp/v2/posts/' . $post_id . '/lock' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$links    = $response->get_links();

		$this->assertArrayHasKey( 'author', $data );
		$this->assertArrayHasKey( 'id', $data );
		$this->assertArrayHasKey( 'date', $data );
		$this->assertSame( $data['id'], $post_id );
		$this->assertSame( $data['author'], $user_id );

		$this->assertArrayHasKey( 'self', $links );
		$this->assertArrayHasKey( 'author', $links );
	}

	/**
	 * @covers ::get_item
	 */
	public function test_get_item_expired() {
		wp_set_current_user( self::$editor );
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$editor,
			)
		);

		$now     = time() - 1000;
		$user_id = self::$editor;
		$lock    = "$now:$user_id";

		update_post_meta( $post_id, '_edit_lock', $lock );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/wp/v2/posts/' . $post_id . '/lock' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_expired_lock', $response, 404 );
	}

	/**
	 * @covers ::get_item
	 * @covers ::prepare_item_for_response
	 * @covers ::get_item_permissions_check
	 */
	public function test_get_item_no_post() {
		wp_set_current_user( self::$editor );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/wp/v2/posts/99999/lock' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_id', $response, 404 );
	}

	/**
	 * @covers ::create_item
	 */
	public function test_create_item() {
		wp_set_current_user( self::$editor );
		$post_id  = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$editor,
			)
		);
		$request  = new WP_REST_Request( WP_REST_Server::CREATABLE, '/wp/v2/posts/' . $post_id . '/lock' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$links    = $response->get_links();

		$this->assertArrayHasKey( 'author', $data );
		$this->assertArrayHasKey( 'id', $data );
		$this->assertArrayHasKey( 'date', $data );
		$this->assertSame( $data['id'], $post_id );
		$this->assertSame( $data['author'], self::$editor );

		$this->assertArrayHasKey( 'self', $links );
		$this->assertArrayHasKey( 'author', $links );
	}

	/**
	 * @covers ::update_item
	 */
	public function test_create_item_invalid_user() {
		wp_set_current_user( self::$contributor );
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$editor,
			)
		);

		$request  = new WP_REST_Request( WP_REST_Server::CREATABLE, '/wp/v2/posts/' . $post_id . '/lock' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}


	/**
	 * @covers ::update_item
	 */
	public function test_create_item_no_user() {
		wp_set_current_user( 0 );
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$editor,
			)
		);

		$request  = new WP_REST_Request( WP_REST_Server::CREATABLE, '/wp/v2/posts/' . $post_id . '/lock' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 401 );
	}

	/**
	 * @covers ::create_item
	 */
	public function test_create_item_no_post() {
		wp_set_current_user( self::$editor );

		$request  = new WP_REST_Request( WP_REST_Server::CREATABLE, '/wp/v2/posts/99999/lock' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_id', $response, 404 );
	}

	/**
	 * @covers ::update_item
	 */
	public function test_update_item() {
		wp_set_current_user( self::$editor );
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$editor,
			)
		);
		$now     = time();
		$user_id = self::$editor;
		$lock    = "$now:$user_id";

		update_post_meta( $post_id, '_edit_lock', $lock );

		$request  = new WP_REST_Request( 'PUT', '/wp/v2/posts/' . $post_id . '/lock' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$links    = $response->get_links();

		$this->assertArrayHasKey( 'author', $data );
		$this->assertArrayHasKey( 'id', $data );
		$this->assertArrayHasKey( 'date', $data );
		$this->assertSame( $data['id'], $post_id );
		$this->assertSame( $data['author'], self::$editor );

		$this->assertArrayHasKey( 'self', $links );
		$this->assertArrayHasKey( 'author', $links );
	}

	/**
	 * @covers ::update_item
	 */
	public function test_update_item_invalid_user() {
		wp_set_current_user( self::$contributor );
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$editor,
			)
		);
		$now     = time();
		$user_id = self::$editor;
		$lock    = "$now:$user_id";

		update_post_meta( $post_id, '_edit_lock', $lock );

		$request  = new WP_REST_Request( 'PUT', '/wp/v2/posts/' . $post_id . '/lock' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}


	/**
	 * @covers ::update_item
	 */
	public function test_update_item_no_user() {
		wp_set_current_user( 0 );
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$editor,
			)
		);
		$now     = time();
		$user_id = self::$editor;
		$lock    = "$now:$user_id";

		update_post_meta( $post_id, '_edit_lock', $lock );

		$request  = new WP_REST_Request( 'PUT', '/wp/v2/posts/' . $post_id . '/lock' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 401 );
	}

	/**
	 * @covers ::update_item
	 */
	public function test_update_item_no_post() {
		wp_set_current_user( self::$editor );

		$request  = new WP_REST_Request( 'PUT', '/wp/v2/posts/99999/lock' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_id', $response, 404 );
	}

	/**
	 * @covers ::delete_item
	 */
	public function test_delete_item() {
		wp_set_current_user( self::$editor );
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$editor,
			)
		);
		$now     = time();
		$user_id = self::$editor;
		$lock    = "$now:$user_id";

		update_post_meta( $post_id, '_edit_lock', $lock );

		$request  = new WP_REST_Request( WP_REST_Server::DELETABLE, '/wp/v2/posts/' . $post_id . '/lock' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'deleted', $data );
		$this->assertArrayHasKey( 'previous', $data );
		$this->assertArrayHasKey( 'id', $data['previous'] );
		$this->assertTrue( $data['deleted'] );
	}

	/**
	 * @covers ::delete_item
	 */
	public function test_delete_item_different_user() {
		wp_set_current_user( self::$editor );
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$contributor,
			)
		);
		$now     = time();
		$user_id = self::$contributor;
		$lock    = "$now:$user_id";

		update_post_meta( $post_id, '_edit_lock', $lock );

		$request  = new WP_REST_Request( WP_REST_Server::DELETABLE, '/wp/v2/posts/' . $post_id . '/lock' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_delete_others_lock', $response, 403 );
	}

	/**
	 * @covers ::delete_item
	 */
	public function test_delete_item_no_post() {
		wp_set_current_user( self::$editor );

		$request  = new WP_REST_Request( WP_REST_Server::DELETABLE, '/wp/v2/posts/99999/lock' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_id', $response, 404 );
	}

	/**
	 * @covers ::delete_item
	 */
	public function test_delete_item_invalid_user() {
		wp_set_current_user( self::$contributor );
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$editor,
			)
		);

		$request  = new WP_REST_Request( WP_REST_Server::DELETABLE, '/wp/v2/posts/' . $post_id . '/lock' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}


	/**
	 * @covers ::delete_item
	 */
	public function test_delete_item_no_user() {
		wp_set_current_user( 0 );
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$editor,
			)
		);

		$request  = new WP_REST_Request( WP_REST_Server::DELETABLE, '/wp/v2/posts/' . $post_id . '/lock' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 401 );
	}

	public function test_prepare_item() {
		$this->markTestSkipped( 'Controller does not implement prepare_item().' );
	}


	/**
	 * @covers ::get_item_schema
	 */
	public function test_get_item_schema() {
		wp_set_current_user( self::$editor );
		$request    = new WP_REST_Request( 'OPTIONS', '/wp/v2/posts/99999/lock' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertCount( 3, $properties );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'date', $properties );
		$this->assertArrayHasKey( 'author', $properties );
	}
}
