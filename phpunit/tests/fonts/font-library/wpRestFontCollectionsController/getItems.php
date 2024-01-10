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

class  Tests_Fonts_Font_Collection_Controller_get_items extends Tests_Fonts_Font_Collection_Controller {

	/**
	 * Test that the endpoint returns an empty array when no collections are registered.
	 */
	public function test_get_font_collections_with_no_collection_registered() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $response->get_data() );
	}

	/**
	 * Test that the endpoint returns a single collection when a single collection is registered.
	 */
	public function test_get_font_collections_with_a_single_simple_collection() {

		// Add a font collection with included data.
		$config = array(
			'slug'        => 'my-font-collection',
			'name'        => 'My Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'data'        => array('this is mock data'=>true),
		);

		wp_register_font_collection( $config );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
		$this->assertCount( 1, $data, 'The response data is not an array with one element.' );
		$this->assertArrayHasKey( 'slug', $data[0], 'The response data does not have the key with the collection ID.' );
		$this->assertArrayHasKey( 'name', $data[0], 'The response data does not have the key with the collection name.' );
	}

}
