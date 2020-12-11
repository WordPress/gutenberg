<?php
/**
 * WP_REST_URL_Details_Controller tests.
 *
 * @package WordPress
 * @subpackage REST_API
 * @since x.x.0
 */

/**
 * Tests for WP_REST_URL_Details_Controller.
 *
 * @since x.x.0
 *
 * @covers WP_REST_URL_Details_Controller
 * @group url-details
 * @group restapi
 */
class WP_REST_URL_Details_Controller_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * Admin user ID.
	 *
	 * @since x.x.0
	 *
	 * @var int $subscriber_id
	 */
	protected static $admin_id;

	/**
	 * Subscriber user ID.
	 *
	 * @since x.x.0
	 *
	 * @var int $subscriber_id
	 */
	protected static $subscriber_id;


	protected static $route = '/__experimental/url-details';

	/**
	 * Create fake data before our tests run.
	 *
	 * @since x.x.0
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id      = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$subscriber_id = $factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$subscriber_id );
	}

	/**
	 * Setup.
	 */
	public function setUp() {
		parent::setUp();
		add_filter( 'pre_http_request', array( $this, 'mock_success_request_to_remote_url' ), 10, 3 );
	}

	/**
	 * Tear down.
	 */
	public function tearDown() {
		remove_filter( 'pre_http_request', array( $this, 'mock_success_request_to_remote_url' ), 10 );
		parent::tearDown();
	}

	public function mock_success_request_to_remote_url() {
		return array(
			'response'    => array( 'code' => 200 ),
			'headers'     => array(),
			'cookies'     => array(),
			'filename'    => null,
			'status_code' => 200,
			'success'     => 1,
			'body'        => file_get_contents( __DIR__ . '/fixtures/example-website.html' ),
		);
	}

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( static::$route, $routes );
	}

	public function test_context_param() {
	}

	public function test_get_items() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', static::$route );
		$request->set_query_params(
			array(
				'url' => 'https://examplewebsitedoesnotexist.org',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals(
			array(
				'title' => 'Example Website &mdash; - with encoded content.',
			),
			$data
		);
	}

	public function test_get_items_fails_for_user_with_insufficient_permissions() {
		wp_set_current_user( self::$subscriber_id );

		$request = new WP_REST_Request( 'GET', static::$route );
		$request->set_query_params(
			array(
				'url' => 'https://wordpress.org',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 403, $response->get_status() );

		$this->assertEquals(
			'rest_user_cannot_view',
			$data['code']
		);

		$this->assertContains(
			'you are not allowed to process remote urls',
			$data['message']
		);
	}


	public function provide_invalid_url_data() {
		return array(
			'empty_url'          => array(
				null,
				'',
			), // empty!
			'not_a_string'       => array(
				null,
				1234456,
			),
			'string_but_invalid' => array(
				null,
				'invalid.proto://wordpress.org',
			),
		);
	}


	public function test_get_items_fails_for_invalid_url() {
		$this->markTestSkipped( 'must be revisited.' );
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', static::$route );
		$request->set_query_params(
			array(
				'url' => $invalid_url,
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 400, $response->get_status() );

		$this->assertEquals(
			'rest_invalid_param',
			$data['code']
		);

		$this->assertContains(
			'Invalid parameter(s): url',
			$data['message']
		);
	}

	/**
	 * @dataProvider provide_invalid_url_data
	 */
	public function test_get_items_fails_for_url_which_returns_non_200_status_code() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', static::$route );
		$request->set_query_params(
			array(
				'url' => $invalid_url,
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 400, $response->get_status() );

		$this->assertEquals(
			'rest_invalid_param',
			$data['code']
		);

		$this->assertContains(
			'Invalid parameter(s): url',
			$data['message']
		);
	}



	public function test_get_item() {
	}

	public function test_create_item() {

	}

	public function test_update_item() {

	}

	public function test_delete_item() {

	}

	public function test_prepare_item() {

	}

	public function test_get_item_schema() {

	}
}
