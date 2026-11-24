<?php
/**
 * Unit tests covering Gutenberg_REST_Entity_Actions_Controller_7_2 functionality.
 *
 * @package gutenberg
 *
 * @coversDefaultClass Gutenberg_REST_Entity_Actions_Controller_7_2
 */
class Tests_REST_Entity_Actions_Controller extends WP_Test_REST_TestCase {

	/**
	 * The REST route the controller registers.
	 */
	const ROUTE = '/wp/v2/entity-actions';

	/**
	 * Administrator user id (has `edit_theme_options` and `manage_options`).
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Editor user id (has `edit_posts` and `manage_categories`, lacks `manage_options`).
	 *
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * Subscriber user id (lacks `edit_posts`).
	 *
	 * @var int
	 */
	protected static $subscriber_id;

	/**
	 * Creates shared users.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$editor_id     = $factory->user->create( array( 'role' => 'editor' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	/**
	 * Deletes shared users.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
		self::delete_user( self::$subscriber_id );
	}

	/**
	 * Tears down each test.
	 *
	 * Resetting the registry drops the actions a test registered; the next
	 * read fires `wp_entity_actions_api_init` again. The test case removes the
	 * callbacks the test hooked.
	 */
	public function tear_down() {
		self::reset_registry();

		parent::tear_down();
	}

	/**
	 * Resets the registry: drops the singleton instance and puts an empty
	 * plugin registry in its place, as `init` does, so its first read fires
	 * `wp_entity_actions_api_init` again.
	 */
	private static function reset_registry() {
		$instance = new ReflectionProperty( WP_Entity_Actions_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );
		WP_Entity_Actions_Registry_Gutenberg::get_instance();
	}

	/**
	 * Registers actions on `wp_entity_actions_api_init` for the duration of the test,
	 * with the `test-plugin` origin: the registry is reset on tear down.
	 *
	 * Registering only runs on the action, so the registration is hooked to
	 * it, as a plugin does, and the action fired anew: the registry is reset
	 * and read, which replays the registrations made so far, in order.
	 *
	 * @param string      $kind    The entity kind.
	 * @param string      $name    The entity name.
	 * @param array[]     $actions The action definitions.
	 * @param string|null $module  The script module id, if any.
	 * @return string[] The ids of the actions registered.
	 */
	private function register_actions( $kind, $name, $actions, $module = null ) {
		$registered = array();
		$callback   = static function () use ( &$registered, $kind, $name, $actions, $module ) {
			$registered = wp_register_entity_actions( 'test-plugin', $kind, $name, $actions, $module );
		};
		add_action( 'wp_entity_actions_api_init', $callback );

		self::reset_registry();
		WP_Entity_Actions_Registry::get_instance()->get_all_registered();

		return $registered;
	}

