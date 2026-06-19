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
	 * Editor user id (has `edit_posts`).
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
		self::$editor_id     = $factory->user->create( array( 'role' => 'editor' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	/**
	 * Deletes shared users.
	 */
	public static function wpTearDownAfterClass() {
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
		$data     = $response->get_data();
		$config   = gutenberg_get_entity_view_config( 'postType', 'page' );

		$this->assertSame( $config['default_view'], $data['default_view'] );
		$this->assertSame( $config['default_layouts'], $data['default_layouts'] );
		$this->assertSame( $config['view_list'], $data['view_list'] );
		$this->assertSame( $config['form'], $data['form'] );
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
