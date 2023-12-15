<?php
/**
 * Test WP_REST_Font_Family_Controller:delete_item()
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 * @group font-library-refactor
 *
 * @covers WP_REST_Font_Family_Controller:delete_item()
 */

class Tests_Fonts_Font_Family_Controller_delete_item extends WP_REST_Font_Library_Controller_UnitTestCase {

	/**
	 * Tests failure when deleting a font family that does not exist
	 */
	public function test_delete_font_family_not_exist() {

		$request    = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/pickles' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 404, $response->get_status() );
	}

	/**
	 * Tests responses when sucessfully deleting Font Families
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

		//TODO: adding  . '?force=true' to the end doesn't work like it is supposed to.
		$delete_request  = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . $installed_font_id);
		$delete_response = rest_get_server()->dispatch( $delete_request );
		$delete_data     = $delete_response->get_data();

		$this->assertSame( 200, $delete_response->get_status(), 'The response status is not 200.' );
		$this->assertSame( $expected_response['data']['slug'], $delete_data['previous']['data']['slug'], 'The slug response did not match expected.' );
		$this->assertSame( $expected_response['data']['name'], $delete_data['previous']['data']['name'], 'The name response did not match expected.' );
		$this->assertSame( $expected_response['data']['fontFamily'], $delete_data['previous']['data']['fontFamily'], 'The font_family response did not match expected.' );
		$this->assertSame( $installed_font_id, $delete_data['previous']['id'], 'The id response did not match expected.' );
		$this->assertTrue( $delete_data['deleted'], 'The response did not flag deleted status as expected.' );

		$verify_request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . $installed_font_id );
		$verify_response = rest_get_server()->dispatch( $verify_request );

		$this->assertSame( 404, $verify_response->get_status(), 'The deleted resource can still be found.' );
	}

	public function data_get_font_family() {
		// Use all the same successful tests for creating a font family
		$create_item_tests = new Tests_Fonts_Font_Family_Controller_create_item();
		return $create_item_tests->data_create_font_family();
	}
}
