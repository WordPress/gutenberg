<?php
/**
 * Unit tests covering WP_REST_Users_Controller functionality.
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 */
class WP_Test_REST_Users_Controller extends WP_Test_REST_Controller_Testcase {
	protected static $superadmin;
	protected static $user;
	protected static $editor;
	protected static $draft_editor;
	protected static $subscriber;

	protected static $authors     = array();
	protected static $posts       = array();
	protected static $user_ids    = array();
	protected static $total_users = 30;
	protected static $per_page    = 50;

	protected static $site;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$superadmin   = $factory->user->create(
			array(
				'role'       => 'administrator',
				'user_login' => 'superadmin',
			)
		);
		self::$user         = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$editor       = $factory->user->create(
			array(
				'role'       => 'editor',
				'user_email' => 'editor@example.com',
			)
		);
		self::$draft_editor = $factory->user->create(
			array(
				'role'       => 'editor',
				'user_email' => 'draft-editor@example.com',
			)
		);
		self::$subscriber   = $factory->user->create(
			array(
				'role'         => 'subscriber',
				'display_name' => 'subscriber',
				'user_email'   => 'subscriber@example.com',
			)
		);

		foreach ( array( true, false ) as $show_in_rest ) {
			foreach ( array( true, false ) as $public ) {
				$post_type_name = 'r_' . json_encode( $show_in_rest ) . '_p_' . json_encode( $public );
				register_post_type(
					$post_type_name,
					array(
						'public'                   => $public,
						'show_in_rest'             => $show_in_rest,
						'tests_no_auto_unregister' => true,
					)
				);
				self::$authors[ $post_type_name ] = $factory->user->create(
					array(
						'role'       => 'editor',
						'user_email' => 'author_' . $post_type_name . '@example.com',
					)
				);
				self::$posts[ $post_type_name ]   = $factory->post->create(
					array(
						'post_type'   => $post_type_name,
						'post_author' => self::$authors[ $post_type_name ],
					)
				);
			}
		}

		self::$posts['post']                = $factory->post->create(
			array(
				'post_type'   => 'post',
				'post_author' => self::$editor,
			)
		);
		self::$posts['r_true_p_true_DRAFT'] = $factory->post->create(
			array(
				'post_type'   => 'r_true_p_true',
				'post_author' => self::$draft_editor,
				'post_status' => 'draft',
			)
		);

		if ( is_multisite() ) {
			self::$site = $factory->blog->create(
				array(
					'domain' => 'rest.wordpress.org',
					'path'   => '/',
				)
			);
			update_site_option( 'site_admins', array( 'superadmin' ) );
		}

		// Set up users for pagination tests.
		for ( $i = 0; $i < self::$total_users - 10; $i++ ) {
			self::$user_ids[] = $factory->user->create(
				array(
					'role'         => 'contributor',
					'display_name' => "User {$i}",
				)
			);
		}
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$user );
		self::delete_user( self::$editor );
		self::delete_user( self::$draft_editor );

		foreach ( self::$posts as $post ) {
			wp_delete_post( $post, true );
		}

		foreach ( self::$authors as $author ) {
			self::delete_user( $author );
		}

		_unregister_post_type( 'r_true_p_true' );
		_unregister_post_type( 'r_true_p_false' );
		_unregister_post_type( 'r_false_p_true' );
		_unregister_post_type( 'r_false_p_false' );

		if ( is_multisite() ) {
			wp_delete_site( self::$site );
		}

		// Remove users for pagination tests.
		foreach ( self::$user_ids as $user_id ) {
			self::delete_user( $user_id );
		}
	}

	/**
	 * This function is run before each method
	 */
	public function setUp() {
		parent::setUp();
		$this->endpoint = new WP_REST_Users_Controller();
	}

	/**
	 * The following methods are implemented in core and tested.
	 * We need to define them here because they exist in the abstract parent.
	 */
	public function test_register_routes() {}
	public function test_context_param() {}
	public function test_get_item() {}
	public function test_prepare_item() {}
	public function test_create_item() {}
	public function test_update_item() {}
	public function test_delete_item() {}
	public function test_get_items() {}
	public function test_get_item_schema() {}

	public function test_registered_query_params() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/users' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$keys     = array_keys( $data['endpoints'][0]['args'] );
		sort( $keys );
		$this->assertSame(
			array(
				'context',
				'exclude',
				'has_published_posts',
				'include',
				'offset',
				'order',
				'orderby',
				'page',
				'per_page',
				'roles',
				'search',
				'slug',
				'who',
			),
			$keys
		);
	}

	/**
	 * Test the has_published_posts param.
	 */
	public function test_get_items_has_published_posts_query() {
		wp_set_current_user( self::$superadmin );

		// Test all users who have authored a post.
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'has_published_posts', true );
		$response = rest_get_server()->dispatch( $request );
		// Make sure the response status is successful.
		$this->assertSame( 200, $response->get_status() );
		// Make sure we have 3 authors.
		$this->assertCount( 3, $response->get_data() );
		// Make sure we have the right author IDs.
		$this->assertSame( 4, $response->get_data()[0]['id'] );
		$this->assertSame( 7, $response->get_data()[1]['id'] );
		$this->assertSame( 8, $response->get_data()[2]['id'] );

		// Test users for a specific post-type.
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'has_published_posts', array( 'r_true_p_true' ) );
		$response = rest_get_server()->dispatch( $request );
		// Make sure the response status is successful.
		$this->assertSame( 200, $response->get_status() );
		// Make sure we only have 1 author.
		$this->assertCount( 1, $response->get_data() );
		// Make sure we got the correct author.
		$this->assertSame( 7, $response->get_data()[0]['id'] );

		// Test invalid post-type.
		$request = new WP_REST_Request( 'GET', '/wp/v2/users' );
		$request->set_param( 'has_published_posts', array( 'dummy' ) );
		$response = rest_get_server()->dispatch( $request );
		// Make sure the response has a status of 400.
		$this->assertSame( 400, $response->get_status() );
	}
}
