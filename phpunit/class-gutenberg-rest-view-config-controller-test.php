<?php
/**
 * Unit tests covering Gutenberg_REST_View_Config_Controller_7_1 functionality.
 *
 * @package gutenberg
 *
 * @coversDefaultClass Gutenberg_REST_View_Config_Controller_7_1
 */
class Tests_REST_View_Config_Controller extends WP_Test_REST_TestCase {

	/**
	 * The REST route the controller registers.
	 */
	const ROUTE = '/wp/v2/view-config';

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
	 * Dispatches a request to the view-config route.
	 *
	 * @param string $kind Entity kind.
	 * @param string $name Entity name.
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
	 * The route is registered.
	 *
	 * @covers ::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( self::ROUTE, $routes );
	}

	/**
	 * Editors (with `edit_posts`) can read the view config.
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
	 * Post type config is gated by that post type's own `edit_posts` capability,
	 * honoring custom capability registrations.
	 *
	 * `wp_template_part` maps `edit_posts` to `edit_theme_options`, which editors
	 * lack but administrators have.
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
	 * An unregistered post type is treated as an unknown entity (404).
	 *
	 * @covers ::get_items_permissions_check
	 * @covers ::get_required_capability
	 */
	public function test_get_items_unknown_post_type_is_not_found() {
		wp_set_current_user( self::$admin_id );

		$response = $this->dispatch_request( 'postType', 'does_not_exist' );

		$this->assertErrorResponse( 'rest_view_config_invalid_entity', $response, 404 );
	}

	/**
	 * Taxonomy config is gated by the taxonomy's `manage_terms` capability.
	 *
	 * @covers ::get_items_permissions_check
	 * @covers ::get_required_capability
	 */
	public function test_get_items_uses_taxonomy_capability() {
		// Editors have `manage_categories` (the `manage_terms` cap for `category`).
		wp_set_current_user( self::$editor_id );
		$this->assertSame(
			200,
			$this->dispatch_request( 'taxonomy', 'category' )->get_status()
		);

		// Subscribers do not.
		wp_set_current_user( self::$subscriber_id );
		$this->assertErrorResponse(
			'rest_cannot_read',
			$this->dispatch_request( 'taxonomy', 'category' ),
			403
		);
	}

	/**
	 * An unregistered taxonomy is treated as an unknown entity (404).
	 *
	 * @covers ::get_items_permissions_check
	 * @covers ::get_required_capability
	 */
	public function test_get_items_unknown_taxonomy_is_not_found() {
		wp_set_current_user( self::$admin_id );

		$response = $this->dispatch_request( 'taxonomy', 'does_not_exist' );

		$this->assertErrorResponse( 'rest_view_config_invalid_entity', $response, 404 );
	}

	/**
	 * Root-level config requires `manage_options`.
	 *
	 * @covers ::get_items_permissions_check
	 * @covers ::get_required_capability
	 */
	public function test_get_items_root_requires_manage_options() {
		// Editors lack `manage_options`.
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
	 * Unknown kinds fall back to the baseline `edit_posts` capability so that
	 * entities registered through the view config filter remain readable.
	 *
	 * @covers ::get_items_permissions_check
	 * @covers ::get_required_capability
	 */
	public function test_get_items_unknown_kind_falls_back_to_edit_posts() {
		wp_set_current_user( self::$editor_id );
		$this->assertSame(
			200,
			$this->dispatch_request( 'custom_kind', 'custom_name' )->get_status()
		);

		wp_set_current_user( self::$subscriber_id );
		$this->assertErrorResponse(
			'rest_cannot_read',
			$this->dispatch_request( 'custom_kind', 'custom_name' ),
			403
		);
	}

	/**
	 * Both `kind` and `name` are required.
	 *
	 * @covers ::register_routes
	 */
	public function test_get_items_requires_kind_and_name() {
		wp_set_current_user( self::$editor_id );

		$missing_name = $this->dispatch_request( 'postType', null );
		$this->assertErrorResponse( 'rest_missing_callback_param', $missing_name, 400 );

		$missing_kind = $this->dispatch_request( null, 'page' );
		$this->assertErrorResponse( 'rest_missing_callback_param', $missing_kind, 400 );
	}

	/**
	 * The response echoes the requested entity and the documented config keys.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_returns_entity_and_config_shape() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_request( 'postType', 'page' );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'postType', $data['kind'] );
		$this->assertSame( 'page', $data['name'] );
		$this->assertArrayHasKey( 'default_view', $data );
		$this->assertArrayHasKey( 'default_layouts', $data );
		$this->assertArrayHasKey( 'view_list', $data );
		$this->assertArrayHasKey( 'form', $data );
	}

	/**
	 * The response body matches gutenberg_get_entity_view_config() for the entity.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_matches_underlying_config() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_request( 'postType', 'page' );
		// Normalize through JSON to compare what a client actually receives:
		// the response's object casts collapse back to the source arrays.
		$data   = json_decode( wp_json_encode( $response->get_data() ), true );
		$config = gutenberg_get_entity_view_config( 'postType', 'page' );

		$this->assertSame( $config['default_view'], $data['default_view'] );
		$this->assertSame( $config['default_layouts'], $data['default_layouts'] );
		$this->assertSame( $config['view_list'], $data['view_list'] );
		$this->assertSame( $config['form'], $data['form'] );
	}

	/**
	 * Empty object-typed config values serialize as JSON objects ({}), not arrays ([]).
	 *
	 * @covers ::get_items
	 */
	public function test_empty_object_fields_serialize_as_json_objects() {
		// Admin: reading wp_template_part config requires `edit_theme_options`.
		wp_set_current_user( self::$admin_id );

		// An entity with no provider yields empty default_layouts entries and form.
		$decoded = json_decode( wp_json_encode( $this->dispatch_request( 'custom_kind', 'custom_name' )->get_data() ) );

		$this->assertIsObject( $decoded->form );
		$this->assertIsObject( $decoded->default_layouts->table );
		$this->assertIsObject( $decoded->default_layouts->grid );
		$this->assertIsObject( $decoded->default_layouts->list );

		// wp_template_part yields an empty default_view.layout and grid layout.
		$decoded = json_decode( wp_json_encode( $this->dispatch_request( 'postType', 'wp_template_part' )->get_data() ) );

		$this->assertIsObject( $decoded->default_view->layout );
		$this->assertIsObject( $decoded->default_layouts->grid->layout );
	}

	/**
	 * Empty object-typed values nested inside a `view_list` item's `view`
	 * override serialize as JSON objects ({}), not arrays ([]).
	 *
	 * The `view.layout` (and its `styles` map) are typed as objects by the
	 * schema but are not produced by core data, so this exercises the
	 * schema-driven cast against a value supplied through the documented
	 * `get_entity_view_config_{$kind}_{$name}` filter.
	 *
	 * @covers ::get_items
	 */
	public function test_empty_objects_inside_view_list_view_serialize_as_json_objects() {
		wp_set_current_user( self::$editor_id );

		$filter = static function ( $config ) {
			$config['view_list'][] = array(
				'title' => 'Custom',
				'slug'  => 'custom',
				'view'  => array(
					'type'   => 'table',
					'layout' => array(
						'styles' => array(),
					),
				),
			);
			return $config;
		};
		add_filter( 'get_entity_view_config_custom_kind_custom_name', $filter );

		$decoded = json_decode( wp_json_encode( $this->dispatch_request( 'custom_kind', 'custom_name' )->get_data() ) );

		remove_filter( 'get_entity_view_config_custom_kind_custom_name', $filter );

		$view = end( $decoded->view_list );
		$this->assertIsObject( $view->view->layout );
		$this->assertIsObject( $view->view->layout->styles );
	}

	/**
	 * The item schema exposes the documented top-level properties.
	 *
	 * @covers ::get_item_schema
	 */
	public function test_get_item_schema() {
		$controller = new Gutenberg_REST_View_Config_Controller_7_1();
		$schema     = $controller->get_item_schema();

		$this->assertSame( 'view-config', $schema['title'] );
		$this->assertSameSets(
			array( 'kind', 'name', 'default_view', 'default_layouts', 'view_list', 'form' ),
			array_keys( $schema['properties'] )
		);
	}
}
