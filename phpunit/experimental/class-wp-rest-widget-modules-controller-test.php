<?php
/**
 * Unit tests covering WP_REST_Widget_Modules_Controller.
 *
 * @package gutenberg
 *
 * @covers WP_REST_Widget_Modules_Controller
 */
class WP_REST_Widget_Modules_Controller_Test extends WP_UnitTestCase {

	/**
	 * REST route prefix under test.
	 */
	const ROUTE = '/wp/v2/widget-modules';

	/**
	 * Subscriber user id (has the `read` capability).
	 *
	 * @var int
	 */
	protected static $subscriber_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	public function set_up() {
		parent::set_up();
		$this->reset_singleton();
	}

	public function tear_down() {
		$this->reset_singleton();
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Resets the registry singleton so each test starts from a clean state.
	 */
	private function reset_singleton() {
		$instance_property = new ReflectionProperty( WP_Widget_Type_Registry::class, 'instance' );

		if ( PHP_VERSION_ID < 80100 ) {
			$instance_property->setAccessible( true );
		}

		$instance_property->setValue( null, null );
	}

	/**
	 * Registers a couple of widget types for tests that need data.
	 */
	private function register_sample_widgets() {
		$registry = WP_Widget_Type_Registry::get_instance();

		$registry->register(
			'test-plugin/widget-a',
			array(
				'render_module' => 'wp/widgets/widget-a/render',
				'widget_module' => 'wp/widgets/widget-a/widget',
			)
		);

		$registry->register(
			'test-plugin/widget-b',
			array(
				'render_module' => 'wp/widgets/widget-b/render',
				'widget_module' => 'wp/widgets/widget-b/widget',
			)
		);
	}

	public function test_routes_are_registered() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::ROUTE, $routes );
		$this->assertArrayHasKey( self::ROUTE . '/(?P<id>[a-z0-9-]+\/[a-z0-9-]+)', $routes );
	}

	public function test_get_items_returns_registered_collection() {
		wp_set_current_user( self::$subscriber_id );
		$this->register_sample_widgets();

		$response = rest_do_request( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertCount( 2, $data );

		$names = array_column( $data, 'name' );
		sort( $names );
		$this->assertSame(
			array( 'test-plugin/widget-a', 'test-plugin/widget-b' ),
			$names
		);

		$first = $data[0];
		$this->assertArrayHasKey( 'render_module', $first );
		$this->assertArrayHasKey( 'widget_module', $first );
	}

	public function test_get_items_returns_empty_array_when_registry_empty() {
		wp_set_current_user( self::$subscriber_id );

		$response = rest_do_request( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $response->get_data() );
	}

	public function test_get_item_returns_widget_by_name() {
		wp_set_current_user( self::$subscriber_id );
		$this->register_sample_widgets();

		$response = rest_do_request(
			new WP_REST_Request( 'GET', self::ROUTE . '/test-plugin/widget-a' )
		);

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( 'test-plugin/widget-a', $data['name'] );
		$this->assertSame( 'wp/widgets/widget-a/render', $data['render_module'] );
		$this->assertSame( 'wp/widgets/widget-a/widget', $data['widget_module'] );
	}

	public function test_get_item_returns_404_for_unknown_name() {
		wp_set_current_user( self::$subscriber_id );

		$response = rest_do_request(
			new WP_REST_Request( 'GET', self::ROUTE . '/test-plugin/nope' )
		);

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'rest_widget_module_invalid', $response->get_data()['code'] );
	}

	public function test_get_items_rejects_anonymous_user() {
		wp_set_current_user( 0 );
		$this->register_sample_widgets();

		$response = rest_do_request( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( 'rest_cannot_view_widget_modules', $response->get_data()['code'] );
	}

	public function test_get_item_rejects_anonymous_user() {
		wp_set_current_user( 0 );
		$this->register_sample_widgets();

		$response = rest_do_request(
			new WP_REST_Request( 'GET', self::ROUTE . '/test-plugin/widget-a' )
		);

		$this->assertSame( 401, $response->get_status() );
	}

	public function test_schema_exposes_expected_properties() {
		$controller = new WP_REST_Widget_Modules_Controller();
		$schema     = $controller->get_item_schema();

		$this->assertArrayHasKey( 'properties', $schema );

		$properties = $schema['properties'];

		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'render_module', $properties );
		$this->assertArrayHasKey( 'widget_module', $properties );
		$this->assertSame( 'string', $properties['name']['type'] );
		$this->assertSame( array( 'string', 'null' ), $properties['render_module']['type'] );
		$this->assertSame( array( 'string', 'null' ), $properties['widget_module']['type'] );
	}
}
