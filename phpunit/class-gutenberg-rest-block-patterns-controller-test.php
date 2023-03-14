<?php
/**
 * Unit tests covering Gutenberg_REST_Block_Patterns_Controller functionality.
 *
 * @package WordPress
 * @subpackage REST_API
 */

/**
 * Unit tests for REST API for Block Patterns.
 *
 * @group restapi
 * @covers Gutenberg_REST_Block_Patterns_Controller_6_2
 */
class Gutenberg_REST_Block_Patterns_Controller_6_2_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * Admin user ID.
	 *
	 * @since 6.0.0
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Original instance of WP_Block_Patterns_Registry.
	 *
	 * @since 6.0.0
	 *
	 * @var WP_Block_Patterns_Registry
	 */
	protected static $orig_registry;

	/**
	 * Instance of the reflected `instance` property.
	 *
	 * @since 6.0.0
	 *
	 * @var ReflectionProperty
	 */
	private static $registry_instance_property;

	/**
	 * The REST API route.
	 *
	 * @since 6.0.0
	 *
	 * @var string
	 */
	const REQUEST_ROUTE = '/wp/v2/block-patterns/patterns';

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );

		// Setup an empty testing instance of `WP_Block_Patterns_Registry` and save the original.
		self::$orig_registry              = WP_Block_Patterns_Registry::get_instance();
		self::$registry_instance_property = new ReflectionProperty( 'WP_Block_Patterns_Registry', 'instance' );
		self::$registry_instance_property->setAccessible( true );
		$test_registry = new WP_Block_Pattern_Categories_Registry();
		self::$registry_instance_property->setValue( $test_registry );

		// Register some patterns in the test registry.
		$test_registry->register(
			'test/one',
			array(
				'title'         => 'Pattern One',
				'categories'    => array( 'test' ),
				'viewportWidth' => 1440,
				'content'       => '<!-- wp:heading {"level":1} --><h1>One</h1><!-- /wp:heading -->',
				'templateTypes' => array( 'page' ),
			)
		);

		$test_registry->register(
			'test/two',
			array(
				'title'         => 'Pattern Two',
				'categories'    => array( 'test' ),
				'content'       => '<!-- wp:paragraph --><p>Two</p><!-- /wp:paragraph -->',
				'templateTypes' => array( 'single' ),
			)
		);

		$test_registry->register(
			'test/three',
			array(
				'title'         => 'Pattern Three',
				'categories'    => array( 'test', 'buttons', 'query' ),
				'content'       => '<!-- wp:paragraph --><p>Three</p><!-- /wp:paragraph -->',
				'templateTypes' => array( '404' ),
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );

		// Restore the original registry instance.
		self::$registry_instance_property->setValue( self::$orig_registry );
		self::$registry_instance_property->setAccessible( false );
		self::$registry_instance_property = null;
		self::$orig_registry              = null;
	}

	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
	}

	public function test_get_items_migrate_pattern_categories() {
		wp_set_current_user( self::$admin_id );

		$request            = new WP_REST_Request( 'GET', static::REQUEST_ROUTE );
		$request['_fields'] = 'name,categories';
		$response           = rest_get_server()->dispatch( $request );
		$data               = $response->get_data();

		$this->assertIsArray( $data, 'WP_REST_Block_Patterns_Controller::get_items() should return an array' );
		$this->assertGreaterThanOrEqual( 3, count( $data ), 'WP_REST_Block_Patterns_Controller::get_items() should return at least 3 items' );
		$this->assertSame(
			array(
				'name'       => 'test/one',
				'categories' => array( 'test' ),
			),
			$data[0],
			'WP_REST_Block_Patterns_Controller::get_items() should return test/one'
		);
		$this->assertSame(
			array(
				'name'       => 'test/two',
				'categories' => array( 'test' ),
			),
			$data[1],
			'WP_REST_Block_Patterns_Controller::get_items() should return test/two'
		);
		$this->assertSame(
			array(
				'name'       => 'test/three',
				'categories' => array( 'test', 'call-to-action', 'posts' ),
			),
			$data[2],
			'WP_REST_Block_Patterns_Controller::get_items() should return test/three'
		);
	}

	/**
	 * Abstract methods that we must implement.
	 *
	 * @doesNotPerformAssertions
	 */
	public function test_register_routes() {
		// Controller does not implement this method.
	}

	public function test_get_items() {
		wp_set_current_user( self::$admin_id );

		$expected_names  = array( 'test/one', 'test/two', 'test/three' );
		$expected_fields = array( 'name', 'content', 'template_types' );

		$request            = new WP_REST_Request( 'GET', '/wp/v2/block-patterns/patterns' );
		$request['_fields'] = 'name,content,template_types';
		$response           = rest_get_server()->dispatch( $request );
		$data               = $response->get_data();

		$this->assertCount( count( $expected_names ), $data );
		foreach ( $data as $idx => $item ) {
			$this->assertEquals( $expected_names[ $idx ], $item['name'] );
			$this->assertEquals( $expected_fields, array_keys( $item ) );
		}
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Controller does not implement this method.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item() {
		// Controller does not implement this method.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// Controller does not implement this method.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// Controller does not implement this method.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// Controller does not implement this method.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// Controller does not implement this method.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item_schema() {
		// Controller does not implement this method.
	}
}
