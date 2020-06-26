<?php
/**
 * REST API: REST_Nav_Menu_Items_Controller_Test class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Tests for REST API for Menu items.
 *
 * @see WP_Test_REST_Post_Type_Controller_Testcase
 */
class REST_Nav_Menu_Items_Controller_Test extends WP_Test_REST_Post_Type_Controller_Testcase {
	/**
	 * @var int
	 */
	protected $menu_id;
	/**
	 * @var int
	 */
	protected $tag_id;
	/**
	 * @var int
	 */
	protected $menu_item_id;

	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * @var int
	 */
	protected static $subscriber_id;

	/**
	 *
	 */
	const POST_TYPE = 'nav_menu_item';

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id      = $factory->user->create(
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
	 *
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$subscriber_id );
	}

	/**
	 *
	 */
	public function setUp() {
		parent::setUp();

		$this->tag_id = self::factory()->tag->create();

		$this->menu_id = wp_create_nav_menu( rand_str() );

		$this->menu_item_id = wp_update_nav_menu_item(
			$this->menu_id,
			0,
			array(
				'menu-item-type'      => 'taxonomy',
				'menu-item-object'    => 'post_tag',
				'menu-item-object-id' => $this->tag_id,
				'menu-item-status'    => 'publish',
			)
		);
	}

	/**
	 *
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/__experimental/menu-items', $routes );
		$this->assertCount( 2, $routes['/__experimental/menu-items'] );
		$this->assertArrayHasKey( '/__experimental/menu-items/(?P<id>[\d]+)', $routes );
		$this->assertCount( 3, $routes['/__experimental/menu-items/(?P<id>[\d]+)'] );
	}

	/**
	 *
	 */
	public function test_context_param() {
		// Collection.
		$request  = new WP_REST_Request( 'OPTIONS', '/__experimental/menu-items' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
		// Single.
		$request  = new WP_REST_Request( 'OPTIONS', '/__experimental/menu-items/' . $this->menu_item_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	/**
	 *
	 */
	public function test_registered_query_params() {
		$request    = new WP_REST_Request( 'OPTIONS', '/__experimental/menu-items' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['endpoints'][0]['args'];
		$this->assertArrayHasKey( 'before', $properties );
		$this->assertArrayHasKey( 'context', $properties );
		$this->assertArrayHasKey( 'exclude', $properties );
		$this->assertArrayHasKey( 'include', $properties );
		$this->assertArrayHasKey( 'menu_order', $properties );
		$this->assertArrayHasKey( 'menus', $properties );
		$this->assertArrayHasKey( 'menus_exclude', $properties );
		$this->assertArrayHasKey( 'offset', $properties );
		$this->assertArrayHasKey( 'order', $properties );
		$this->assertArrayHasKey( 'orderby', $properties );
		$this->assertArrayHasKey( 'page', $properties );
		$this->assertArrayHasKey( 'per_page', $properties );
		$this->assertArrayHasKey( 'search', $properties );
		$this->assertArrayHasKey( 'slug', $properties );
		$this->assertArrayHasKey( 'status', $properties );
	}

	/**
	 *
	 */
	public function test_registered_get_item_params() {
		$request  = new WP_REST_Request( 'OPTIONS', sprintf( '/__experimental/menu-items/%d', $this->menu_item_id ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$keys     = array_keys( $data['endpoints'][0]['args'] );
		sort( $keys );
		$this->assertEquals( array( 'context', 'id' ), $keys );
	}

	/**
	 *
	 */
	public function test_get_items() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menu-items' );
		$response = rest_get_server()->dispatch( $request );

		$this->check_get_menu_items_response( $response );
	}

	/**
	 *
	 */
	public function test_get_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', sprintf( '/__experimental/menu-items/%d', $this->menu_item_id ) );
		$response = rest_get_server()->dispatch( $request );

		$this->check_get_menu_item_response( $response, 'view' );
	}

	/**
	 *
	 */
	public function test_create_item() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data();
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );

		$this->check_create_menu_item_response( $response );
	}

	/**
	 *
	 */
	public function test_create_item_invalid_term() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'type'  => 'taxonomy',
				'title' => 'Tags',
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$this->assertEquals( 'Invalid term ID.', $response->get_data()['data']['params']['object_id'] );
	}

	/**
	 *
	 */
	public function test_create_item_change_position() {
		wp_set_current_user( self::$admin_id );
		$new_menu_id = wp_create_nav_menu( rand_str() );
		for ( $i = 1; $i < 5; $i ++ ) {
			$request = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
			$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
			$params = $this->set_menu_item_data(
				array(
					'menus' => $new_menu_id,
				)
			);
			$request->set_body_params( $params );
			$response = rest_get_server()->dispatch( $request );
			$this->check_create_menu_item_response( $response );
			$data = $response->get_data();
			$this->assertEquals( $data['menu_order'], $i );
		}
	}

	/**
	 *
	 */
	public function test_create_item_invalid_position() {
		wp_set_current_user( self::$admin_id );
		$new_menu_id = wp_create_nav_menu( rand_str() );
		$request     = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'menu_order' => 1,
				'menus'      => $new_menu_id,
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->check_create_menu_item_response( $response );
		$request = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'menu_order' => 1,
				'menus'      => $new_menu_id,
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$this->assertEquals( 'Invalid menu position.', $response->get_data()['data']['params']['menu_order'] );
	}

	/**
	 *
	 */
	public function test_create_item_invalid_position_2() {
		wp_set_current_user( self::$admin_id );
		$new_menu_id = wp_create_nav_menu( rand_str() );
		$request     = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'menu_order' => 'ddddd',
				'menus'      => $new_menu_id,
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 *
	 */
	public function test_create_item_invalid_position_3() {
		wp_set_current_user( self::$admin_id );
		$new_menu_id = wp_create_nav_menu( rand_str() );
		$request     = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'menu_order' => -9,
				'menus'      => $new_menu_id,
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 *
	 */
	public function test_create_item_invalid_parent() {
		wp_set_current_user( self::$admin_id );
		wp_create_nav_menu( rand_str() );
		$request = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'parent' => -9,
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 *
	 */
	public function test_create_item_invalid_parent_menu_item() {
		wp_set_current_user( self::$admin_id );
		$new_menu_id = wp_create_nav_menu( rand_str() );
		$request     = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'menus'  => $new_menu_id,
				'parent' => $this->menu_item_id,
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$this->assertEquals( 'Invalid menu item parent.', $response->get_data()['data']['params']['parent'] );
	}

	/**
	 *
	 */
	public function test_create_item_invalid_parent_post() {
		wp_set_current_user( self::$admin_id );
		$post_id = self::factory()->post->create();
		$request = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'parent' => $post_id,
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$this->assertEquals( 'Invalid menu item parent.', $response->get_data()['data']['params']['parent'] );
	}

	/**
	 *
	 */
	public function test_create_item_invalid_menu() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'menus' => -9,
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$this->assertEquals( 'Invalid menu ID.', $response->get_data()['data']['params']['menus'] );
	}

	/**
	 *
	 */
	public function test_create_item_invalid_post() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'type'  => 'post_type',
				'title' => 'Post',
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$this->assertEquals( 'Invalid post ID.', $response->get_data()['data']['params']['object_id'] );
	}

	/**
	 *
	 */
	public function test_create_item_invalid_post_type() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'type'             => 'post_type_archive',
				'menu-item-object' => 'invalid_post_type',
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_type', $response, 400 );
	}

	/**
	 *
	 */
	public function test_create_item_invalid_custom_link() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'type'  => 'custom',
				'title' => '',
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$this->assertEquals( 'Title required if menu item of type custom.', $response->get_data()['data']['params']['title'] );
	}

	/**
	 *
	 */
	public function test_create_item_invalid_custom_link_url() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/__experimental/menu-items' );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'type' => 'custom',
				'url'  => '',
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$this->assertEquals( 'Invalid URL.', $response->get_data()['data']['params']['url'] );
	}

	/**
	 *
	 */
	public function test_update_item() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'PUT', sprintf( '/__experimental/menu-items/%d', $this->menu_item_id ) );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'xfn' => array( 'test1', 'test2', 'test3' ),
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->check_update_menu_item_response( $response );
		$new_data = $response->get_data();
		$this->assertEquals( $this->menu_item_id, $new_data['id'] );
		$this->assertEquals( $params['title'], $new_data['title']['raw'] );
		$this->assertEquals( $params['description'], $new_data['description'] );
		$this->assertEquals( $params['type_label'], $new_data['type_label'] );
		$this->assertEquals( $params['xfn'], $new_data['xfn'] );
		$post      = get_post( $this->menu_item_id );
		$menu_item = wp_setup_nav_menu_item( $post );
		$this->assertEquals( $params['title'], $menu_item->title );
		$this->assertEquals( $params['description'], $menu_item->description );
		$this->assertEquals( $params['xfn'], explode( ' ', $menu_item->xfn ) );
	}

	/**
	 *
	 */
	public function test_update_item_clean_xfn() {
		wp_set_current_user( self::$admin_id );

		$bad_data  = array( 'test1":|":', 'test2+|+', 'test3±', 'test4😀' );
		$good_data = array( 'test1', 'test2', 'test3', 'test4' );

		$request = new WP_REST_Request( 'PUT', sprintf( '/__experimental/menu-items/%d', $this->menu_item_id ) );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data(
			array(
				'xfn' => $bad_data,
			)
		);
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->check_update_menu_item_response( $response );
		$new_data = $response->get_data();
		$this->assertEquals( $this->menu_item_id, $new_data['id'] );
		$this->assertEquals( $params['title'], $new_data['title']['raw'] );
		$this->assertEquals( $params['description'], $new_data['description'] );
		$this->assertEquals( $params['type_label'], $new_data['type_label'] );
		$this->assertEquals( $good_data, $new_data['xfn'] );
		$post      = get_post( $this->menu_item_id );
		$menu_item = wp_setup_nav_menu_item( $post );
		$this->assertEquals( $params['title'], $menu_item->title );
		$this->assertEquals( $params['description'], $menu_item->description );
		$this->assertEquals( $good_data, explode( ' ', $menu_item->xfn ) );
	}


	/**
	 *
	 */
	public function test_update_item_invalid() {
		wp_set_current_user( self::$admin_id );
		$post_id = self::factory()->post->create();

		$request = new WP_REST_Request( 'PUT', sprintf( '/__experimental/menu-items/%d', $post_id ) );
		$request->add_header( 'content-type', 'application/x-www-form-urlencoded' );
		$params = $this->set_menu_item_data();
		$request->set_body_params( $params );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_id', $response, 404 );
	}

	/**
	 *
	 */
	public function test_delete_item() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'DELETE', sprintf( '/__experimental/menu-items/%d', $this->menu_item_id ) );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertNull( get_post( $this->menu_item_id ) );
	}


	/**
	 *
	 */
	public function test_delete_item_no_force() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'DELETE', sprintf( '/__experimental/menu-items/%d', $this->menu_item_id ) );
		$request->set_param( 'force', false );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 501, $response->get_status() );
		$this->assertNotNull( get_post( $this->menu_item_id ) );
	}

	/**
	 *
	 */
	public function test_prepare_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menu-items/' . $this->menu_item_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->check_get_menu_item_response( $response );
	}

	/**
	 *
	 */
	public function test_get_item_schema() {
		$request    = new WP_REST_Request( 'OPTIONS', '/__experimental/menu-items' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertEquals( 18, count( $properties ) );
		$this->assertArrayHasKey( 'type_label', $properties );
		$this->assertArrayHasKey( 'attr_title', $properties );
		$this->assertArrayHasKey( 'classes', $properties );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'url', $properties );
		$this->assertArrayHasKey( 'meta', $properties );
		$this->assertArrayHasKey( 'menu_order', $properties );
		$this->assertArrayHasKey( 'object', $properties );
		$this->assertArrayHasKey( 'object_id', $properties );
		$this->assertArrayHasKey( 'target', $properties );
		$this->assertArrayHasKey( 'parent', $properties );
		$this->assertArrayHasKey( 'status', $properties );
		$this->assertArrayHasKey( 'title', $properties );
		$this->assertArrayHasKey( 'type', $properties );
		$this->assertArrayHasKey( 'xfn', $properties );
		$this->assertArrayHasKey( '_invalid', $properties );
	}

	/**
	 *
	 */
	public function test_get_items_no_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menu-items' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_view', $response, 401 );
	}

	/**
	 *
	 */
	public function test_get_item_no_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menu-items/' . $this->menu_item_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_view', $response, 401 );
	}

	/**
	 *
	 */
	public function test_get_items_wrong_permission() {
		wp_set_current_user( self::$subscriber_id );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menu-items' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_view', $response, 403 );
	}

	/**
	 *
	 */
	public function test_get_item_wrong_permission() {
		wp_set_current_user( self::$subscriber_id );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menu-items/' . $this->menu_item_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_view', $response, 403 );
	}

	/**
	 * @param WP_REST_Response $response Response Class.
	 * @param string           $context Defaults to View.
	 */
	protected function check_get_menu_items_response( $response, $context = 'view' ) {
		$this->assertNotWPError( $response );
		$response = rest_ensure_response( $response );
		$this->assertEquals( 200, $response->get_status() );

		$headers = $response->get_headers();
		$this->assertArrayHasKey( 'X-WP-Total', $headers );
		$this->assertArrayHasKey( 'X-WP-TotalPages', $headers );

		$all_data = $response->get_data();
		foreach ( $all_data as $data ) {
			$post = get_post( $data['id'] );
			// Base fields for every post.
			$menu_item = wp_setup_nav_menu_item( $post );
			/**
			 * As the links for the post are "response_links" format in the data array we have to pull them out and parse them.
			 */
			$links = $data['_links'];
			foreach ( $links as &$links_array ) {
				foreach ( $links_array as &$link ) {
					$attributes         = array_diff_key(
						$link,
						array(
							'href' => 1,
							'name' => 1,
						)
					);
					$link               = array_diff_key( $link, $attributes );
					$link['attributes'] = $attributes;
				}
			}

			$this->check_menu_item_data( $menu_item, $data, $context, $links );
		}
	}

	/**
	 * @param WP_Post $post WP_Post object.
	 * @param array   $data Data compare.
	 * @param string  $context Context of REST Request.
	 * @param array   $links Array links.
	 */
	protected function check_menu_item_data( $post, $data, $context, $links ) {
		$post_type_obj = get_post_type_object( self::POST_TYPE );

		// Standard fields.
		$this->assertEquals( $post->ID, $data['id'] );
		$this->assertEquals( wpautop( $post->post_content ), $data['description'] );

		// Check filtered values.
		if ( post_type_supports( self::POST_TYPE, 'title' ) ) {
			add_filter( 'protected_title_format', array( $this, 'protected_title_format' ) );
			$this->assertEquals( $post->title, $data['title']['rendered'] );
			remove_filter( 'protected_title_format', array( $this, 'protected_title_format' ) );
			if ( 'edit' === $context ) {
				$this->assertEquals( $post->post_title, $data['title']['raw'] );
			} else {
				$this->assertFalse( isset( $data['title']['raw'] ) );
			}
		} else {
			$this->assertFalse( isset( $data['title'] ) );
		}

		// post_parent.
		$this->assertArrayHasKey( 'parent', $data );
		if ( $post->post_parent ) {
			if ( is_int( $data['parent'] ) ) {
				$this->assertEquals( $post->post_parent, $data['parent'] );
			} else {
				$this->assertEquals( $post->post_parent, $data['parent']['id'] );
				$menu_item = wp_setup_nav_menu_item( get_post( $data['parent']['id'] ) );
				$this->check_get_menu_item_response( $data['parent'], $menu_item, 'view-parent' );
			}
		} else {
			$this->assertEmpty( $data['parent'] );
		}

		// page attributes.
		$this->assertEquals( $post->menu_order, $data['menu_order'] );

		$taxonomies = wp_list_filter( get_object_taxonomies( self::POST_TYPE, 'objects' ), array( 'show_in_rest' => true ) );
		foreach ( $taxonomies as $taxonomy ) {
			$this->assertTrue( isset( $data[ $taxonomy->rest_base ] ) );
			$terms = wp_get_object_terms( $post->ID, $taxonomy->name, array( 'fields' => 'ids' ) );
			sort( $terms );
			sort( $data[ $taxonomy->rest_base ] );
			$this->assertEquals( $terms, $data[ $taxonomy->rest_base ] );
		}

		// test links.
		if ( $links ) {
			$links = test_rest_expand_compact_links( $links );
			$this->assertEquals( $links['self'][0]['href'], rest_url( '__experimental/' . $post_type_obj->rest_base . '/' . $data['id'] ) );
			$this->assertEquals( $links['collection'][0]['href'], rest_url( '__experimental/' . $post_type_obj->rest_base ) );
			$this->assertEquals( $links['about'][0]['href'], rest_url( 'wp/v2/types/' . self::POST_TYPE ) );

			$num = 0;
			foreach ( $taxonomies as $key => $taxonomy ) {
				$this->assertEquals( $taxonomy->name, $links['https://api.w.org/term'][ $num ]['attributes']['taxonomy'] );
				$this->assertEquals( add_query_arg( 'post', $data['id'], rest_url( 'wp/v2/' . $taxonomy->rest_base ) ), $links['https://api.w.org/term'][ $num ]['href'] );
				$num ++;
			}
		}
	}

	/**
	 * @param WP_REST_Response $response Response Class.
	 * @param string           $context Defaults to View.
	 */
	protected function check_get_menu_item_response( $response, $context = 'view' ) {
		$this->assertNotWPError( $response );
		$response = rest_ensure_response( $response );
		$this->assertEquals( 200, $response->get_status() );

		$data      = $response->get_data();
		$post      = get_post( $data['id'] );
		$menu_item = wp_setup_nav_menu_item( $post );
		$this->check_menu_item_data( $menu_item, $data, $context, $response->get_links() );
	}

	/**
	 * @param WP_REST_Response $response Response Class.
	 */
	protected function check_create_menu_item_response( $response ) {
		$this->assertNotWPError( $response );
		$response = rest_ensure_response( $response );

		$this->assertEquals( 201, $response->get_status() );
		$headers = $response->get_headers();
		$this->assertArrayHasKey( 'Location', $headers );

		$data      = $response->get_data();
		$post      = get_post( $data['id'] );
		$menu_item = wp_setup_nav_menu_item( $post );
		$this->check_menu_item_data( $menu_item, $data, 'edit', $response->get_links() );
	}

	/**
	 * @param WP_REST_Response $response Response Class.
	 */
	protected function check_update_menu_item_response( $response ) {
		$this->assertNotWPError( $response );
		$response = rest_ensure_response( $response );

		$this->assertEquals( 200, $response->get_status() );
		$headers = $response->get_headers();
		$this->assertArrayNotHasKey( 'Location', $headers );

		$data      = $response->get_data();
		$post      = get_post( $data['id'] );
		$menu_item = wp_setup_nav_menu_item( $post );
		$this->check_menu_item_data( $menu_item, $data, 'edit', $response->get_links() );
	}

	/**
	 * @param array $args Override params.
	 *
	 * @return mixed
	 */
	protected function set_menu_item_data( $args = array() ) {
		$defaults = array(
			'object_id'   => 0,
			'parent'      => 0,
			'menu_order'  => 0,
			'menus'       => $this->menu_id,
			'type'        => 'custom',
			'title'       => 'Custom Link Title',
			'url'         => '#',
			'description' => '',
			'attr-title'  => '',
			'target'      => '',
			'type_label'  => 'Custom Link',
			'classes'     => '',
			'xfn'         => '',
			'status'      => 'draft',
		);

		return wp_parse_args( $args, $defaults );
	}
}
