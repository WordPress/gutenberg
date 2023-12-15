<?php
/**
 * Test WP_REST_Font_Family_Controller:get_item()
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 * @group font-library-refactor
 *
 * @covers WP_REST_Font_Family_Controller:get_item()
 */

class Tests_Fonts_Font_Family_Controller_get_item extends WP_REST_Font_Library_Controller_UnitTestCase {

	/**
	 * Tests failure when getting a font family that does not exist
	 */
	public function test_get_font_family_not_exist() {

		$request    = new WP_REST_Request( 'GET', '/wp/v2/font-families/pickles' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 404, $response->get_status() );
	}

	/**
	 * Tests responses when sucessfully creating Font Families
	 *
	 * @dataProvider data_get_font_family
	 *
	 * @param array $font_family     Font families to install in theme.json format.
	 * @param array $expected_response Expected response data.
	 */
	public function test_get_font_family_success( $request, $expected_response, $files=null ) {

		$install_request    = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		if( array_key_exists( 'data', $request ) ){
			$install_request->set_param( 'data', $request['data'] );
		}
		if( $files ){
			$install_request->set_file_params( $files );
		}

		// Create the font family.
		$install_response = rest_get_server()->dispatch( $install_request );
		$install_data     = $install_response->get_data();
		$installed_font_id = $install_data['id'];

		// Get the font family.
		$verify_request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . $installed_font_id );
		$verify_response = rest_get_server()->dispatch( $verify_request );
		$response_data     = $verify_response->get_data();

		$this->assertSame( $expected_response['data']['slug'], $response_data['data']['slug'], 'The slug response did not match expected.' );
		$this->assertSame( $expected_response['data']['name'], $response_data['data']['name'], 'The name response did not match expected.' );
		$this->assertSame( $expected_response['data']['fontFamily'], $response_data['data']['fontFamily'], 'The font_family response did not match expected.' );
		$this->assertIsInt( $response_data['id'], 'The id response did not match expected.' );

		if( array_key_exists( 'data', $request ) && array_key_exists( 'fontFace', $request['data'] ) ){
			$this->assertSame( $expected_response['data']['fontFace'], $response_data['data']['fontFace'], 'The font_family response did not match expected.' );
		}
	}

	public function data_get_font_family() {
		// Use all the same successful tests for creating a font family
		$create_item_tests = new Tests_Fonts_Font_Family_Controller_create_item();
		return $create_item_tests->data_create_font_family();
	}
}
