<?php
/**
 * Test WP_REST_Font_Library_Controller::get_font_collection().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_REST_Font_Library_Controller::get_font_collection
 */

class Tests_Fonts_WPRESTFontLibraryController_GetFontCollection extends WP_REST_Font_Library_Controller_UnitTestCase {

	/**
	 * Register mock collections.
	 */
	public function set_up() {
		parent::set_up();
		// Mock font collection data file.
		$mock_file = wp_tempnam( 'one-collection-' );
		file_put_contents( $mock_file, '{"this is mock data":true}' );
		// Mock the wp_remote_request() function.
		add_filter( 'pre_http_request', array( $this, 'mock_request' ), 10, 3 );

		$config_with_file = array(
			'id'          => 'one-collection',
			'name'        => 'One Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'src'         => $mock_file,
		);
		wp_register_font_collection( $config_with_file );

		$config_with_url = array(
			'id'          => 'collection-with-url',
			'name'        => 'Another Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'src'         => 'https://wordpress.org/fonts/mock-font-collection.json',
		);

		wp_register_font_collection( $config_with_url );

		$config_with_non_existing_file = array(
			'id'          => 'collection-with-non-existing-file',
			'name'        => 'Another Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'src'         => '/home/non-existing-file.json',
		);

		wp_register_font_collection( $config_with_non_existing_file );

		$config_with_non_existing_url = array(
			'id'          => 'collection-with-non-existing-url',
			'name'        => 'Another Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'src'         => 'https://non-existing-url-1234x.com.ar/fake-path/missing-file.json',
		);

		wp_register_font_collection( $config_with_non_existing_url );
	}

	public function mock_request( $preempt, $args, $url ) {
		// Check if it's the URL you want to mock.
		if ( 'https://wordpress.org/fonts/mock-font-collection.json' === $url ) {

			// Mock the response body.
			$mock_collection_data = array(
				'fontFamilies' => 'mock',
				'categories'   => 'mock',
			);

			return array(
				'body'     => json_encode( $mock_collection_data ),
				'response' => array(
					'code' => 200,
				),
			);
		}

		// For any other URL, return false which ensures the request is made as usual (or you can return other mock data).
		return false;
	}

	public function tear_down() {
		// Remove the mock to not affect other tests.
		remove_filter( 'pre_http_request', array( $this, 'mock_request' ) );

		parent::tear_down();
	}

	public function test_get_font_collection_from_file() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/fonts/collections/one-collection' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
		$this->assertArrayHasKey( 'data', $data, 'The response data does not have the key with the file data.' );
		$this->assertSame( array( 'this is mock data' => true ), $data['data'], 'The response data does not have the expected file data.' );
	}

	public function test_get_font_collection_from_url() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/fonts/collections/collection-with-url' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
		$this->assertArrayHasKey( 'data', $data, 'The response data does not have the key with the file data.' );
	}

	public function test_get_non_existing_collection_should_return_404() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/fonts/collections/non-existing-collection-id' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 404, $response->get_status() );
	}

	public function test_get_non_existing_file_should_return_500() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/fonts/collections/collection-with-non-existing-file' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 500, $response->get_status() );
	}

	public function test_get_non_existing_url_should_return_500() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/fonts/collections/collection-with-non-existing-url' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 500, $response->get_status() );
	}
}
