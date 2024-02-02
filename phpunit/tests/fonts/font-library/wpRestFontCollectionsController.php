<?php
/**
 * Unit tests covering WP_REST_Font_Collections_Controller functionality.
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.5.0
 *
 * @group restapi
 * @group fonts
 * @group font-library
 *
 * @coversDefaultClass WP_REST_Font_Collections_Controller
 */
class Tests_REST_WpRestFontCollectionsController extends WP_Test_REST_Controller_Testcase {
	protected static $admin_id;
	protected static $editor_id;
	protected static $mock_file;


	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id  = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$editor_id = $factory->user->create(
			array(
				'role' => 'editor',
			)
		);
		$mock_file       = wp_tempnam( 'my-collection-data-' );
		file_put_contents( $mock_file, '{"slug": "mock-col-slug", "font_families": [ "mock" ], "categories": [ "mock" ] }' );

		wp_register_font_collection_from_json( $mock_file );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
		wp_unregister_font_collection( 'mock-col-slug' );
	}

	/**
	 * @covers WP_REST_Font_Collections_Controller::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertCount( 1, $routes['/wp/v2/font-collections'], 'Rest server has not the collections path initialized.' );
		$this->assertCount( 1, $routes['/wp/v2/font-collections/(?P<slug>[\/\w-]+)'], 'Rest server has not the collection path initialized.' );

		$this->assertArrayHasKey( 'GET', $routes['/wp/v2/font-collections'][0]['methods'], 'Rest server has not the GET method for collections intialized.' );
		$this->assertArrayHasKey( 'GET', $routes['/wp/v2/font-collections/(?P<slug>[\/\w-]+)'][0]['methods'], 'Rest server has not the GET method for collection intialized.' );
	}

	/**
	 * @covers WP_REST_Font_Collections_Controller::get_items
	 */
	public function test_get_items() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections' );
		$response = rest_get_server()->dispatch( $request );
		$content  = $response->get_data();
		$this->assertIsArray( $content );
		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * @covers WP_REST_Font_Collections_Controller::get_item
	 */
	public function test_get_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections/mock-col-slug' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status(), 'Response code is not 200' );

		$response_data = $response->get_data();
		$this->assertArrayHasKey( 'name', $response_data, 'Response data does not have the name key.' );
		$this->assertArrayHasKey( 'slug', $response_data, 'Response data does not have the slug key.' );
		$this->assertArrayHasKey( 'description', $response_data, 'Response data does not have the description key.' );
		$this->assertArrayHasKey( 'font_families', $response_data, 'Response data does not have the font_families key.' );
		$this->assertArrayHasKey( 'categories', $response_data, 'Response data does not have the categories key.' );

		$this->assertIsString( $response_data['name'], 'name is not a string.' );
		$this->assertIsString( $response_data['slug'], 'slug is not a string.' );
		$this->assertIsString( $response_data['description'], 'description is not a string.' );

		$this->assertIsArray( $response_data['font_families'], 'font_families is not an array.' );
		$this->assertIsArray( $response_data['categories'], 'categories is not an array.' );
	}

	/**
	 * @covers WP_REST_Font_Collections_Controller::get_item
	 */
	public function test_get_item_invalid_slug() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections/non-existing-collection' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'font_collection_not_found', $response, 404 );
	}

	/**
	 * @covers WP_REST_Font_Collections_Controller::get_item
	 */
	public function test_get_item_invalid_id_permission() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/font-collections/mock-col-slug' );

		wp_set_current_user( 0 );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 401, 'Response code should be 401 for non-authenticated users.' );

		wp_set_current_user( self::$editor_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 403, 'Response code should be 403 for users without the right permissions.' );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Controller does not use get_context_param().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// Controller does not use test_create_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// Controller does not use test_update_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// Controller does not use test_delete_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// Controller does not use test_prepare_item().
	}

	public function test_get_item_schema() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/font-collections' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'The response status should be 200.' );
		$properties = $data['schema']['properties'];
		$this->assertCount( 5, $properties, 'There should be 5 properties in the response data schema.' );
		$this->assertArrayHasKey( 'slug', $properties, 'The slug property should exist in the response data schema.' );
		$this->assertArrayHasKey( 'name', $properties, 'The name property should exist in the response data schema.' );
		$this->assertArrayHasKey( 'description', $properties, 'The description property should exist in the response data schema.' );
		$this->assertArrayHasKey( 'font_families', $properties, 'The slug font_families should exist in the response data schema.' );
		$this->assertArrayHasKey( 'categories', $properties, 'The categories property should exist in the response data schema.' );
	}
}
