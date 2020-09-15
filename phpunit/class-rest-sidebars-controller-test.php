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
		$this->assertArrayHasKey( '/__experimental/sidebars', $routes );
		$this->assertArrayHasKey( '/__experimental/sidebars/(?P<id>[\w-]+)', $routes );
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
		$request  = new WP_REST_Request( 'GET', '/__experimental/sidebars' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( array(), $data );
	}

	/**
	 *
	 */
	public function test_get_items_no_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/__experimental/sidebars' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 401 );
	}

	/**
	 *
	 */
	public function test_get_items_wrong_permission_author() {
		wp_set_current_user( self::$author_id );
		$request  = new WP_REST_Request( 'GET', '/__experimental/sidebars' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 403 );
	}

	/**
	 *
	 */
	public function test_get_items_wrong_permission_subscriber() {
		wp_set_current_user( self::$subscriber_id );
		$request  = new WP_REST_Request( 'GET', '/__experimental/sidebars' );
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

		$request  = new WP_REST_Request( 'GET', '/__experimental/sidebars' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals(
			array(
				array(
					'id'          => 'sidebar-1',
					'name'        => 'Test sidebar',
					'description' => '',
					'status'      => 'active',
					'widgets'     => array(),
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

		$request  = new WP_REST_Request( 'GET', '/__experimental/sidebars' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals(
			array(
				array(
					'id'          => 'sidebar-1',
					'name'        => 'Test sidebar',
					'description' => '',
					'status'      => 'active',
					'widgets'     => array(
						array(
							'id'           => 'text-1',
							'settings'     => array(
								'text' => 'Custom text test',
							),
							'id_base'      => 'text',
							'widget_class' => 'WP_Widget_Text',
							'name'         => 'Text',
							'description'  => 'Arbitrary text.',
							'number'       => 1,
							'rendered'     => '<div class="textwidget">Custom text test</div>',
						),
						array(
							'id'           => 'rss-1',
							'settings'     => array(
								'title' => 'RSS test',
							),
							'id_base'      => 'rss',
							'widget_class' => 'WP_Widget_RSS',
							'name'         => 'RSS',
							'description'  => 'Entries from any RSS or Atom feed.',
							'number'       => 1,
							'rendered'     => '',
						),
					),
				),
			),
			$data
		);
	}

	/**
	 * Test a GET request in edit context. In particular, we expect rendered_form to be served correctly.
	 */
	public function test_get_items_active_sidebar_with_widgets_edit_context() {
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

		$request            = new WP_REST_Request( 'GET', '/__experimental/sidebars' );
		$request['context'] = 'edit';
		$response           = rest_get_server()->dispatch( $request );
		$data               = $response->get_data();
		$this->assertEquals(
			array(
				array(
					'id'          => 'sidebar-1',
					'name'        => 'Test sidebar',
					'description' => '',
					'status'      => 'active',
					'widgets'     => array(
						array(
							'id'            => 'text-1',
							'settings'      => array(
								'text' => 'Custom text test',
							),
							'id_base'       => 'text',
							'widget_class'  => 'WP_Widget_Text',
							'name'          => 'Text',
							'description'   => 'Arbitrary text.',
							'number'        => 1,
							'rendered'      => '<div class="textwidget">Custom text test</div>',
							'rendered_form' => '<input id="widget-text-1-title" name="widget-text[1][title]" class="title sync-input" type="hidden" value="">' . "\n" .
																							'			<textarea id="widget-text-1-text" name="widget-text[1][text]" class="text sync-input" hidden>Custom text test</textarea>' . "\n" .
																							'			<input id="widget-text-1-filter" name="widget-text[1][filter]" class="filter sync-input" type="hidden" value="on">' . "\n" .
																							'			<input id="widget-text-1-visual" name="widget-text[1][visual]" class="visual sync-input" type="hidden" value="on">',
						),
					),
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

		$request  = new WP_REST_Request( 'GET', '/__experimental/sidebars/sidebar-1' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals(
			array(
				'id'          => 'sidebar-1',
				'name'        => 'Test sidebar',
				'description' => '',
				'status'      => 'active',
				'widgets'     => array(),
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

		$request  = new WP_REST_Request( 'GET', '/__experimental/sidebars/sidebar-1' );
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

		$request  = new WP_REST_Request( 'GET', '/__experimental/sidebars/sidebar-1' );
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

		$request  = new WP_REST_Request( 'GET', '/__experimental/sidebars/sidebar-1' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 403 );
	}

	/**
	 * The test_update_item() method does not exist for sidebar.
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
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			),
			array( 'text-1', 'rss-1' )
		);

		$request = new WP_REST_Request( 'POST', '/__experimental/sidebars/sidebar-1' );
		$request->set_body_params(
			array(
				'widgets' => array(
					array(
						'id'           => 'text-1',
						'settings'     => array(
							'text' => 'Updated text test',
						),
						'id_base'      => 'text',
						'widget_class' => 'WP_Widget_Text',
						'name'         => 'Text',
						'description'  => 'Arbitrary text.',
						'number'       => 1,
					),
					array(
						'id'           => 'text-2',
						'settings'     => array(
							'text' => 'Another text widget',
						),
						'id_base'      => 'text',
						'widget_class' => 'WP_Widget_Text',
						'name'         => 'Text',
						'description'  => 'Arbitrary text.',
						'number'       => 2,
					),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals(
			array(
				'id'          => 'sidebar-1',
				'name'        => 'Test sidebar',
				'description' => '',
				'status'      => 'active',
				'widgets'     => array(
					array(
						'id'           => 'text-1',
						'settings'     => array(
							'text'   => 'Updated text test',
							'title'  => '',
							'filter' => false,
						),
						'id_base'      => 'text',
						'widget_class' => 'WP_Widget_Text',
						'name'         => 'Text',
						'description'  => 'Arbitrary text.',
						'number'       => 1,
						'rendered'     => '<div class="textwidget">Updated text test</div>',
					),
					array(
						'id'           => 'text-2',
						'settings'     => array(
							'text'   => 'Another text widget',
							'title'  => '',
							'filter' => false,
						),
						'id_base'      => 'text',
						'widget_class' => 'WP_Widget_Text',
						'name'         => 'Text',
						'description'  => 'Arbitrary text.',
						'number'       => 2,
						'rendered'     => '<div class="textwidget">Another text widget</div>',
					),
				),
			),
			$data
		);
	}

	/**
	 * @group multisite
	 */
	public function test_store_html_as_admin() {
		if ( is_multisite() ) {
			$this->assertEquals(
				'<div class="textwidget">alert(1)</div>',
				$this->update_text_widget_with_raw_html( '<script>alert(1)</script>' )
			);
		} else {
			$this->assertEquals(
				'<div class="textwidget"><script>alert(1)</script></div>',
				$this->update_text_widget_with_raw_html( '<script>alert(1)</script>' )
			);
		}
	}

	/**
	 * @group multisite
	 */
	public function test_store_html_as_superadmin() {
		wp_set_current_user( self::$superadmin_id );
		if ( is_multisite() ) {
			$this->assertEquals(
				'<div class="textwidget"><script>alert(1)</script></div>',
				$this->update_text_widget_with_raw_html( '<script>alert(1)</script>' )
			);
		} else {
			$this->assertEquals(
				'<div class="textwidget"><script>alert(1)</script></div>',
				$this->update_text_widget_with_raw_html( '<script>alert(1)</script>' )
			);
		}
	}

	protected function update_text_widget_with_raw_html( $html ) {
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

		$request = new WP_REST_Request( 'POST', '/__experimental/sidebars/sidebar-1' );
		$request->set_body_params(
			array(
				'widgets' => array(
					array(
						'id'           => 'text-1',
						'settings'     => array(
							'text' => $html,
						),
						'id_base'      => 'text',
						'widget_class' => 'WP_Widget_Text',
						'name'         => 'Text',
						'description'  => 'Arbitrary text.',
						'number'       => 1,
					),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		return $data['widgets'][0]['rendered'];
	}

	/**
	 *
	 */
	public function test_update_item_legacy_widget_1() {
		$this->do_test_update_item_legacy_widget( 'testwidget-1' );
	}

	/**
	 *
	 */
	public function test_update_item_legacy_widget_2() {
		$this->do_test_update_item_legacy_widget( 'testwidget' );
	}

	/**
	 *
	 */
	public function do_test_update_item_legacy_widget( $widget_id ) {
		// @TODO: Use @dataProvider instead (it doesn't work with custom constructors like the one we have in this class)
		wp_register_widget_control(
			$widget_id,
			'WP test widget',
			function() {
				$settings = get_option( 'widget_testwidget' );

				// check if anything's been sent.
				if ( isset( $_POST['update_testwidget'] ) ) {
					$settings['id']    = $_POST['test_id'];
					$settings['title'] = $_POST['test_title'];

					update_option( 'widget_testwidget', $settings );
				}
			},
			100,
			200
		);
		wp_register_sidebar_widget(
			$widget_id,
			'WP test widget',
			function() {
				$settings = get_option( 'widget_testwidget' ) ? get_option( 'widget_testwidget' ) : array(
					'id'    => '',
					'title' => '',
				);
				echo '<h1>' . $settings['id'] . '</h1><span>' . $settings['title'] . '</span>';
			}
		);
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			),
			array( $widget_id )
		);

		$request = new WP_REST_Request( 'POST', '/__experimental/sidebars/sidebar-1' );
		$request->set_body_params(
			array(
				'widgets' => array(
					array(
						'id'       => $widget_id,
						'name'     => 'WP test widget',
						'settings' => array(
							'test_id'           => 'My test id',
							'test_title'        => 'My test title',
							'update_testwidget' => true,
						),
					),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals(
			array(
				'id'          => 'sidebar-1',
				'name'        => 'Test sidebar',
				'description' => '',
				'status'      => 'active',
				'widgets'     => array(
					array(
						'id'       => $widget_id,
						'settings' => array(),
						'rendered' => '<h1>My test id</h1><span>My test title</span>',
						'name'     => 'WP test widget',
					),
				),
			),
			$data
		);
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

		$request = new WP_REST_Request( 'GET', '/__experimental/sidebars' );
		$request->set_param( 'context', 'view' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals(
			array(
				array(
					'id'          => 'sidebar-1',
					'name'        => 'Test sidebar',
					'description' => '',
					'status'      => 'active',
					'widgets'     => array(
						array(
							'id'           => 'text-1',
							'settings'     => array(
								'text' => 'Custom text test',
							),
							'id_base'      => 'text',
							'widget_class' => 'WP_Widget_Text',
							'name'         => 'Text',
							'description'  => 'Arbitrary text.',
							'number'       => 1,
							'rendered'     => '<div class="textwidget">Custom text test</div>',
						),
					),
				),
				array(
					'id'          => 'wp_inactive_widgets',
					'name'        => 'Inactive widgets',
					'description' => '',
					'status'      => 'inactive',
					'widgets'     => array(
						array(
							'id'           => 'rss-1',
							'settings'     => array(
								'title' => 'RSS test',
							),
							'id_base'      => 'rss',
							'widget_class' => 'WP_Widget_RSS',
							'name'         => 'RSS',
							'description'  => 'Entries from any RSS or Atom feed.',
							'number'       => 1,
							'rendered'     => '',
						),
					),
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

		$request = new WP_REST_Request( 'POST', '/__experimental/sidebars/sidebar-1' );
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

		$request = new WP_REST_Request( 'POST', '/__experimental/sidebars/sidebar-1' );
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

		$request = new WP_REST_Request( 'POST', '/__experimental/sidebars/sidebar-1' );
		$request->set_body_params(
			array(
				'widgets' => array(),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'widgets_cannot_access', $response, 403 );
	}

	/**
	 * Tests if the endpoint correctly handles "slashable" characters such as " or '.
	 */
	public function test_update_item_slashing() {
		$this->setup_widget( 'widget_text', 1, array( 'text' => 'Custom text test' ) );
		$this->setup_sidebar( 'sidebar-1', array( 'name' => 'Test sidebar' ), array( 'text-1', 'rss-1' ) );

		$request = new WP_REST_Request( 'POST', '/__experimental/sidebars/sidebar-1' );
		$request->set_body_params(
			array(
				'widgets' => array(
					array(
						'id'           => 'text-1',
						'settings'     => array(
							'text' => 'Updated \\" \\\' text test',
						),
						'id_base'      => 'text',
						'widget_class' => 'WP_Widget_Text',
						'name'         => 'Text',
						'description'  => 'Arbitrary text.',
						'number'       => 1,
					),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals(
			array(
				'id'          => 'sidebar-1',
				'name'        => 'Test sidebar',
				'description' => '',
				'status'      => 'active',
				'widgets'     => array(
					array(
						'id'           => 'text-1',
						'settings'     => array(
							'text'   => 'Updated \\" \\\' text test',
							'title'  => '',
							'filter' => false,
						),
						'id_base'      => 'text',
						'widget_class' => 'WP_Widget_Text',
						'name'         => 'Text',
						'description'  => 'Arbitrary text.',
						'number'       => 1,
						'rendered'     => '<div class="textwidget">Updated \\" \\\' text test</div>',
					),
				),
			),
			$data
		);
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
		$request    = new WP_REST_Request( 'OPTIONS', '/__experimental/sidebars' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];

		$this->assertEquals( 5, count( $properties ) );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'status', $properties );
		$this->assertArrayHasKey( 'widgets', $properties );
	}
}
