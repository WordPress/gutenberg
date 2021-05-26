<?php
/**
 * REST API: REST_Widgets_Controller_Test class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Tests for REST API for Widgets.
 *
 * @see WP_Test_REST_Controller_Testcase
 */
class REST_Widgets_Controller_Test extends WP_Test_REST_Controller_Testcase {
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

	public function setUp() {
		global $wp_registered_widgets, $wp_registered_sidebars, $_wp_sidebars_widgets, $wp_widget_factory;

		parent::setUp();

		wp_set_current_user( self::$admin_id );

		// Unregister all widgets and sidebars.
		$wp_registered_widgets  = array();
		$wp_registered_sidebars = array();
		$_wp_sidebars_widgets   = array();
		update_option( 'sidebars_widgets', array() );

		// Re-register core widgets.
		$wp_widget_factory->_register_widgets();

		// Register a non-multi widget for testing.
		wp_register_widget_control(
			'testwidget',
			'WP test widget',
			function () {
				$settings = get_option( 'widget_testwidget' );

				// check if anything's been sent.
				if ( isset( $_POST['update_testwidget'] ) ) {
					$settings['id']    = $_POST['test_id'];
					$settings['title'] = $_POST['test_title'];

					update_option( 'widget_testwidget', $settings );
				}

				echo 'WP test widget form';
			},
			100,
			200
		);
		wp_register_sidebar_widget(
			'testwidget',
			'WP test widget',
			function () {
				$settings = wp_parse_args(
					get_option( 'widget_testwidget' ),
					array(
						'id'    => 'Default id',
						'title' => 'Default text',
					)
				);
				echo '<h1>' . $settings['id'] . '</h1><span>' . $settings['title'] . '</span>';
			},
			array(
				'description' => 'A non-multi widget for testing.',
			)
		);
	}

	private function setup_widget( $id_base, $number, $settings ) {
		$option_name = "widget_$id_base";
		update_option(
			$option_name,
			array(
				$number => $settings,
			)
		);

		$widget_object = gutenberg_get_widget_object( $id_base );
		$widget_object->_set( $number );
		$widget_object->_register_one( $number );
	}

