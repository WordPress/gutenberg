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
	 * Register a mock collection.
	 */
	public static function wpSetupBeforeClass() {
		// Mock font collection data file.
		$mock_file = wp_tempnam( 'one-collection-' );
		file_put_contents( $mock_file, '{"this is mock data":true}' );

		// Add a font collection.
		$config = array(
			'id'             => 'one-collection',
			'name'           => 'One Font Collection',
			'description'    => 'Demo about how to a font collection to your WordPress Font Library.',
			'data_json_file' => $mock_file,
		);
		wp_register_font_collection( $config );
	}

	public function test_get_font_collection() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/fonts/collections/one-collection' );
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
}

