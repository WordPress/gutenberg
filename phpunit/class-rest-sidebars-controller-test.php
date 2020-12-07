<?php
/**
 * REST API: REST_Sidebars_Controller_Test class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Tests for REST API for Menus.
 *
 * @see WP_Test_REST_Controller_Testcase
 */
class REST_Sidebars_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * @var int
	 */
	public $menu_id;

	/**
	 * @var int
	 */
	protected static $superadmin_id;

	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * @var int
	 */
	protected static $admin_id_without_unfiltered_html;

	/**
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * @var int
	 */
	protected static $subscriber_id;

	/**
	 * @var int
	 */
	protected static $author_id;

	/**
	 * @var int
	 */
	protected static $per_page = 50;

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$superadmin_id = $factory->user->create(
			array(
				'role'       => 'administrator',
				'user_login' => 'superadmin',
			)
		);
		if ( is_multisite() ) {
			update_site_option( 'site_admins', array( 'superadmin' ) );
		}
		self::$admin_id      = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$editor_id     = $factory->user->create(
			array(
				'role' => 'editor',
			)
		);
		self::$author_id     = $factory->user->create(
			array(
				'role' => 'author',
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
	public function setUp() {
		parent::setUp();

		wp_set_current_user( self::$admin_id );

		// Unregister all widgets and sidebars.
		global $wp_registered_sidebars, $_wp_sidebars_widgets;
		$wp_registered_sidebars = array();
		$_wp_sidebars_widgets   = array();
		update_option( 'sidebars_widgets', array() );
	}

	private function setup_widget( $option_name, $number, $settings ) {
		update_option(
			$option_name,
			array(
				$number => $settings,
			)
		);
	}

	private function setup_sidebar( $id, $attrs = array(), $widgets = array() ) {
		global $wp_registered_sidebars;
		update_option(
			'sidebars_widgets',
			array(
				$id => $widgets,
			)
		);
		$wp_registered_sidebars[ $id ] = array_merge(
			array(
				'id'            => $id,
				'before_widget' => '',
				'after_widget'  => '',
				'before_title'  => '',
				'after_title'   => '',
			),
			$attrs
		);

		global $wp_registered_widgets;
		foreach ( $wp_registered_widgets as $wp_registered_widget ) {
			if ( is_array( $wp_registered_widget['callback'] ) ) {
				$wp_registered_widget['callback'][0]->_register();
			}
		}
	}

	/**
	 *
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/sidebars', $routes );
		$this->assertArrayHasKey( '/wp/v2/sidebars/(?P<id>[\w-]+)', $routes );
	}

	/**
	 *
	 */
	public function test_context_param() {
	}

	/**
	 *
	 */
	public function test_get_items() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/sidebars' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( array(), $data );
	}

	/**
	 *
	 */
	public function test_get_items_no_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/sidebars' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 401 );
	}

	/**
	 *
	 */
	public function test_get_items_wrong_permission_author() {
		wp_set_current_user( self::$author_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/sidebars' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 403 );
	}

	/**
	 *
	 */
	public function test_get_items_wrong_permission_subscriber() {
		wp_set_current_user( self::$subscriber_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/sidebars' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 403 );
	}

	/**
	 *
	 */
	public function test_get_items_basic_sidebar() {
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			)
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/sidebars' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$data     = $this->remove_links( $data );
		$this->assertEquals(
			array(
				array(
					'id'            => 'sidebar-1',
					'name'          => 'Test sidebar',
					'description'   => '',
					'status'        => 'active',
					'widgets'       => array(),
					'class'         => '',
					'before_widget' => '',
					'after_widget'  => '',
					'before_title'  => '',
					'after_title'   => '',
				),
			),
			$data
		);
	}

	/**
	 *
	 */
	public function test_get_items_active_sidebar_with_widgets() {
		$this->setup_widget(
			'widget_rss',
			1,
			array(
				'title' => 'RSS test',
			)
		);
		$this->setup_widget(
			'widget_text',
			1,
			array(
				'text' => 'Custom text test',
			)
		);
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			),
			array( 'text-1', 'rss-1' )
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/sidebars' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$data     = $this->remove_links( $data );
		$this->assertEquals(
			array(
				array(
					'id'            => 'sidebar-1',
					'name'          => 'Test sidebar',
					'description'   => '',
					'status'        => 'active',
					'widgets'       => array(
						'text-1',
						'rss-1',
					),
					'class'         => '',
					'before_widget' => '',
					'after_widget'  => '',
					'before_title'  => '',
					'after_title'   => '',
				),
			),
			$data
		);
	}

	/**
	 *
	 */
	public function test_get_item() {
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			)
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/sidebars/sidebar-1' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$data     = $this->remove_links( $data );
		$this->assertEquals(
			array(
				'id'            => 'sidebar-1',
				'name'          => 'Test sidebar',
				'description'   => '',
				'status'        => 'active',
				'widgets'       => array(),
				'class'         => '',
				'before_widget' => '',
				'after_widget'  => '',
				'before_title'  => '',
				'after_title'   => '',
			),
			$data
		);
	}

	/**
	 *
	 */
	public function test_get_item_no_permission() {
		wp_set_current_user( 0 );
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			)
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/sidebars/sidebar-1' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 401 );
	}

	/**
	 *
	 */
	public function test_get_item_wrong_permission_author() {
		wp_set_current_user( self::$author_id );
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			)
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/sidebars/sidebar-1' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 403 );
	}

	/**
	 *
	 */
	public function test_get_item_wrong_permission_subscriber() {
		wp_set_current_user( self::$subscriber_id );
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			)
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/sidebars/sidebar-1' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 403 );
	}

	/**
	 * The test_create_item() method does not exist for sidebar.
	 */
	public function test_create_item() {
	}

	/**
	 *
	 */
	public function test_update_item() {
		$this->setup_widget(
			'widget_rss',
			1,
			array(
				'title' => 'RSS test',
			)
		);
		$this->setup_widget(
			'widget_text',
			1,
			array(
				'text' => 'Custom text test',
			)
		);
		$this->setup_widget(
			'widget_text',
			2,
			array(
				'text' => 'Custom text test',
			)
		);
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			),
			array( 'text-1', 'rss-1' )
		);

		$request = new WP_REST_Request( 'PUT', '/wp/v2/sidebars/sidebar-1' );
		$request->set_body_params(
			array(
				'widgets' => array(
					'text-1',
					'text-2',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$data     = $this->remove_links( $data );
		$this->assertEquals(
			array(
				'id'            => 'sidebar-1',
				'name'          => 'Test sidebar',
				'description'   => '',
				'status'        => 'active',
				'widgets'       => array(
					'text-1',
					'text-2',
				),
				'class'         => '',
				'before_widget' => '',
				'after_widget'  => '',
				'before_title'  => '',
				'after_title'   => '',
			),
			$data
		);
	}

	/**
	 *
	 */
	public function test_update_item_removes_widget_from_existing_sidebar() {
		$this->setup_widget(
			'widget_text',
			1,
			array(
				'text' => 'Custom text test',
			)
		);
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			),
			array( 'text-1' )
		);
		$this->setup_sidebar(
			'sidebar-2',
			array(
				'name' => 'Test sidebar 2',
			),
			array()
		);

		$request = new WP_REST_Request( 'PUT', '/wp/v2/sidebars/sidebar-2' );
		$request->set_body_params(
			array(
				'widgets' => array(
					'text-1',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertContains( 'text-1', $data['widgets'] );

		$this->assertNotContains( 'text-1', rest_do_request( '/wp/v2/sidebars/sidebar-1' )->get_data()['widgets'] );
	}

	/**
	 *
	 */
	public function test_update_item_moves_omitted_widget_to_inactive_sidebar() {
		$this->setup_widget(
			'widget_text',
			1,
			array(
				'text' => 'Custom text test',
			)
		);
		$this->setup_widget(
			'widget_text',
			2,
			array(
				'text' => 'Custom text test',
			)
		);
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			),
			array( 'text-1' )
		);

		$request = new WP_REST_Request( 'PUT', '/wp/v2/sidebars/sidebar-1' );
		$request->set_body_params(
			array(
				'widgets' => array(
					'text-2',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertContains( 'text-2', $data['widgets'] );
		$this->assertNotContains( 'text-1', $data['widgets'] );

		$this->assertContains( 'text-1', rest_do_request( '/wp/v2/sidebars/wp_inactive_widgets' )->get_data()['widgets'] );
	}

	/**
	 *
	 */
	public function test_get_items_inactive_widgets() {
		$this->setup_widget(
			'widget_rss',
			1,
			array(
				'title' => 'RSS test',
			)
		);
		$this->setup_widget(
			'widget_text',
			1,
			array(
				'text' => 'Custom text test',
			)
		);
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			),
			array( 'text-1' )
		);
		update_option(
			'sidebars_widgets',
			array_merge(
				get_option( 'sidebars_widgets' ),
				array(
					'wp_inactive_widgets' => array( 'rss-1', 'rss' ),
				)
			)
		);

		$request = new WP_REST_Request( 'GET', '/wp/v2/sidebars' );
		$request->set_param( 'context', 'view' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$data     = $this->remove_links( $data );
		$this->assertEquals(
			array(
				array(
					'id'            => 'sidebar-1',
					'name'          => 'Test sidebar',
					'description'   => '',
					'status'        => 'active',
					'widgets'       => array(
						'text-1',
					),
					'class'         => '',
					'before_widget' => '',
					'after_widget'  => '',
					'before_title'  => '',
					'after_title'   => '',
				),
				array(
					'id'            => 'wp_inactive_widgets',
					'name'          => 'Inactive widgets',
					'description'   => '',
					'status'        => 'inactive',
					'widgets'       => array(
						'rss-1',
					),
					'class'         => '',
					'before_widget' => '',
					'after_widget'  => '',
					'before_title'  => '',
					'after_title'   => '',
				),
			),
			$data
		);
	}

	/**
	 *
	 */
	public function test_update_item_no_permission() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'POST', '/wp/v2/sidebars/sidebar-1' );
		$request->set_body_params(
			array(
				'widgets' => array(),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 401 );
	}

	/**
	 *
	 */
	public function test_update_item_wrong_permission_author() {
		wp_set_current_user( self::$author_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/sidebars/sidebar-1' );
		$request->set_body_params(
			array(
				'widgets' => array(),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 403 );
	}

	/**
	 *
	 */
	public function test_update_item_wrong_permission_subscriber() {
		wp_set_current_user( self::$subscriber_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/sidebars/sidebar-1' );
		$request->set_body_params(
			array(
				'widgets' => array(),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 403 );
	}

	/**
	 * The test_delete_item() method does not exist for sidebar.
	 */
	public function test_delete_item() {
	}

	/**
	 * The test_prepare_item() method does not exist for sidebar.
	 */
	public function test_prepare_item() {
	}

	/**
	 *
	 */
	public function test_get_item_schema() {
		wp_set_current_user( self::$admin_id );
		$request    = new WP_REST_Request( 'OPTIONS', '/wp/v2/sidebars' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];

		$this->assertEquals( 10, count( $properties ) );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'status', $properties );
		$this->assertArrayHasKey( 'widgets', $properties );
		$this->assertArrayHasKey( 'class', $properties );
		$this->assertArrayHasKey( 'before_widget', $properties );
		$this->assertArrayHasKey( 'after_widget', $properties );
		$this->assertArrayHasKey( 'before_title', $properties );
		$this->assertArrayHasKey( 'after_title', $properties );
	}

	/**
	 * Helper to remove links key.
	 *
	 * @param array $data Array of data.
	 *
	 * @return array
	 */
	protected function remove_links( $data ) {
		if ( ! is_array( $data ) ) {
			return $data;
		}
		$count = 0;
		foreach ( $data as $item ) {
			if ( isset( $item['_links'] ) ) {
				unset( $data[ $count ]['_links'] );
			}
			$count ++;
		}

		return $data;
	}
}
