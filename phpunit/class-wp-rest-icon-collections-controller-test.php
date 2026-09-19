<?php
/**
 * Unit tests covering WP_REST_Icon_Collections_Controller functionality.
 *
 * @package gutenberg
 */
class WP_Test_REST_Icon_Collections_Controller extends WP_Test_REST_TestCase {

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * Contributor user ID.
	 *
	 * @var int
	 */
	protected static $contributor_id;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	protected static $subscriber_id;

	/**
	 * Sets up test fixtures before any tests in this class run.
	 *
	 * @param WP_UnitTest_Factory $factory Unit test factory.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id       = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$editor_id      = $factory->user->create( array( 'role' => 'editor' ) );
		self::$contributor_id = $factory->user->create( array( 'role' => 'contributor' ) );
		self::$subscriber_id  = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	/**
	 * Cleans up test fixtures after all tests in this class run.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
		self::delete_user( self::$contributor_id );
		self::delete_user( self::$subscriber_id );
	}

	/**
	 * Sets up the environment before each test method runs.
	 */
	public function set_up() {
		parent::set_up();

		/*
		 * Other suites reset or clear registries. Re-register default icon
		 * collections if not present so order-dependent tests pass cleanly.
		 */
		if ( ! WP_Icon_Collections_Registry::get_instance()->is_registered( 'core' ) ) {
			gutenberg_register_default_icon_collections();
		}
	}

	/**
	 * Cleans up the environment after each test method runs.
	 */
	public function tear_down() {
		$registry = WP_Icon_Collections_Registry::get_instance();
		foreach ( array( 'custom-collection', 'my-custom-collection', 'test-collection' ) as $slug ) {
			if ( $registry->is_registered( $slug ) ) {
				$registry->unregister( $slug );
			}
		}

		parent::tear_down();
	}

	/**
	 * Tests that REST routes for icon collections are properly registered.
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/wp/v2/icon-collections', $routes );
		$this->assertArrayHasKey( '/wp/v2/icon-collections/(?P<slug>[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?)', $routes );
	}

	/**
	 * Tests that GET /wp/v2/icon-collections returns an array of registered collections for editors.
	 */
	public function test_get_items_returns_registered_collections() {
		wp_set_current_user( self::$editor_id );

		WP_Icon_Collections_Registry::get_instance()->register(
			'custom-collection',
			array(
				'label'       => 'Custom Collection',
				'description' => 'A collection of custom icons.',
			)
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icon-collections' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertIsArray( $data );
		$this->assertNotEmpty( $data );

		$slugs = wp_list_pluck( $data, 'slug' );
		$this->assertContains( 'core', $slugs );
		$this->assertContains( 'custom-collection', $slugs );

		// Verify structure of the custom collection item.
		$custom_items = array_values(
			array_filter(
				$data,
				static function ( $item ) {
					return 'custom-collection' === $item['slug'];
				}
			)
		);

		$this->assertNotEmpty( $custom_items );
		$this->assertSame( 'custom-collection', $custom_items[0]['slug'] );
		$this->assertSame( 'Custom Collection', $custom_items[0]['label'] );
		$this->assertSame( 'A collection of custom icons.', $custom_items[0]['description'] );
	}

	/**
	 * Tests that administrators can access registered icon collections.
	 */
	public function test_get_items_admin_has_access() {
		wp_set_current_user( self::$admin_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icon-collections' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * Tests that contributors can access registered icon collections.
	 */
	public function test_get_items_contributor_has_access() {
		wp_set_current_user( self::$contributor_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icon-collections' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * Tests that unauthenticated users cannot access icon collections.
	 */
	public function test_get_items_requires_authentication() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icon-collections' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_view', $response, 401 );
	}

	/**
	 * Tests that subscribers without edit_posts capability cannot access icon collections.
	 */
	public function test_get_items_requires_edit_posts_capability() {
		wp_set_current_user( self::$subscriber_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icon-collections' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_view', $response, 403 );
	}

	/**
	 * Tests that the _fields parameter filters collection response fields.
	 */
	public function test_get_items_fields_parameter() {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/icon-collections' );
		$request->set_param( '_fields', 'slug,label' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertIsArray( $data );
		$this->assertNotEmpty( $data );

		foreach ( $data as $collection ) {
			$this->assertArrayHasKey( 'slug', $collection );
			$this->assertArrayHasKey( 'label', $collection );
			$this->assertArrayNotHasKey( 'description', $collection );
		}
	}

	/**
	 * Tests that GET /wp/v2/icon-collections/<slug> returns single collection data.
	 */
	public function test_get_item_returns_collection_data() {
		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icon-collections/core' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertIsArray( $data );
		$this->assertSame( 'core', $data['slug'] );
		$this->assertSame( 'WordPress', $data['label'] );
		$this->assertSame( 'Core icon collection.', $data['description'] );
	}

	/**
	 * Tests that GET /wp/v2/icon-collections/<slug> returns custom registered collection data.
	 */
	public function test_get_item_custom_registered_collection() {
		wp_set_current_user( self::$editor_id );

		WP_Icon_Collections_Registry::get_instance()->register(
			'my-custom-collection',
			array(
				'label'       => 'My Icons',
				'description' => 'A custom pack.',
			)
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icon-collections/my-custom-collection' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'my-custom-collection', $data['slug'] );
		$this->assertSame( 'My Icons', $data['label'] );
		$this->assertSame( 'A custom pack.', $data['description'] );
	}

	/**
	 * Tests that GET /wp/v2/icon-collections/<slug> returns 404 for a non-existent collection.
	 */
	public function test_get_item_returns_404_for_invalid_collection() {
		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icon-collections/non-existent-collection' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_icon_collection_not_found', $response, 404 );
	}

	/**
	 * Tests that getting a specific collection requires authentication.
	 */
	public function test_get_item_requires_authentication() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icon-collections/core' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_view', $response, 401 );
	}

	/**
	 * Tests that getting a specific collection requires edit_posts capability.
	 */
	public function test_get_item_requires_permissions() {
		wp_set_current_user( self::$subscriber_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icon-collections/core' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_view', $response, 403 );
	}

	/**
	 * Tests that the _fields parameter filters single collection response fields.
	 */
	public function test_get_item_fields_parameter() {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/icon-collections/core' );
		$request->set_param( '_fields', 'label' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'label', $data );
		$this->assertArrayNotHasKey( 'slug', $data );
		$this->assertArrayNotHasKey( 'description', $data );
	}

	/**
	 * Tests that the item schema matches the expected specification.
	 */
	public function test_get_item_schema() {
		$controller = new WP_REST_Icon_Collections_Controller();
		$schema     = $controller->get_item_schema();

		$this->assertSame( 'icon-collection', $schema['title'] );
		$this->assertSame( 'object', $schema['type'] );
		$this->assertArrayHasKey( 'slug', $schema['properties'] );
		$this->assertArrayHasKey( 'label', $schema['properties'] );
		$this->assertArrayHasKey( 'description', $schema['properties'] );

		$this->assertTrue( $schema['properties']['slug']['readonly'] );
		$this->assertTrue( $schema['properties']['label']['readonly'] );
		$this->assertTrue( $schema['properties']['description']['readonly'] );
	}

	/**
	 * Tests that collection query parameters include context with view default.
	 */
	public function test_get_collection_params() {
		$controller = new WP_REST_Icon_Collections_Controller();
		$params     = $controller->get_collection_params();

		$this->assertArrayHasKey( 'context', $params );
		$this->assertSame( 'view', $params['context']['default'] );
	}
}
