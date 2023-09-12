<?php
/**
 * Test WP_REST_Font_Library_Controller::get_font_collections().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_REST_Font_Library_Controller::get_font_collections
 */

class Tests_Fonts_WPRESTFontLibraryController_GetFontCollections extends WP_REST_Font_Library_Controller_UnitTestCase {

	public function test_get_font_collections_with_no_collection_registered() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/fonts/collections' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $response->get_data() );
	}

	public function test_get_font_collections() {
		// Mock font collection data file.
		$mock_file = wp_tempnam( 'my-collection-data-' );
		file_put_contents( $mock_file, '{"this is mock data":true}' );

		// Add a font collection.
		$config = array(
			'id'             => 'my-font-collection',
			'name'           => 'My Font Collection',
			'description'    => 'Demo about how to a font collection to your WordPress Font Library.',
			'data_json_file' => $mock_file,
		);
		wp_register_font_collection( $config );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/fonts/collections' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
		$this->assertCount( 1, $data, 'The response data is not an array with one element.' );
		$this->assertArrayHasKey( 'id', $data[0], 'The response data does not have the key with the collection ID.' );
		$this->assertArrayHasKey( 'name', $data[0], 'The response data does not have the key with the collection name.' );
	}
}