	private function setup_sidebar( $id, $attrs = array(), $widgets = array() ) {
		global $wp_registered_sidebars;
		update_option(
			'sidebars_widgets',
			array_merge(
				(array) get_option( 'sidebars_widgets', array() ),
				array(
					$id => $widgets,
				)
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
	}

	/**
	 * @ticket 51460
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/widgets', $routes );
		$this->assertArrayHasKey( '/wp/v2/widgets/(?P<id>[\w\-]+)', $routes );
	}

	/**
	 * @ticket 51460
	 */
	public function test_context_param() {
	}

	/**
	 * @ticket 51460
	 */
	public function test_get_items_no_widgets() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/widgets' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( array(), $data );
	}

	/**
	 * @ticket 51460
	 */
	public function test_get_items_no_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/widgets' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_manage_widgets', $response, 401 );
	}

	/**
	 * @ticket 51460
	 */
	public function test_get_items_wrong_permission_author() {
		wp_set_current_user( self::$author_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/widgets' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_manage_widgets', $response, 403 );
	}

	/**
	 * @ticket 51460
	 */
	public function test_get_items() {
		global $wp_widget_factory;

		$this->markTestSkipped(
			'The test is failing with latest WordPress core.'
		);

		$wp_widget_factory->widgets['WP_Widget_RSS']->show_instance_in_rest = false;

		$block_content = '<!-- wp:paragraph --><p>Block test</p><!-- /wp:paragraph -->';

		$this->setup_widget(
			'rss',
			1,
			array(
				'title' => 'RSS test',
			)
		);
		$this->setup_widget(
			'block',
			1,
			array(
				'content' => $block_content,
			)
		);
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			),
			array( 'block-1', 'rss-1', 'testwidget' )
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/widgets' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$data     = $this->remove_links( $data );
		$this->assertEqualSets(
			array(
				array(
					'id'       => 'block-1',
					'sidebar'  => 'sidebar-1',
					'instance' => array(
						'encoded' => base64_encode(
							serialize(
								array(
									'content' => $block_content,
								)
							)
						),
						'hash'    => wp_hash(
							serialize(
								array(
									'content' => $block_content,
								)
							)
						),
						'raw'     => array(
							'content' => $block_content,
						),
					),
					'id_base'  => 'block',
					'rendered' => '<p>Block test</p>',
				),
				array(
					'id'       => 'rss-1',
					'sidebar'  => 'sidebar-1',
					'instance' => array(
						'encoded' => base64_encode(
							serialize(
								array(
									'title' => 'RSS test',
								)
							)
						),
						'hash'    => wp_hash(
							serialize(
								array(
									'title' => 'RSS test',
								)
							)
						),
					),
					'id_base'  => 'rss',
					'rendered' => '',
				),
				array(
					'id'       => 'testwidget',
					'sidebar'  => 'sidebar-1',
					'instance' => null,
					'id_base'  => 'testwidget',
					'rendered' => '<h1>Default id</h1><span>Default text</span>',
				),
			),
			$data
		);

		$wp_widget_factory->widgets['WP_Widget_RSS']->show_instance_in_rest = true;
	}

	/**
	 * Test a GET request in edit context. In particular, we expect rendered_form to be served correctly.
	 */
	public function test_get_items_edit_context() {
		$this->setup_widget(
			'text',
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
			array( 'text-1', 'testwidget' )
		);

		$request            = new WP_REST_Request( 'GET', '/wp/v2/widgets' );
		$request['context'] = 'edit';
		$response           = rest_get_server()->dispatch( $request );
		$data               = $response->get_data();
		$data               = $this->remove_links( $data );
		$this->assertEqualSets(
			array(
				array(
					'id'            => 'text-1',
					'sidebar'       => 'sidebar-1',
					'instance'      => array(
						'encoded' => base64_encode(
							serialize(
								array(
									'text' => 'Custom text test',
								)
							)
						),
						'hash'    => wp_hash(
							serialize(
								array(
									'text' => 'Custom text test',
								)
							)
						),
						'raw'     => array(
							'text' => 'Custom text test',
						),
					),
					'id_base'       => 'text',
					'rendered'      => '<div class="textwidget">Custom text test</div>',
					'rendered_form' => '<input id="widget-text-1-title" name="widget-text[1][title]" class="title sync-input" type="hidden" value="">' . "\n" .
									'			<textarea id="widget-text-1-text" name="widget-text[1][text]" class="text sync-input" hidden>Custom text test</textarea>' . "\n" .
									'			<input id="widget-text-1-filter" name="widget-text[1][filter]" class="filter sync-input" type="hidden" value="on">' . "\n" .
									'			<input id="widget-text-1-visual" name="widget-text[1][visual]" class="visual sync-input" type="hidden" value="on">',
				),
				array(
					'id'            => 'testwidget',
					'sidebar'       => 'sidebar-1',
					'instance'      => null,
					'id_base'       => 'testwidget',
					'rendered'      => '<h1>Default id</h1><span>Default text</span>',
					'rendered_form' => 'WP test widget form',
				),
			),
			$data
		);
	}

	/**
	 * @ticket 51460
	 */
	public function test_get_item() {
		$this->setup_widget(
			'text',
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

		$request  = new WP_REST_Request( 'GET', '/wp/v2/widgets/text-1' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEqualSets(
			array(
				'id'       => 'text-1',
				'sidebar'  => 'sidebar-1',
				'instance' => array(
					'encoded' => base64_encode(
						serialize(
							array(
								'text' => 'Custom text test',
							)
						)
					),
					'hash'    => wp_hash(
						serialize(
							array(
								'text' => 'Custom text test',
							)
						)
					),
					'raw'     => array(
						'text' => 'Custom text test',
					),
				),
				'id_base'  => 'text',
				'rendered' => '<div class="textwidget">Custom text test</div>',
			),
			$data
		);
	}

	/**
	 * @ticket 51460
	 */
	public function test_get_item_no_permission() {
		wp_set_current_user( 0 );

		$this->setup_widget(
			'text',
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

		$request  = new WP_REST_Request( 'GET', '/wp/v2/widgets/text-1' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_manage_widgets', $response, 401 );
	}

	/**
	 * @ticket 51460
	 */
	public function test_get_item_wrong_permission_author() {
		wp_set_current_user( self::$author_id );
		$this->setup_widget(
			'text',
			1,
			array(
				'text' => 'Custom text test',
			)
		);
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			)
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/widgets/text-1' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_manage_widgets', $response, 403 );
	}

	/**
	 * @ticket 51460
	 */
	public function test_create_item() {
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/widgets' );
		$request->set_body_params(
			array(
				'sidebar'  => 'sidebar-1',
				'instance' => array(
					'encoded' => base64_encode(
						serialize(
							array(
								'text' => 'Updated text test',
							)
						)
					),
					'hash'    => wp_hash(
						serialize(
							array(
								'text' => 'Updated text test',
							)
						)
					),
				),
				'id_base'  => 'text',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'text-2', $data['id'] );
		$this->assertEquals( 'sidebar-1', $data['sidebar'] );
		$this->assertEqualSets(
			array(
				'text'   => 'Updated text test',
				'title'  => '',
				'filter' => false,
			),
			get_option( 'widget_text' )[2]
		);
	}

	/**
	 * @ticket 51460
	 */
	public function test_create_item_malformed_instance() {
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/widgets' );
		$request->set_body_params(
			array(
				'sidebar'  => 'sidebar-1',
				'instance' => array(
					'encoded' => base64_encode(
						serialize(
							array(
								'text' => 'Updated text test',
							)
						)
					),
					'hash'    => 'badhash',
				),
				'id_base'  => 'text',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_widget', $response, 400 );
	}

	/**
	 * @ticket 51460
	 */
	public function test_create_item_bad_instance() {
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/widgets' );
		$request->set_body_params(
			array(
				'sidebar'  => 'sidebar-1',
				'instance' => array(),
				'id_base'  => 'text',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_widget', $response, 400 );
	}

	/**
	 * @ticket 51460
	 */
	public function test_create_item_using_raw_instance() {
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/widgets' );
		$request->set_body_params(
			array(
				'sidebar'  => 'sidebar-1',
				'instance' => array(
					'raw' => array(
						'content' => '<!-- wp:paragraph --><p>Block test</p><!-- /wp:paragraph -->',
					),
				),
				'id_base'  => 'block',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'block-2', $data['id'] );
		$this->assertEquals( 'sidebar-1', $data['sidebar'] );
		$this->assertEqualSets(
			array(
				'content' => '<!-- wp:paragraph --><p>Block test</p><!-- /wp:paragraph -->',
			),
			get_option( 'widget_block' )[2]
		);
	}

	/**
	 * @ticket 51460
	 */
	public function test_create_item_raw_instance_not_supported() {
		global $wp_widget_factory;

		$this->markTestSkipped(
			'The test is failing with latest WordPress core.'
		);

		$wp_widget_factory->widgets['WP_Widget_Text']->show_instance_in_rest = false;

		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/widgets' );
		$request->set_body_params(
			array(
				'sidebar'  => 'sidebar-1',
				'instance' => array(
					'raw' => array(
						'title' => 'Updated text test',
					),
				),
				'id_base'  => 'text',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_widget', $response, 400 );

		$wp_widget_factory->widgets['WP_Widget_Text']->show_instance_in_rest = true;
	}

	/**
	 * @ticket 51460
	 */
	public function test_create_item_using_form_data() {
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/widgets' );
		$request->set_body_params(
			array(
				'sidebar'   => 'sidebar-1',
				'form_data' => 'widget-text[2][text]=Updated+text+test',
				'id_base'   => 'text',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'text-2', $data['id'] );
		$this->assertEquals( 'sidebar-1', $data['sidebar'] );
		$this->assertEqualSets(
			array(
				'text'   => 'Updated text test',
				'title'  => '',
				'filter' => false,
			),
			$data['instance']['raw']
		);
	}

	/**
	 * @ticket 51460
	 */
	public function test_create_item_multiple_in_a_row() {
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/widgets' );
		$request->set_body_params(
			array(
				'sidebar'  => 'sidebar-1',
				'instance' => array(
					'raw' => array( 'text' => 'Text 1' ),
				),
				'id_base'  => 'text',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'text-2', $data['id'] );
		$this->assertEquals( 'sidebar-1', $data['sidebar'] );
		$this->assertEqualSets(
			array(
				'text'   => 'Text 1',
				'title'  => '',
				'filter' => false,
			),
			$data['instance']['raw']
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/widgets' );
		$request->set_body_params(
			array(
				'sidebar'  => 'sidebar-1',
				'instance' => array(
					'raw' => array( 'text' => 'Text 2' ),
				),
				'id_base'  => 'text',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'text-3', $data['id'] );
		$this->assertEquals( 'sidebar-1', $data['sidebar'] );
		$this->assertEqualSets(
			array(
				'text'   => 'Text 2',
				'title'  => '',
				'filter' => false,
			),
			$data['instance']['raw']
		);

		$sidebar = rest_do_request( '/wp/v2/sidebars/sidebar-1' );
		$this->assertContains( 'text-2', $sidebar->get_data()['widgets'] );
		$this->assertContains( 'text-3', $sidebar->get_data()['widgets'] );
	}

	/**
	 * @ticket 51460
	 */
	public function test_create_item_second_instance() {
		$this->setup_widget(
			'text',
			1,
			array(
				'text' => 'Custom text test',
			)
		);
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/widgets' );
		$request->set_body_params(
			array(
				'sidebar'  => 'sidebar-1',
				'instance' => array(
					'raw' => array(
						'text' => 'Updated text test',
					),
				),
				'id_base'  => 'text',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'text-2', $data['id'] );
		$this->assertEquals( 'sidebar-1', $data['sidebar'] );
		$this->assertEqualSets(
			array(
				'text'   => 'Updated text test',
				'title'  => '',
				'filter' => false,
			),
			$data['instance']['raw']
		);
	}

	/**
	 * @ticket 51460
	 */
	public function test_update_item() {
		$this->setup_widget(
			'text',
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

		$request = new WP_REST_Request( 'PUT', '/wp/v2/widgets/text-1' );
		$request->set_body_params(
			array(
				'id'       => 'text-1',
				'sidebar'  => 'sidebar-1',
				'instance' => array(
					'raw' => array(
						'text' => 'Updated text test',
					),
				),
				'id_base'  => 'text',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'text-1', $data['id'] );
		$this->assertEquals( 'sidebar-1', $data['sidebar'] );
		$this->assertEqualSets(
			array(
				'text'   => 'Updated text test',
				'title'  => '',
				'filter' => false,
			),
			$data['instance']['raw']
		);
	}

	/**
	 * @ticket 51460
	 */
	public function test_update_item_reassign_sidebar() {
		$this->setup_widget(
			'text',
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
		$this->setup_sidebar(
			'sidebar-2',
			array(
				'name' => 'Test sidebar',
			),
			array()
		);

		$request = new WP_REST_Request( 'PUT', '/wp/v2/widgets/text-1' );
		$request->set_body_params(
			array(
				'sidebar' => 'sidebar-2',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$error    = $response->as_error();
		$this->assertNotWPError( $error, $error ? $error->get_error_message() : '' );
		$this->assertEquals( 'sidebar-2', $response->get_data()['sidebar'] );

		$sidebar1 = rest_do_request( '/wp/v2/sidebars/sidebar-1' );
		$this->assertNotContains( 'text-1', $sidebar1->get_data()['widgets'] );

		$sidebar2 = rest_do_request( '/wp/v2/sidebars/sidebar-2' );
		$this->assertContains( 'text-1', $sidebar2->get_data()['widgets'] );
	}

	/**
	 * @ticket 51460
	 */
	public function test_update_item_shouldnt_require_id_base() {
		$this->setup_widget(
			'text',
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

		$request = new WP_REST_Request( 'PUT', '/wp/v2/widgets/text-1' );
		$request->set_body_params(
			array(
				'id'       => 'text-1',
				'instance' => array(
					'raw' => array(
						'text' => 'Updated text test',
					),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'text-1', $data['id'] );
		$this->assertEquals( 'sidebar-1', $data['sidebar'] );
		$this->assertEqualSets(
			array(
				'text'   => 'Updated text test',
				'title'  => '',
				'filter' => false,
			),
			$data['instance']['raw']
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
			'text',
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

		$request = new WP_REST_Request( 'PUT', '/wp/v2/widgets/text-1' );
		$request->set_body_params(
			array(
				'id'       => 'text-1',
				'instance' => array(
					'raw' => array(
						'text' => $html,
					),
				),
				'id_base'  => 'text',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		return $data['rendered'];
	}

	/**
	 * @ticket 51460
	 */
	public function test_update_item_legacy_widget() {
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			),
			array( 'testwidget' )
		);

		$request = new WP_REST_Request( 'PUT', '/wp/v2/widgets/testwidget' );
		$request->set_body_params(
			array(
				'id'        => 'testwidget',
				'name'      => 'WP test widget',
				'form_data' => 'test_id=My+test+id&test_title=My+test+title&update_testwidget=true',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$data     = $this->remove_links( $data );
		$this->assertEquals(
			array(
				'id'            => 'testwidget',
				'sidebar'       => 'sidebar-1',
				'instance'      => null,
				'rendered'      => '<h1>My test id</h1><span>My test title</span>',
				'rendered_form' => 'WP test widget form',
				'id_base'       => 'testwidget',
			),
			$data
		);
	}

	/**
	 * @ticket 51460
	 */
	public function test_create_item_legacy_widget() {
		$this->setup_sidebar(
			'sidebar-1',
			array(
				'name' => 'Test sidebar',
			),
			array()
		);

		$request = new WP_REST_Request( 'PUT', '/wp/v2/widgets/testwidget' );
		$request->set_body_params(
			array(
				'id'        => 'testwidget',
				'sidebar'   => 'sidebar-1',
				'name'      => 'WP test widget',
				'form_data' => 'test_id=My+test+id&test_title=My+test+title&update_testwidget=true',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$data     = $this->remove_links( $data );
		$this->assertEquals(
			array(
				'id'            => 'testwidget',
				'sidebar'       => 'sidebar-1',
				'instance'      => null,
				'rendered'      => '<h1>My test id</h1><span>My test title</span>',
				'rendered_form' => 'WP test widget form',
				'id_base'       => 'testwidget',
			),
			$data
		);
	}

	/**
	 * @ticket 51460
	 */
	public function test_update_item_no_permission() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/sidebars/sidebar-1' );
		$request->set_body_params(
			array(
				'widgets' => array(),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_manage_widgets', $response, 401 );
	}

	/**
	 * @ticket 51460
	 */
	public function test_update_item_wrong_permission_author() {
		wp_set_current_user( self::$author_id );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/sidebars/sidebar-1' );
		$request->set_body_params(
			array(
				'widgets' => array(),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_manage_widgets', $response, 403 );
	}

	/**
	 * Tests if the endpoint correctly handles "slashable" characters such as " or '.
	 */
	public function test_update_item_slashing() {
		$this->setup_widget( 'text', 1, array( 'text' => 'Custom text test' ) );
		$this->setup_sidebar( 'sidebar-1', array( 'name' => 'Test sidebar' ), array( 'text-1', 'rss-1' ) );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/widgets/text-1' );
		$request->set_body_params(
			array(
				'id'       => 'text-1',
				'sidebar'  => 'sidebar-1',
				'instance' => array(
					'raw' => array(
						'text' => 'Updated \\" \\\' text test',
					),
				),
				'id_base'  => 'text',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEqualSets(
			array(
				'text'   => 'Updated \\" \\\' text test',
				'title'  => '',
				'filter' => false,
			),
			$data['instance']['raw']
		);

		$this->assertEquals(
			'<div class="textwidget">Updated \\" \\\' text test</div>',
			$data['rendered']
		);
	}

	/**
	 * @ticket 51460
	 */
	public function test_delete_item() {
		$this->setup_widget(
			'text',
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

		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/widgets/text-1' );
		$response = rest_do_request( $request );

		$this->assertEqualSets(
			array(
				'id'            => 'text-1',
				'sidebar'       => 'wp_inactive_widgets',
				'instance'      => array(
					'encoded' => base64_encode(
						serialize(
							array(
								'text' => 'Custom text test',
							)
						)
					),
					'hash'    => wp_hash(
						serialize(
							array(
								'text' => 'Custom text test',
							)
						)
					),
					'raw'     => array(
						'text' => 'Custom text test',
					),
				),
				'id_base'       => 'text',
				'rendered'      => '',
				'rendered_form' => '<input id="widget-text-1-title" name="widget-text[1][title]" class="title sync-input" type="hidden" value="">' . "\n" .
								'			<textarea id="widget-text-1-text" name="widget-text[1][text]" class="text sync-input" hidden>Custom text test</textarea>' . "\n" .
								'			<input id="widget-text-1-filter" name="widget-text[1][filter]" class="filter sync-input" type="hidden" value="on">' . "\n" .
								'			<input id="widget-text-1-visual" name="widget-text[1][visual]" class="visual sync-input" type="hidden" value="on">',
			),
			$response->get_data()
		);
	}

	/**
	 * @ticket 51460
	 */
	public function test_delete_item_force() {
		$this->setup_widget(
			'text',
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

		$request = new WP_REST_Request( 'DELETE', '/wp/v2/widgets/text-1' );
		$request->set_query_params( array( 'force' => true ) );
		$response = rest_do_request( $request );

		$this->assertEqualSets(
			array(
				'deleted'  => true,
				'previous' => array(

					'id'            => 'text-1',
					'sidebar'       => 'sidebar-1',
					'instance'      => array(
						'encoded' => base64_encode(
							serialize(
								array(
									'text' => 'Custom text test',
								)
							)
						),
						'hash'    => wp_hash(
							serialize(
								array(
									'text' => 'Custom text test',
								)
							)
						),
						'raw'     => array(
							'text' => 'Custom text test',
						),
					),
					'id_base'       => 'text',
					'rendered'      => '<div class="textwidget">Custom text test</div>',
					'rendered_form' => '<input id="widget-text-1-title" name="widget-text[1][title]" class="title sync-input" type="hidden" value="">' . "\n" .
									'			<textarea id="widget-text-1-text" name="widget-text[1][text]" class="text sync-input" hidden>Custom text test</textarea>' . "\n" .
									'			<input id="widget-text-1-filter" name="widget-text[1][filter]" class="filter sync-input" type="hidden" value="on">' . "\n" .
									'			<input id="widget-text-1-visual" name="widget-text[1][visual]" class="visual sync-input" type="hidden" value="on">',

				),
			),
			$response->get_data()
		);

		$response = rest_do_request( '/wp/v2/widgets/text-1' );
		$this->assertEquals( 404, $response->get_status() );
	}

	/**
	 * @ticket 51460
	 */
	public function test_delete_item_logged_out() {
		wp_set_current_user( 0 );

		$this->setup_widget(
			'text',
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

		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/widgets/text-1' );
		$response = rest_do_request( $request );

		$this->assertErrorResponse( 'rest_cannot_manage_widgets', $response, 401 );
	}

	/**
	 * @ticket 51460
	 */
	public function test_delete_item_author() {
		wp_set_current_user( self::$author_id );

		$this->setup_widget(
			'text',
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

		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/widgets/text-1' );
		$response = rest_do_request( $request );

		$this->assertErrorResponse( 'rest_cannot_manage_widgets', $response, 403 );
	}

	/**
	 * The test_prepare_item() method does not exist for sidebar.
	 */
	public function test_prepare_item() {
	}

	/**
	 * @ticket 51460
	 */
	public function test_get_item_schema() {
		wp_set_current_user( self::$admin_id );
		$request    = new WP_REST_Request( 'OPTIONS', '/wp/v2/widgets' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];

		$this->assertEquals( 7, count( $properties ) );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'id_base', $properties );
		$this->assertArrayHasKey( 'sidebar', $properties );
		$this->assertArrayHasKey( 'rendered', $properties );
		$this->assertArrayHasKey( 'rendered_form', $properties );
		$this->assertArrayHasKey( 'instance', $properties );
		$this->assertArrayHasKey( 'form_data', $properties );
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
			if ( is_array( $item ) && isset( $item['_links'] ) ) {
				unset( $data[ $count ]['_links'] );
			}
			$count ++;
		}

		return $data;
	}
}
