<?php
/**
 * WP_REST_Blocks_Controller tests
 *
 * @package gutenberg
 */

/**
 * Tests for WP_REST_Blocks_Controller.
 */
class REST_Blocks_Controller_Test extends WP_UnitTestCase {

	/**
	 * Our fake block's post ID.
	 *
	 * @var int
	 */
	protected static $post_id;

	/**
	 * Our fake user IDs, keyed by their role.
	 *
	 * @var array
	 */
	protected static $user_ids;

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$post_id = wp_insert_post(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_title'   => 'My cool block',
				'post_content' => '<!-- wp:paragraph --><p>Hello!</p><!-- /wp:paragraph -->',
			)
		);

		self::$user_ids = array(
			'editor'      => $factory->user->create( array( 'role' => 'editor' ) ),
			'author'      => $factory->user->create( array( 'role' => 'author' ) ),
			'contributor' => $factory->user->create( array( 'role' => 'contributor' ) ),
		);
	}

	/**
	 * Delete our fake data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post_id );

		foreach ( self::$user_ids as $user_id ) {
			self::delete_user( $user_id );
		}
	}

	/**
	 * Test cases for test_capabilities().
	 */
	public function data_capabilities() {
		return array(
			array( 'create', 'editor', 201 ),
			array( 'create', 'author', 201 ),
			array( 'create', 'contributor', 403 ),
			array( 'create', null, 401 ),

			array( 'read', 'editor', 200 ),
			array( 'read', 'author', 200 ),
			array( 'read', 'contributor', 200 ),
			array( 'read', null, 401 ),

			array( 'update_delete_own', 'editor', 200 ),
			array( 'update_delete_own', 'author', 200 ),
			array( 'update_delete_own', 'contributor', 403 ),

			array( 'update_delete_others', 'editor', 200 ),
			array( 'update_delete_others', 'author', 403 ),
			array( 'update_delete_others', 'contributor', 403 ),
			array( 'update_delete_others', null, 401 ),
		);
	}

	/**
	 * Exhaustively check that each role either can or cannot create, edit,
	 * update, and delete reusable blocks.
	 *
	 * @dataProvider data_capabilities
	 */
	public function test_capabilities( $action, $role, $expected_status ) {
		if ( $role ) {
			$user_id = self::$user_ids[ $role ];
			wp_set_current_user( $user_id );
		} else {
			wp_set_current_user( 0 );
		}

		switch ( $action ) {
			case 'create':
				$request = new WP_REST_Request( 'POST', '/wp/v2/blocks' );
				$request->set_body_params(
					array(
						'title'   => 'Test',
						'content' => '<!-- wp:paragraph --><p>Test</p><!-- /wp:paragraph -->',
					)
				);

				$response = rest_get_server()->dispatch( $request );
				$this->assertEquals( $expected_status, $response->get_status() );

				break;

			case 'read':
				$request = new WP_REST_Request( 'GET', '/wp/v2/blocks/' . self::$post_id );

				$response = rest_get_server()->dispatch( $request );
				$this->assertEquals( $expected_status, $response->get_status() );

				break;

			case 'update_delete_own':
				$post_id = wp_insert_post(
					array(
						'post_type'    => 'wp_block',
						'post_status'  => 'publish',
						'post_title'   => 'My cool block',
						'post_content' => '<!-- wp:paragraph --><p>Hello!</p><!-- /wp:paragraph -->',
						'post_author'  => $user_id,
					)
				);

				$request = new WP_REST_Request( 'PUT', '/wp/v2/blocks/' . $post_id );
				$request->set_body_params(
					array(
						'title'   => 'Test',
						'content' => '<!-- wp:paragraph --><p>Test</p><!-- /wp:paragraph -->',
					)
				);

				$response = rest_get_server()->dispatch( $request );
				$this->assertEquals( $expected_status, $response->get_status() );

				$request = new WP_REST_Request( 'DELETE', '/wp/v2/blocks/' . $post_id );

				$response = rest_get_server()->dispatch( $request );
				$this->assertEquals( $expected_status, $response->get_status() );

				wp_delete_post( $post_id );

				break;

			case 'update_delete_others':
				$request = new WP_REST_Request( 'PUT', '/wp/v2/blocks/' . self::$post_id );
				$request->set_body_params(
					array(
						'title'   => 'Test',
						'content' => '<!-- wp:paragraph --><p>Test</p><!-- /wp:paragraph -->',
					)
				);

				$response = rest_get_server()->dispatch( $request );
				$this->assertEquals( $expected_status, $response->get_status() );

				$request = new WP_REST_Request( 'DELETE', '/wp/v2/blocks/' . self::$post_id );

				$response = rest_get_server()->dispatch( $request );
				$this->assertEquals( $expected_status, $response->get_status() );

				break;

			default:
				$this->fail( "'$action' is not a valid action." );
		}
	}

	/**
	 * Check that the raw title and content of a block can be accessed when there
	 * is no set schema, and that the rendered content of a block is not included
	 * in the response.
	 */
	public function test_content() {
		wp_set_current_user( self::$user_ids['author'] );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/blocks/' . self::$post_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals(
			array(
				'raw' => 'My cool block',
			),
			$data['title']
		);
		$this->assertEquals(
			array(
				'raw'       => '<!-- wp:paragraph --><p>Hello!</p><!-- /wp:paragraph -->',
				'protected' => false,
			),
			$data['content']
		);
	}
}
