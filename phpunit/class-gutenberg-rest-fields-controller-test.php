<?php
/**
 * Unit tests covering Gutenberg_REST_Fields_Controller_7_2 functionality.
 *
 * @package gutenberg
 *
 * @coversDefaultClass Gutenberg_REST_Fields_Controller_7_2
 */
class Tests_REST_Fields_Controller extends WP_Test_REST_TestCase {

	/**
	 * The REST route the controller registers.
	 */
	const ROUTE = '/wp/v2/fields';

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
	 * The callbacks a test hooked to `fields_api_init`, removed on tear
	 * down.
	 *
	 * @var callable[]
	 */
	private $callbacks = array();

	/**
	 * Tears down each test.
	 *
	 * Resetting the registry drops the fields a test registered along with
	 * the defaults; the next read fires `fields_api_init` again and
	 * registers the defaults anew.
	 */
	public function tear_down() {
		foreach ( $this->callbacks as $callback ) {
			remove_action( 'fields_api_init', $callback );
		}
		$this->callbacks = array();
		Gutenberg_Fields_Registry::get_instance()->reset();

		parent::tear_down();
	}

	/**
	 * Registers fields on `fields_api_init` for the duration of the test:
	 * the registry is reset on tear down.
	 *
	 * Registering only runs on the action, so the registration is hooked to
	 * it, as a plugin does, and the action fired anew: the registry is reset
	 * and read, which registers the defaults again and replays the
	 * registrations made so far, in order.
	 *
	 * @param string      $kind   The entity kind.
	 * @param string      $name   The entity name.
	 * @param array[]     $fields The field definitions.
	 * @param string|null $module The script module id, if any.
	 * @return bool Whether the fields were registered.
	 */
	private function register_fields( $kind, $name, $fields, $module = null ) {
		$registered = false;
		$callback   = static function ( $registry ) use ( &$registered, $kind, $name, $fields, $module ) {
			$registered = $registry->register( $kind, $name, $fields, $module );
		};
		add_action( 'fields_api_init', $callback );
		$this->callbacks[] = $callback;

		$registry = Gutenberg_Fields_Registry::get_instance();
		$registry->reset();
		$registry->get_all_registered();

		return $registered;
	}

	/**
	 * Dispatches a request to the fields route.
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
		$this->assertInstanceOf( 'Gutenberg_REST_Fields_Controller_7_2', $routes[ self::ROUTE ][0]['callback'][0] );
	}

	/**
	 * Editors (with `edit_posts`) can read the fields.
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
	 * Post type fields are gated by that post type's own `edit_posts`
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

		$this->assertErrorResponse( 'rest_fields_invalid_entity', $response, 404 );
	}

	/**
	 * Taxonomy fields are gated by the taxonomy's `manage_terms` capability.
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

		$this->assertErrorResponse( 'rest_fields_invalid_entity', $response, 404 );
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
	 * Both `kind` and `name` are required.
	 *
	 * @covers ::register_routes
	 */
	public function test_get_items_requires_kind_and_name() {
		wp_set_current_user( self::$admin_id );

		$missing_name = $this->dispatch_request( 'postType', null );
		$this->assertErrorResponse( 'rest_missing_callback_param', $missing_name, 400 );

		$missing_kind = $this->dispatch_request( null, 'page' );
		$this->assertErrorResponse( 'rest_missing_callback_param', $missing_kind, 400 );
	}

