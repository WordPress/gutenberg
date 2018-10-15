<?php
/**
 * Unit tests covering WP_REST_Themes_Controller functionality.
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi-themes
 * @group restapi
 */
class WP_REST_Themes_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * Subscriber user ID.
	 *
	 * @since 5.0.0
	 *
	 * @var int $subscriber_id
	 */
	protected static $subscriber_id;

	/**
	 * Contributor user ID.
	 *
	 * @since 5.0.0
	 *
	 * @var int $contributor_id
	 */
	protected static $contributor_id;

	/**
	 * The current theme object.
	 *
	 * @since 5.0.0
	 *
	 * @var WP_Theme $current_theme
	 */
	protected static $current_theme;

	/**
	 * The REST API route for the active theme.
	 *
	 * @since 5.0.0
	 *
	 * @var string $themes_route
	 */
	protected static $themes_route = '/wp/v2/themes';

	/**
	 * Performs a REST API request for the active theme.
	 *
	 * @since 5.0.0
	 *
	 * @param string $method Optional. Request method. Default GET.
	 * @return WP_REST_Response The request's response.
	 */
	protected function perform_active_theme_request( $method = 'GET' ) {
		$request = new WP_REST_Request( $method, self::$themes_route );
		$request->set_param( 'status', 'active' );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Check that common properties are included in a response.
	 *
	 * @since 5.0.0
	 *
	 * @param WP_REST_Response $response Current REST API response.
	 */
	protected function check_get_theme_response( $response ) {
		if ( $response instanceof WP_REST_Response ) {
			$headers  = $response->get_headers();
			$response = $response->get_data();
		} else {
			$headers = array();
		}

		$this->assertArrayHasKey( 'X-WP-Total', $headers );
		$this->assertEquals( 1, $headers['X-WP-Total'] );
		$this->assertArrayHasKey( 'X-WP-TotalPages', $headers );
		$this->assertEquals( 1, $headers['X-WP-TotalPages'] );
	}

	/**
	 * Set up class test fixtures.
	 *
	 * @since 5.0.0
	 *
	 * @param WP_UnitTest_Factory $factory WordPress unit test factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$subscriber_id  = $factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);
		self::$contributor_id = $factory->user->create(
			array(
				'role' => 'contributor',
			)
		);
		self::$current_theme  = wp_get_theme();

		wp_set_current_user( self::$contributor_id );
	}

	/**
	 * Clean up test fixtures.
	 *
	 * @since 5.0.0
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$subscriber_id );
		self::delete_user( self::$contributor_id );
	}

	/**
	 * Set up each test method.
	 *
	 * @since 5.0.0
	 */
	public function setUp() {
		parent::setUp();

		wp_set_current_user( self::$contributor_id );
	}

	/**
	 * Theme routes should be registered correctly.
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( self::$themes_route, $routes );
	}

	/**
	 * Test retrieving a collection of themes.
	 */
	public function test_get_items() {
		$response = self::perform_active_theme_request();

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->check_get_theme_response( $response );
		$fields = array(
			'theme_supports',
		);
		$this->assertEqualSets( $fields, array_keys( $data[0] ) );
	}

	/**
	 * An error should be returned when the user does not have the edit_posts capability.
	 */
	public function test_get_items_no_permission() {
		wp_set_current_user( self::$subscriber_id );
		$response = self::perform_active_theme_request();
		$this->assertErrorResponse( 'rest_user_cannot_view', $response, 403 );
	}

	/**
	 * Test an item is prepared for the response.
	 */
	public function test_prepare_item() {
		$response = self::perform_active_theme_request();
		$this->assertEquals( 200, $response->get_status() );
		$this->check_get_theme_response( $response );
	}

	/**
	 * Verify the theme schema.
	 */
	public function test_get_item_schema() {
		$response   = self::perform_active_theme_request( 'OPTIONS' );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertEquals( 1, count( $properties ) );
		$this->assertArrayHasKey( 'theme_supports', $properties );

		$this->assertEquals( 2, count( $properties['theme_supports']['properties'] ) );
		$this->assertArrayHasKey( 'formats', $properties['theme_supports']['properties'] );
		$this->assertArrayHasKey( 'post-thumbnails', $properties['theme_supports']['properties'] );
	}

	/**
	 * Should include relevant data in the 'theme_supports' key.
	 */
	public function test_theme_supports_formats() {
		remove_theme_support( 'post-formats' );
		$response = self::perform_active_theme_request();
		$result   = $response->get_data();
		$this->assertTrue( isset( $result[0]['theme_supports'] ) );
		$this->assertTrue( isset( $result[0]['theme_supports']['formats'] ) );
		$this->assertSame( array( 'standard' ), $result[0]['theme_supports']['formats'] );
	}

	/**
	 * Test when a theme only supports some post formats.
	 */
	public function test_theme_supports_formats_non_default() {
		add_theme_support( 'post-formats', array( 'aside', 'video' ) );
		$response = self::perform_active_theme_request();
		$result   = $response->get_data();
		$this->assertTrue( isset( $result[0]['theme_supports'] ) );
		$this->assertTrue( isset( $result[0]['theme_supports']['formats'] ) );
		$this->assertSame( array( 'standard', 'aside', 'video' ), $result[0]['theme_supports']['formats'] );
	}

	/**
	 * Test when a theme does not support post thumbnails.
	 */
	public function test_theme_supports_post_thumbnails_false() {
		remove_theme_support( 'post-thumbnails' );
		$response = self::perform_active_theme_request();

		$result = $response->get_data();
		$this->assertTrue( isset( $result[0]['theme_supports'] ) );
		$this->assertTrue( isset( $result[0]['theme_supports']['post-thumbnails'] ) );
		$this->assertFalse( $result[0]['theme_supports']['post-thumbnails'] );
	}

	/**
	 * Test when a theme supports all post thumbnails.
	 */
	public function test_theme_supports_post_thumbnails_true() {
		remove_theme_support( 'post-thumbnails' );
		add_theme_support( 'post-thumbnails' );
		$response = self::perform_active_theme_request();
		$result   = $response->get_data();
		$this->assertTrue( isset( $result[0]['theme_supports'] ) );
		$this->assertTrue( $result[0]['theme_supports']['post-thumbnails'] );
	}

	/**
	 * Test when a theme only supports post thumbnails for certain post types.
	 */
	public function test_theme_supports_post_thumbnails_array() {
		remove_theme_support( 'post-thumbnails' );
		add_theme_support( 'post-thumbnails', array( 'post' ) );
		$response = self::perform_active_theme_request();
		$result   = $response->get_data();
		$this->assertTrue( isset( $result[0]['theme_supports'] ) );
		$this->assertEquals( array( 'post' ), $result[0]['theme_supports']['post-thumbnails'] );
	}

	/**
	 * It should be possible to register custom fields to the endpoint.
	 */
	public function test_get_additional_field_registration() {
		$schema = array(
			'type'        => 'integer',
			'description' => 'Some integer of mine',
			'enum'        => array( 1, 2, 3, 4 ),
		);

		register_rest_field(
			'theme',
			'my_custom_int',
			array(
				'schema'       => $schema,
				'get_callback' => array( $this, 'additional_field_get_callback' ),
			)
		);

		$response = self::perform_active_theme_request( 'OPTIONS' );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'my_custom_int', $data['schema']['properties'] );
		$this->assertEquals( $schema, $data['schema']['properties']['my_custom_int'] );

		$response = self::perform_active_theme_request( 'GET' );
		$data     = $response->get_data();
		$this->assertArrayHasKey( 'my_custom_int', $data[0] );
		$this->assertSame( 2, $data[0]['my_custom_int'] );

		global $wp_rest_additional_fields;
		$wp_rest_additional_fields = array();
	}

	/**
	 * Return a value for the custom field.
	 *
	 * @since 5.0.0
	 *
	 * @param array $theme Theme data array.
	 * @return int Additional field value.
	 */
	public function additional_field_get_callback( $theme ) {
		return 2;
	}

	/**
	 * The create_item() method does not exist for themes.
	 */
	public function test_create_item() {}

	/**
	 * The update_item() method does not exist for themes.
	 */
	public function test_update_item() {}

	/**
	 * The get_item() method does not exist for themes.
	 */
	public function test_get_item() {}

	/**
	 * The delete_item() method does not exist for themes.
	 */
	public function test_delete_item() {}

	/**
	 * Context is not supported for themes.
	 */
	public function test_context_param() {}
}
