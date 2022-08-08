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
 * @covers Gutenberg_REST_Block_Patterns_Controller
 */
class Gutenberg_REST_Block_Patterns_Controller_Test extends WP_Test_REST_Controller_Testcase {
	protected static $admin_id;
	protected static $orig_registry;

	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
	}

	public static function wpSetUpBeforeClass( $factory ) {
		// Create a test user.
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );

		// Setup an empty testing instance of `WP_Block_Patterns_Registry` and save the original.
		$reflection = new ReflectionClass( 'WP_Block_Patterns_Registry' );
		$reflection->getProperty( 'instance' )->setAccessible( true );
		self::$orig_registry = $reflection->getStaticPropertyValue( 'instance' );
		$test_registry       = new WP_Block_Patterns_Registry();
		$reflection->setStaticPropertyValue( 'instance', $test_registry );

		// Register some patterns in the test registry.
		$test_registry->register(
			'test/one',
			array(
				'title'         => 'Pattern One',
				'categories'    => array( 'test' ),
				'viewportWidth' => 1440,
				'content'       => '<!-- wp:heading {"level":1} --><h1>One</h1><!-- /wp:heading -->',
			)
		);

		$test_registry->register(
			'test/two',
			array(
				'title'      => 'Pattern Two',
				'categories' => array( 'test' ),
				'content'    => '<!-- wp:paragraph --><p>Two</p><!-- /wp:paragraph -->',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		// Delete the test user.
		self::delete_user( self::$admin_id );

		// Restore the original registry instance.
		$reflection = new ReflectionClass( 'WP_Block_Patterns_Registry' );
		$reflection->setStaticPropertyValue( 'instance', self::$orig_registry );
	}

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey(
			'/wp/v2/block-patterns/patterns',
			$routes,
			'The patterns route does not exist'
		);
	}

	public function test_get_items() {
		wp_set_current_user( self::$admin_id );

		$expected_names  = array( 'test/one', 'test/two' );
		$expected_fields = array( 'name', 'content' );

		$request            = new WP_REST_Request( 'GET', '/wp/v2/block-patterns/patterns' );
		$request['_fields'] = 'name,content';
		$response           = rest_get_server()->dispatch( $request );
		$data               = $response->get_data();

		$this->assertCount( count( $expected_names ), $data );
		foreach ( $data as $idx => $item ) {
			$this->assertEquals( $expected_names[ $idx ], $item['name'] );
			$this->assertEquals( $expected_fields, array_keys( $item ) );
		}
	}

	/**
	 * Abstract methods that we must implement.
	 */
	public function test_context_param() {
		$this->markTestIncomplete();
	}
	public function test_get_item() {
		$this->markTestIncomplete();
	}
	public function test_create_item() {
		$this->markTestIncomplete();
	}
	public function test_update_item() {
		$this->markTestIncomplete();
	}
	public function test_delete_item() {
		$this->markTestIncomplete();
	}
	public function test_prepare_item() {
		$this->markTestIncomplete();
	}
	public function test_get_item_schema() {
		$this->markTestIncomplete();
	}
}