	/**
	 * The response echoes the entity and lists its fields and script modules.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_returns_entity_and_fields_shape() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_request( 'postType', 'page' );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'postType', $data['kind'] );
		$this->assertSame( 'page', $data['name'] );
		$this->assertIsArray( $data['fields'] );
		$this->assertIsArray( $data['script_modules'] );
	}

	/**
	 * The default fields registered for a post type are exposed.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_exposes_the_default_post_type_fields() {
		wp_set_current_user( self::$editor_id );

		$data = $this->dispatch_request( 'postType', 'page' )->get_data();
		$ids  = array_column( $data['fields'], 'id' );

		$this->assertContains( 'author', $ids, 'Pages support authors.' );
		$this->assertContains( 'comment_status', $ids, 'Pages support comments.' );
		$this->assertSame( gutenberg_get_registered_fields( 'postType', 'page' ), $data['fields'] );
		$this->assertSame(
			array(
				array(
					'id'     => '@wordpress/fields/server-fields',
					'fields' => array( 'author' ),
				),
			),
			$data['script_modules'],
			'The author field ships its JavaScript parts in the default fields module.'
		);
	}

	/**
	 * An entity without registered fields returns empty lists, which encode as
	 * JSON arrays.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_returns_empty_lists_without_registered_fields() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_request( 'customKind', 'customName' );
		$data     = $response->get_data();

		$this->assertSame( array(), $data['fields'] );
		$this->assertSame( array(), $data['script_modules'] );

		$json = wp_json_encode( rest_get_server()->response_to_data( $response, false ) );
		$this->assertStringContainsString( '"fields":[]', $json );
		$this->assertStringContainsString( '"script_modules":[]', $json );
	}

	/**
	 * The fields registered by a plugin are exposed as registered, and each
	 * script module lists the fields it applies to, in registration order.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_exposes_registered_fields_and_their_script_modules() {
		$color = array(
			'id'       => 'color',
			'type'     => 'text',
			'label'    => 'Color',
			'elements' => array(
				array(
					'value' => 'red',
					'label' => 'Red',
				),
			),
		);
		$size  = array(
			'id'    => 'size',
			'type'  => 'integer',
			'label' => 'Size',
		);
		$this->register_fields( 'customKind', 'customName', array( $color, $size ), 'plugin/appearance' );
		$this->register_fields( 'customKind', 'customName', array( $size ), 'plugin/sizes' );

		wp_set_current_user( self::$editor_id );
		$data = $this->dispatch_request( 'customKind', 'customName' )->get_data();

		$fields = array_column( $data['fields'], null, 'id' );
		$this->assertSame( $color, $fields['color'] );
		$this->assertSame( $size, $fields['size'] );

		$this->assertSame(
			array(
				array(
					'id'     => 'plugin/appearance',
					'fields' => array( 'color', 'size' ),
				),
				array(
					'id'     => 'plugin/sizes',
					'fields' => array( 'size' ),
				),
			),
			$data['script_modules']
		);
	}

	/**
	 * Fields registered without a script module have none listed.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_lists_no_script_module_for_plain_fields() {
		$this->register_fields(
			'customKind',
			'customName',
			array(
				array(
					'id'    => 'plain',
					'type'  => 'text',
					'label' => 'Plain',
				),
			)
		);

		wp_set_current_user( self::$editor_id );
		$data = $this->dispatch_request( 'customKind', 'customName' )->get_data();

		$this->assertSame( array( 'plain' ), array_column( $data['fields'], 'id' ) );
		$this->assertSame( array(), $data['script_modules'] );
	}

	/**
	 * Empty object-typed field properties serialize as JSON objects rather
	 * than arrays.
	 *
	 * @covers ::get_items
	 * @covers ::cast_empty_objects
	 */
	public function test_empty_object_properties_serialize_as_json_objects() {
		$this->register_fields(
			'customKind',
			'customName',
			array(
				array(
					'id'       => 'plain',
					'type'     => 'text',
					'filterBy' => array(),
					'isValid'  => array(),
					'format'   => array(),
					'Edit'     => array(),
					'elements' => array( array() ),
				),
				array(
					'id'       => 'list',
					'type'     => 'text',
					'elements' => array(),
				),
			)
		);

		wp_set_current_user( self::$editor_id );
		$response = $this->dispatch_request( 'customKind', 'customName' );
		$json     = wp_json_encode( rest_get_server()->response_to_data( $response, false ) );

		$this->assertStringContainsString( '"filterBy":{}', $json );
		$this->assertStringContainsString( '"isValid":{}', $json );
		$this->assertStringContainsString( '"format":{}', $json );
		$this->assertStringContainsString( '"Edit":{}', $json );
		$this->assertStringContainsString( '"elements":[{}]', $json, 'Empty items typed as objects encode as objects.' );
		$this->assertStringContainsString( '"elements":[]', $json, 'Empty lists stay lists.' );
	}

	/**
	 * The item schema describes the response.
	 *
	 * @covers ::get_item_schema
	 * @covers ::get_field_schema
	 */
	public function test_get_item_schema() {
		$controller = new Gutenberg_REST_Fields_Controller_7_2();
		$schema     = $controller->get_item_schema();

		$this->assertSame( array( 'kind', 'name', 'fields', 'script_modules' ), array_keys( $schema['properties'] ) );

		$field = $schema['properties']['fields']['items'];
		$this->assertSame( 'object', $field['type'] );
		$this->assertTrue( $field['additionalProperties'], 'A plugin can register properties of its own.' );
		foreach ( array( 'id', 'type', 'label', 'Edit', 'isValid', 'elements', 'filterBy', 'readOnly', 'format' ) as $property ) {
			$this->assertArrayHasKey( $property, $field['properties'], "The `$property` field property should be described." );
		}

		$module = $schema['properties']['script_modules']['items'];
		$this->assertSame( array( 'id', 'fields' ), array_keys( $module['properties'] ) );
	}

	/**
	 * The response of the route validates against its schema.
	 *
	 * @covers ::get_items
	 * @covers ::get_item_schema
	 */
	public function test_get_items_response_matches_the_schema() {
		$this->register_fields(
			'postType',
			'page',
			array(
				array(
					'id'       => 'color',
					'type'     => 'text',
					'label'    => 'Color',
					'filterBy' => array(
						'operators' => array( 'isAny' ),
					),
				),
			),
			'plugin/appearance'
		);

		wp_set_current_user( self::$editor_id );
		$response = $this->dispatch_request( 'postType', 'page' );
		$schema   = ( new Gutenberg_REST_Fields_Controller_7_2() )->get_item_schema();

		$this->assertTrue( rest_validate_value_from_schema( $response->get_data(), $schema ) );
	}
}
