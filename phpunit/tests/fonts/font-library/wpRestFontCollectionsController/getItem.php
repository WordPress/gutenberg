<?php
/**
 * Test WP_REST_Font_Family_Controller
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_REST_Font_Collection_Controller
 */

class  Tests_Fonts_Font_Collection_Controller_get_item extends Tests_Fonts_Font_Collection_Controller {

	public function test_get_font_collection_with_included_data() {

		$collection_data = json_decode( $this->get_test_collection_data(), true );

		// Add a font collection with included data.
		$config = array(
			'slug'        => 'included-data-font-collection',
			'name'        => 'Included Data Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'data'        => $collection_data,
		);

		wp_register_font_collection( $config );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections/included-data-font-collection' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
		$this->assertArrayHasKey( 'data', $data, 'The response data does not have the key with the file data.' );
		$this->assertSame( 'ABeeZee', $data['data']['fontFamilies'][0]['name'], 'The response data does not have the expected data.' );
		$this->assertSame( 'ABeeZee', $data['data']['fontFamilies'][0]['fontFace'][0]['fontFamily'], 'The response data does not have the expected data.' );
	}


	public function test_get_font_collection_with_data_from_file() {

		$mock_file = wp_tempnam( 'one-collection-' );
		file_put_contents( $mock_file, $this->get_test_collection_data() );

		$config = array(
			'slug'        => 'file-data-font-collection',
			'name'        => 'File Data Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'src'         => $mock_file,
		);

		wp_register_font_collection( $config );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections/file-data-font-collection' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
		$this->assertArrayHasKey( 'data', $data, 'The response data does not have the key with the file data.' );
		$this->assertSame( 'ABeeZee', $data['data']['fontFamilies'][0]['name'], 'The response data does not have the expected data.' );
		$this->assertSame( 'ABeeZee', $data['data']['fontFamilies'][0]['fontFace'][0]['fontFamily'], 'The response data does not have the expected data.' );
	}

	public function test_get_font_collection_with_data_from_missing_file() {

		$config = array(
			'slug'        => 'missing-file-data-font-collection',
			'name'        => 'File Data Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'src'         => '/home/non-existing-file.json',
		);

		wp_register_font_collection( $config );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections/missing-file-data-font-collection' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 500, $response->get_status(), 'The response status is not 500.' );
	}

	public function test_get_font_collection_with_data_from_missing_url() {

		$config = array(
			'slug'        => 'missing-url-data-font-collection',
			'name'        => 'File Data Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'src'         => 'https://non-existing-url-1234x.com.ar/fake-path/missing-file.json',
		);

		wp_register_font_collection( $config );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections/missing-url-data-font-collection' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 500, $response->get_status(), 'The response status is not 500.' );
	}

	public function test_get_font_collection_with_data_from_url() {

		$config = array(
			'slug'        => 'url-data-font-collection',
			'name'        => 'File Data Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'src'         => 'https://wordpress.org/fonts/mock-font-collection.json',
		);

		wp_register_font_collection( $config );

		// Mock the wp_remote_request() function.
		// add_filter( 'pre_http_request', array( $this, 'mock_request' ), 10, 3 );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections/url-data-font-collection' );

		// Remove the mock to not affect other tests.
		// remove_filter( 'pre_http_request', array( $this, 'mock_request' ) );


		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
		$this->assertArrayHasKey( 'data', $data, 'The response data does not have the key with the file data.' );
		$this->assertSame( 'ABeeZee', $data['data']['fontFamilies'][0]['name'], 'The response data does not have the expected data.' );
		$this->assertSame( 'ABeeZee', $data['data']['fontFamilies'][0]['fontFace'][0]['fontFamily'], 'The response data does not have the expected data.' );
	}

}
