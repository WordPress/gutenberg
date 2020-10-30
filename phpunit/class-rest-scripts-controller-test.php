<?php
/**
 * REST API: REST_Scripts_Controller_Test class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Tests for REST API for Scripts.
 *
 * @see WP_Test_REST_Controller_Testcase
 */
class REST_Scripts_Controller_Test extends WP_Test_REST_Controller_Testcase {
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
	 * @var array
	 */
	protected static $users_map = array();

	/**
	 * @var string
	 */
	protected static $script_handle = 'core-assets-test';


	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$superadmin_id           = $factory->user->create(
			array(
				'role'       => 'administrator',
				'user_login' => 'superadmin',
			)
		);
		self::$users_map['superadmin'] = self::$superadmin_id;
		if ( is_multisite() ) {
			update_site_option( 'site_admins', array( 'superadmin' ) );
		}
		self::$admin_id                = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$users_map['admin']      = self::$admin_id;
		self::$editor_id               = $factory->user->create(
			array(
				'role' => 'editor',
			)
		);
		self::$users_map['editor']     = self::$editor_id;
		self::$author_id               = $factory->user->create(
			array(
				'role' => 'author',
			)
		);
		self::$users_map['author']     = self::$author_id;
		self::$subscriber_id           = $factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);
		self::$users_map['subscriber'] = self::$subscriber_id;
		self::$users_map['guest']      = 0;
		register_block_type(
			'fake/scripts-test',
			array(
				'script'        => 'block-script',
				'editor_script' => 'block-editor-script',
			)
		);
	}

	/**
	 * Tear down tests after entire test class is done.
	 */
	public static function wpTearDownAfterClass() {
	foreach( self::$users_map as $key => $user_id ){
            self::delete_user( $user_id );
        }
		unregister_block_type( 'fake/scripts-tests' );
	}

	/**
	 * Tests set up.
	 */
	public function setUp() {
		global $wp_scripts;
		parent::setUp();
		$wp_scripts = new WP_Scripts();
		wp_register_script( self::$script_handle, home_url( '/test.css' ) );
		wp_register_script( 'script1', home_url( '/script1.css' ) );
		wp_register_script( 'dependency1', home_url( '/dependency1.css' ) );
		wp_register_script( 'dependency2', home_url( '/dependency2.css' ) );
		wp_register_script( 'dependency3', home_url( '/dependency3.css' ) );
		wp_register_script( 'dependency4', home_url( '/dependency4.css' ), array( 'dependency3' ) );
		wp_register_script( 'dependency5', home_url( '/dependency5.css' ), array( 'dependency4' ) );
		wp_register_script( 'script-with-deps', home_url( '/script-with-deps.css' ), array( 'dependency1', 'dependency2' ) );
		wp_register_script( 'script-with-nested-deps', home_url( '/script-with-nested-deps.css' ), array( 'dependency5' ) );
		wp_register_script( 'block-script', home_url( '/block-script.css' ) );
		wp_register_script( 'block-editor-script', home_url( '/block-editor-script.css' ) );
	}

	/**
	 * Test whether proper routes are registered.
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/__experimental/scripts', $routes );
		$this->assertArrayHasKey( '/__experimental/scripts/(?P<handle>[\w-]+)', $routes );
	}

	/**
	 * Test context param.
	 */
	public function test_context_param() {
		$request  = new WP_REST_Request( 'OPTIONS', '/__experimental/scripts' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
		// Single.
		$request  = new WP_REST_Request( 'OPTIONS', '/__experimental/scripts/' . self::$script_handle );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	/**
	 * Test multiple scripts.
	 */
	public function test_get_items() {
		foreach ( array( self::$admin_id, self::$superadmin_id ) as $user_id ) {
			wp_set_current_user( $user_id );
			$request = new WP_REST_Request( 'GET', '/__experimental/scripts' );
			$request->set_query_params( array( 'dependency' => 'script1' ) );
			$response = rest_get_server()->dispatch( $request );
			$data     = $response->get_data();
			$this->assertCount( 0, $data );
		}
	}

	/**
	 * Test multiple scripts with nested dependencies.
	 */
	public function test_get_items_nested_deps1() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/__experimental/scripts' );
		$request->set_query_params( array( 'dependency' => 'script-with-deps' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertCount( 2, $data );

		$this->assertEquals( 'dependency1', $data[0]['handle'] );
		$this->assertEquals( 'dependency2', $data[1]['handle'] );

		$this->assertCount( 0, $data[0]['deps'] );
		$this->assertCount( 0, $data[1]['deps'] );
	}

	/**
	 * Test multiple scripts with nested dependencies.
	 */
	public function test_get_items_nested_deps2() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/__experimental/scripts' );
		$request->set_query_params( array( 'dependency' => 'script-with-nested-deps' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertCount( 3, $data );

		$this->assertEquals( 'dependency3', $data[0]['handle'] );
		$this->assertEquals( 'dependency4', $data[1]['handle'] );
		$this->assertEquals( 'dependency5', $data[2]['handle'] );

		$keys = array( 'src', 'url', 'args', 'ver', 'extra', 'textdomain', 'translations_path', 'deps', '_links' );
		for ( $i = 0; $i < 3; $i ++ ) {
			foreach ( $keys as $key ) {
				$this->assertArrayHasKey( $key, $data[ $i ] );
			}
		}

		$this->assertCount( 0, $data[0]['deps'] );
		$this->assertCount( 1, $data[1]['deps'] );
		$this->assertEquals( array( 'dependency3' ), $data[1]['deps'] );
		$this->assertCount( 1, $data[2]['deps'] );
		$this->assertEquals( array( 'dependency4' ), $data[2]['deps'] );
	}

	/**
	 * Test whether script handle is excluded from its dependencies list.
	 */
	public function test_get_items_check_asset_deps() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/__experimental/scripts' );
		$request->set_query_params( array( 'dependency' => 'script-with-nested-deps' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$handles = wp_list_pluck( $data, 'handle' );

		$this->assertNotContains( 'script-with-nested-deps', $handles );
		$this->assertContains( 'dependency3', $handles );
		$this->assertContains( 'dependency4', $handles );
	}

	/**
	 * Test single script.
	 */
	public function test_get_item() {
		foreach ( array( self::$admin_id, self::$superadmin_id ) as $user_id ) {
			wp_set_current_user( $user_id );
			$request  = new WP_REST_Request( 'GET', '/__experimental/scripts/' . self::$script_handle );
			$response = rest_get_server()->dispatch( $request );
			$data     = $response->get_data();

			$this->assertEquals( self::$script_handle, $data['handle'] );
			$this->assertEquals( home_url( '/test.css' ), $data['src'] );
			$this->assertEquals( home_url( '/test.css' ), $data['url'] );
		}
	}

	/**
	 * Create item test.
	 */
	public function test_create_item() {
		// Not testable.
	}

	/**
	 * Update item test.
	 */
	public function test_update_item() {
		// Not testable.
	}

	/**
	 * Delete item test.
	 */
	public function test_delete_item() {
		// Not testable.
	}

	/**
	 * Test prepare item.
	 */
	public function test_prepare_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/__experimental/scripts/' . self::$script_handle );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'handle', $data );
		$this->assertArrayHasKey( 'src', $data );
		$this->assertArrayHasKey( 'url', $data );
		$this->assertArrayHasKey( 'args', $data );
		$this->assertArrayHasKey( 'ver', $data );
		$this->assertArrayHasKey( 'extra', $data );
		$this->assertArrayHasKey( 'textdomain', $data );
		$this->assertArrayHasKey( 'translations_path', $data );
		$this->assertArrayHasKey( 'deps', $data );
		$links = $response->get_links();
		$this->assertArrayHasKey( 'self', $links );
		$this->assertArrayHasKey( 'collection', $links );
		$this->assertArrayHasKey( 'deps', $links );
	}

	/**
	 * Test schema.
	 */
	public function test_get_item_schema() {
		$request  = new WP_REST_Request( 'OPTIONS', '/__experimental/scripts' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertArrayHasKey( 'schema', $data );
		$this->assertArrayHasKey( 'properties', $data['schema'] );
		$properties = $data['schema']['properties'];
		$this->assertEquals( 9, count( $properties ) );
		$this->assertArrayHasKey( 'handle', $properties );
		$this->assertArrayHasKey( 'src', $properties );
		$this->assertArrayHasKey( 'url', $properties );
		$this->assertArrayHasKey( 'args', $properties );
		$this->assertArrayHasKey( 'ver', $properties );
		$this->assertArrayHasKey( 'extra', $properties );
		$this->assertArrayHasKey( 'textdomain', $properties );
		$this->assertArrayHasKey( 'translations_path', $properties );
		$this->assertArrayHasKey( 'deps', $properties );
	}

	/**
	 * Test single block script.
	 *
	 * @dataProvider data_provider_all_users
	 *
	 * @param string $user_identifier User identifier.
	 */
	public function test_get_item_block_script( $user_identifier ) {
		wp_set_current_user( self::$users_map[ $user_identifier ] );
		$request  = new WP_REST_Request( 'GET', '/__experimental/scripts/block-script' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'block-script', $data['handle'] );
		$this->assertEquals( home_url( '/block-script.css' ), $data['src'] );
		$this->assertEquals( home_url( '/block-script.css' ), $data['url'] );
	}

	/**
	 * Test single block editor script.
	 *
	 * @dataProvider data_provider_item_block_editor
	 *
	 * @param string $user_identifier User identifier.
	 */
	public function test_get_item_block_editor_script( $user_identifier ) {
		wp_set_current_user( self::$users_map[ $user_identifier ] );
		$request  = new WP_REST_Request( 'GET', '/__experimental/scripts/block-editor-script' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'block-editor-script', $data['handle'] );
		$this->assertEquals( home_url( '/block-editor-script.css' ), $data['src'] );
		$this->assertEquals( home_url( '/block-editor-script.css' ), $data['url'] );
	}

	/**
	 * Test get items with no permission.
	 *
	 * @dataProvider data_provider_item_no_permission
	 *
	 * @param string $user_identifier User identifier.
	 */
	public function test_get_items_no_permission( $user_identifier ) {
		wp_set_current_user( self::$users_map[ $user_identifier ] );
		$request = new WP_REST_Request( 'GET', '/__experimental/scripts' );
		$request->set_query_params( array( 'dependency' => 'script1' ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertWPError( $response->as_error() );
		$this->assertEquals( 'rest_handle_cannot_view', $response->as_error()->get_error_code() );
	}

	/**
	 * Test single script with no permission.
	 *
	 * @dataProvider data_provider_item_no_permission
	 *
	 * @param string $user_identifier User identifier.
	 */
	public function test_get_item_no_permission( $user_identifier ) {
		wp_set_current_user( self::$users_map[ $user_identifier ] );
		$request  = new WP_REST_Request( 'GET', '/__experimental/scripts/' . self::$script_handle );
		$response = rest_get_server()->dispatch( $request );

		$this->assertWPError( $response->as_error() );
		$this->assertEquals( 'rest_handle_cannot_view', $response->as_error()->get_error_code() );
	}

	/**
	 * Test single block editor script with no permission.
	 *
	 * @dataProvider data_provider_item_block_editor_script_no_permission
	 *
	 * @param string $user_identifier User identifier.
	 */
	public function test_get_item_block_editor_script_no_permission( $user_identifier ) {
		wp_set_current_user( self::$users_map[ $user_identifier ] );
		$request  = new WP_REST_Request( 'GET', '/__experimental/scripts/block-editor-script' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertWPError( $response->as_error() );
		$this->assertEquals( 'rest_handle_cannot_view', $response->as_error()->get_error_code() );
	}

	/**
	 * Return no permission users ids.
	 *
	 * @return string[][]
	 */
	public function data_provider_item_block_editor_script_no_permission() {
		return array(
			array( 'guest' ),
			array( 'subscriber' ),
		);
	}

	/**
	 * Return no permission users ids.
	 *
	 * @return string[][]
	 */
	public function data_provider_item_no_permission() {
		return array(
			array( 'guest' ),
			array( 'subscriber' ),
			array( 'author' ),
			array( 'editor' ),
		);
	}

	/**
	 * Return users with permissions to read data.
	 *
	 * @return string[][]
	 */
	public function data_provider_item_block_editor() {
		return array(
			array( 'author' ),
			array( 'editor' ),
			array( 'admin' ),
			array( 'superadmin' ),
		);
	}

	/**
	 * Return all users.
	 *
	 * @return string[][]
	 */
	public function data_provider_all_users() {
		return array(
			array( 'guest' ),
			array( 'subscriber' ),
			array( 'author' ),
			array( 'editor' ),
			array( 'admin' ),
			array( 'superadmin' ),
		);
	}

}