	/**
	 * Dispatches a request to the actions route.
	 *
	 * @param string|null $kind Entity kind.
	 * @param string|null $name Entity name.
	 * @return WP_REST_Response
	 */
	private function dispatch_request( $kind = 'postType', $name = 'page' ) {
		$request = new WP_REST_Request( 'GET', self::ROUTE );
		if ( null !== $kind ) {
			$request->set_param( 'kind', $kind );
		}
		if ( null !== $name ) {
			$request->set_param( 'name', $name );
		}
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * The route is registered once, and served by the 7.2 controller.
	 *
	 * @covers ::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::ROUTE, $routes );
		$this->assertCount( 1, $routes[ self::ROUTE ], 'The route should be registered once.' );
		$this->assertInstanceOf( 'Gutenberg_REST_Entity_Actions_Controller_7_2', $routes[ self::ROUTE ][0]['callback'][0] );
		$this->assertSame( PHP_INT_MAX, has_action( 'rest_api_init', 'gutenberg_register_entity_actions_controller_endpoints' ), 'The route is registered after the routes of core, to override its controller.' );
	}

	/**
	 * A taxonomy whose items are on the route keeps it: the route of the
	 * actions is not registered, and that is reported.
	 *
	 * @covers ::register_routes
	 * @covers ::is_route_of_entity_items
	 */
	public function test_the_route_of_a_taxonomy_with_the_same_base_is_kept() {
		global $wp_rest_server;
		$this->setExpectedIncorrectUsage( 'Gutenberg_REST_Entity_Actions_Controller_7_2::is_route_of_entity_items' );
		if ( class_exists( 'WP_REST_Entity_Actions_Controller' ) ) {
			// The controller of core, registered before this one, reports it too.
			$this->setExpectedIncorrectUsage( 'WP_REST_Entity_Actions_Controller::is_route_of_entity_items' );
		}
		register_taxonomy( 'entity-actions', 'post', array( 'show_in_rest' => true ) );

		try {
			$wp_rest_server = null;
			$handlers       = rest_get_server()->get_routes()[ self::ROUTE ];
			$response       = rest_get_server()->dispatch( new WP_REST_Request( 'GET', self::ROUTE ) );
		} finally {
			unregister_taxonomy( 'entity-actions' );
			$wp_rest_server = null;
		}

		$this->assertCount( 2, $handlers, 'Only the route of the terms is registered.' );
		$this->assertInstanceOf( WP_REST_Terms_Controller::class, $handlers[0]['callback'][0] );
		$this->assertArrayHasKey( 'POST', $handlers[1]['methods'], 'Terms can still be created.' );
		$this->assertSame( 200, $response->get_status(), 'The terms are listed.' );
		$this->assertSame( array(), $response->get_data() );
	}

	/**
	 * Editors (with `edit_posts`) can read the actions.
	 *
	 * @covers ::get_items_permissions_check
	 * @covers ::get_items
	 */
	public function test_get_items_allows_users_with_edit_posts() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_request();

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * Subscribers (without `edit_posts`) are forbidden.
	 *
	 * @covers ::get_items_permissions_check
	 */
	public function test_get_items_forbids_users_without_edit_posts() {
		wp_set_current_user( self::$subscriber_id );

		$response = $this->dispatch_request();

		$this->assertErrorResponse( 'rest_cannot_read', $response, 403 );
	}

	/**
	 * Logged-out users are unauthorized.
	 *
	 * @covers ::get_items_permissions_check
	 */
	public function test_get_items_requires_authentication() {
		wp_set_current_user( 0 );

		$response = $this->dispatch_request();

		$this->assertErrorResponse( 'rest_cannot_read', $response, 401 );
	}

	/**
	 * Post type actions are gated by that post type's own `edit_posts`
	 * capability, honoring custom capability registrations.
	 *
	 * `wp_template_part` maps `edit_posts` to `edit_theme_options`, which
	 * editors lack but administrators have.
	 *
	 * @covers ::get_items_permissions_check
	 * @covers ::get_required_capability
	 */
	public function test_get_items_uses_post_type_specific_capability() {
		wp_set_current_user( self::$editor_id );
		$this->assertErrorResponse(
			'rest_cannot_read',
			$this->dispatch_request( 'postType', 'wp_template_part' ),
			403
		);

		wp_set_current_user( self::$admin_id );
		$this->assertSame(
			200,
			$this->dispatch_request( 'postType', 'wp_template_part' )->get_status()
		);
	}

	/**
	 * A post type that is not registered is not found.
	 *
	 * @covers ::get_items_permissions_check
	 * @covers ::get_required_capability
	 */
	public function test_get_items_unknown_post_type_is_not_found() {
		wp_set_current_user( self::$admin_id );

		$response = $this->dispatch_request( 'postType', 'nonexistent_post_type' );

		$this->assertErrorResponse( 'rest_entity_actions_invalid_entity', $response, 404 );
	}

	/**
	 * The actions registered on a post type not exposed in the REST API are
	 * not served: the registry accepts them, the route does not.
	 *
	 * @covers ::get_items_permissions_check
	 * @covers ::get_required_capability
	 */
	public function test_get_items_post_type_hidden_from_rest_is_not_found() {
		register_post_type( 'gutenberg_hidden', array( 'show_in_rest' => false ) );
		wp_set_current_user( self::$admin_id );

		try {
			$registered = $this->register_actions(
				'postType',
				'gutenberg_hidden',
				array(
					array(
						'id'    => 'secret',
						'label' => 'Secret',
					),
				)
			);
			$response   = $this->dispatch_request( 'postType', 'gutenberg_hidden' );
		} finally {
			unregister_post_type( 'gutenberg_hidden' );
		}

		$this->assertSame( array( 'secret' ), $registered, 'The registry accepts the actions.' );
		$this->assertErrorResponse( 'rest_entity_actions_invalid_entity', $response, 404 );
	}

	/**
	 * Taxonomy actions are gated by the taxonomy's `manage_terms` capability.
	 *
	 * @covers ::get_items_permissions_check
	 * @covers ::get_required_capability
	 */
	public function test_get_items_uses_taxonomy_capability() {
		wp_set_current_user( self::$editor_id );
		$this->assertSame(
			200,
			$this->dispatch_request( 'taxonomy', 'category' )->get_status()
		);

		wp_set_current_user( self::$subscriber_id );
		$this->assertErrorResponse(
			'rest_cannot_read',
			$this->dispatch_request( 'taxonomy', 'category' ),
			403
		);
	}

	/**
	 * A taxonomy that is not registered is not found.
	 *
	 * @covers ::get_items_permissions_check
	 * @covers ::get_required_capability
	 */
	public function test_get_items_unknown_taxonomy_is_not_found() {
		wp_set_current_user( self::$admin_id );

		$response = $this->dispatch_request( 'taxonomy', 'nonexistent_taxonomy' );

		$this->assertErrorResponse( 'rest_entity_actions_invalid_entity', $response, 404 );
	}

	/**
	 * Root entities require `manage_options`.
	 *
	 * @covers ::get_items_permissions_check
	 * @covers ::get_required_capability
	 */
	public function test_get_items_root_requires_manage_options() {
		wp_set_current_user( self::$editor_id );
		$this->assertErrorResponse(
			'rest_cannot_read',
			$this->dispatch_request( 'root', 'site' ),
			403
		);

		wp_set_current_user( self::$admin_id );
		$this->assertSame(
			200,
			$this->dispatch_request( 'root', 'site' )->get_status()
		);
	}

	/**
	 * An unknown kind falls back to `edit_posts`.
	 *
	 * @covers ::get_items_permissions_check
	 * @covers ::get_required_capability
	 */
	public function test_get_items_unknown_kind_falls_back_to_edit_posts() {
		wp_set_current_user( self::$editor_id );
		$this->assertSame(
			200,
			$this->dispatch_request( 'customKind', 'customName' )->get_status()
		);

		wp_set_current_user( self::$subscriber_id );
		$this->assertErrorResponse(
			'rest_cannot_read',
			$this->dispatch_request( 'customKind', 'customName' ),
			403
		);
	}

	/**
	 * Both `kind` and `name` are required, and cannot be empty.
	 *
	 * @covers ::register_routes
	 */
	public function test_get_items_requires_kind_and_name() {
		wp_set_current_user( self::$admin_id );

		$missing_name = $this->dispatch_request( 'postType', null );
		$this->assertErrorResponse( 'rest_missing_callback_param', $missing_name, 400 );

		$missing_kind = $this->dispatch_request( null, 'page' );
		$this->assertErrorResponse( 'rest_missing_callback_param', $missing_kind, 400 );

		$empty_kind = $this->dispatch_request( '', 'page' );
		$this->assertErrorResponse( 'rest_invalid_param', $empty_kind, 400 );

		$empty_name = $this->dispatch_request( 'postType', '' );
		$this->assertErrorResponse( 'rest_invalid_param', $empty_name, 400 );
	}

	/**
	 * A numeric script module id is returned as a string, like any other.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_returns_a_numeric_module_id_as_a_string() {
		wp_set_current_user( self::$editor_id );
		$this->register_actions( 'postType', 'page', array( array( 'id' => 'feature' ) ), '123' );

		$script_modules = $this->dispatch_request()->get_data()['script_modules'];

		$this->assertSame( '123', end( $script_modules )['id'] );
	}

	/**
	 * The response echoes the entity and lists its actions and script modules.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_returns_entity_and_actions_shape() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_request( 'postType', 'page' );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'postType', $data['kind'] );
		$this->assertSame( 'page', $data['name'] );
		$this->assertIsArray( $data['actions'] );
		$this->assertIsArray( $data['script_modules'] );
	}

	/**
	 * An entity without registered actions returns empty lists, which encode
	 * as JSON arrays.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_returns_empty_lists_without_registered_actions() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_request( 'customKind', 'customName' );
		$data     = $response->get_data();

		$this->assertSame( array(), $data['actions'] );
		$this->assertSame( array(), $data['script_modules'] );

		$json = wp_json_encode( rest_get_server()->response_to_data( $response, false ) );
		$this->assertStringContainsString( '"actions":[]', $json );
		$this->assertStringContainsString( '"script_modules":[]', $json );
	}

	/**
	 * The actions registered by a plugin are exposed as registered, in
	 * registration order, and each script module lists the actions it applies
	 * to.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_exposes_registered_actions_and_their_script_modules() {
		$feature = array(
			'id'           => 'feature',
			'label'        => 'Feature',
			'isPrimary'    => true,
			'supportsBulk' => true,
		);
		$archive = array(
			'id'          => 'archive',
			'label'       => 'Archive…',
			'modalHeader' => 'Archive',
			'context'     => 'list',
		);
		$share   = array(
			'id'    => 'share',
			'label' => 'Share',
		);
		$this->register_actions( 'customKind', 'customName', array( $feature, $archive ), 'plugin/actions' );
		$this->register_actions( 'customKind', 'customName', array( $share ), 'plugin/share' );

		wp_set_current_user( self::$editor_id );
		$data = $this->dispatch_request( 'customKind', 'customName' )->get_data();

		$origin = array( 'origin' => array( 'registeredBy' => 'test-plugin' ) );
		$this->assertSame( array( $feature + $origin, $archive + $origin, $share + $origin ), $data['actions'] );
		$this->assertSame(
			array(
				array(
					'id'      => 'plugin/actions',
					'actions' => array( 'feature', 'archive' ),
				),
				array(
					'id'      => 'plugin/share',
					'actions' => array( 'share' ),
				),
			),
			$data['script_modules']
		);
	}

	/**
	 * Actions registered without a script module have none listed.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_lists_no_script_module_for_plain_actions() {
		$this->register_actions(
			'customKind',
			'customName',
			array(
				array(
					'id'    => 'plain',
					'label' => 'Plain',
				),
			)
		);

		wp_set_current_user( self::$editor_id );
		$data = $this->dispatch_request( 'customKind', 'customName' )->get_data();

		$this->assertSame( array( 'plain' ), array_column( $data['actions'], 'id' ) );
		$this->assertSame( array(), $data['script_modules'] );
	}

	/**
	 * The item schema describes the response.
	 *
	 * @covers ::get_item_schema
	 * @covers ::get_action_schema
	 */
	public function test_get_item_schema() {
		$controller = new Gutenberg_REST_Entity_Actions_Controller_7_2();
		$schema     = $controller->get_item_schema();

		$this->assertSame( array( 'kind', 'name', 'actions', 'script_modules' ), array_keys( $schema['properties'] ) );

		$action = $schema['properties']['actions']['items'];
		$this->assertSame( 'object', $action['type'] );
		$this->assertTrue( $action['additionalProperties'], 'A plugin can register properties of its own.' );
		foreach ( array( 'id', 'origin', 'label', 'isPrimary', 'supportsBulk', 'disabled', 'context', 'modalHeader', 'hideModalHeader', 'modalSize', 'modalFocusOnMount' ) as $property ) {
			$this->assertArrayHasKey( $property, $action['properties'], "The `$property` action property should be described." );
		}
		foreach ( array( 'callback', 'RenderModal', 'isEligible', 'icon' ) as $property ) {
			$this->assertArrayNotHasKey( $property, $action['properties'], "The `$property` action property comes from the script modules." );
		}

		$module = $schema['properties']['script_modules']['items'];
		$this->assertSame( array( 'id', 'actions' ), array_keys( $module['properties'] ) );
	}

	/**
	 * The response of the route validates against its schema.
	 *
	 * @covers ::get_items
	 * @covers ::get_item_schema
	 */
	public function test_get_items_response_matches_the_schema() {
		$this->register_actions(
			'postType',
			'page',
			array(
				array(
					'id'                => 'feature',
					'label'             => 'Feature…',
					'modalSize'         => 'medium',
					'modalFocusOnMount' => true,
				),
			),
			'plugin/actions'
		);

		wp_set_current_user( self::$editor_id );
		$response = $this->dispatch_request( 'postType', 'page' );
		$schema   = ( new Gutenberg_REST_Entity_Actions_Controller_7_2() )->get_item_schema();

		$this->assertTrue( rest_validate_value_from_schema( $response->get_data(), $schema ) );
	}
}
