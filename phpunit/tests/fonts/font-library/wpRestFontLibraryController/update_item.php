<?php
/**
 * Test WP_REST_Font_Family_Controller:update_item()
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 * @group font-library-refactor
 *
 * @covers WP_REST_Font_Family_Controller:update_item()
 */

class Tests_Fonts_Font_Family_Controller_update_item extends WP_REST_Font_Library_Controller_UnitTestCase {

	/**
	 * Tests failure when getting a font family that does not exist
	 */
	public function test_update_font_family_not_exist() {

		$request    = new WP_REST_Request( 'PUT', '/wp/v2/font-families/pickles' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 404, $response->get_status() );
	}

	/**
	 * Tests responses when sucessfully creating Font Families
	 *
	 * @dataProvider data_update_font_family_failure
	 *
	 * @param array $font_family     Font families to install in theme.json format.
	 * @param array $expected_response Expected response data.
	 */
	public function test_get_font_family_failure( $request, $update, $expected_response, $files=null ) {

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

		// Update the font family.
		$update_request  = new WP_REST_Request( 'PUT', '/wp/v2/font-families/' . $installed_font_id );
		if( array_key_exists( 'data', $update ) ){
			$update_request->set_param( 'data', $update['data'] );
		}
		if( $files ){
			$update_request->set_file_params( $files );
		}

		$response = rest_get_server()->dispatch( $update_request );

		$this->assertSame( $expected_response['data']['status'], $response->get_status() );
		$this->assertSame( $expected_response['code'], $response->get_data()['code'], 'Error Response Unexpected' );
		$this->assertSame( $expected_response['message'], $response->get_data()['message'], 'Error Response Unexpected' );

	}

	public function data_update_font_family_failure() {
		return array(
			'font family missing slug' => array(
				'request' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
						'fontFamily' => 'Family',
					)
				),
				'update' => array(
					'data' => array(
						'name'        => 'New Name',
						'fontFamily' => 'Family',
					)
				),
				'expected_response' => array(
					'code'    => 'rest_invalid_param',
					'message' => __( 'Invalid parameter(s): data', 'wp-font-library' ),
					'data'    => array(
						'status' => 400,
					),
				),
			),
		);
	}

	/**
	 * Tests responses when sucessfully creating Font Families
	 *
	 * @dataProvider data_update_font_family
	 *
	 * @param array $font_family     Font families to install in theme.json format.
	 * @param array $expected_response Expected response data.
	 */
	public function test_get_font_family_success( $request, $update, $expected_response, $files=null ) {

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

		// Update the font family.
		$update_request  = new WP_REST_Request( 'PUT', '/wp/v2/font-families/' . $installed_font_id );
		if( array_key_exists( 'data', $update ) ){
			$update_request->set_param( 'data', $update['data'] );
		}
		if( $files ){
			$update_request->set_file_params( $files );
		}

		$update_response = rest_get_server()->dispatch( $update_request );
		$response_data     = $update_response->get_data();


		$this->assertSame( $expected_response['data']['slug'], $response_data['data']['slug'], 'The slug response did not match expected.' );
		$this->assertSame( $expected_response['data']['name'], $response_data['data']['name'], 'The name response did not match expected.' );
		$this->assertSame( $expected_response['data']['fontFamily'], $response_data['data']['fontFamily'], 'The font_family response did not match expected.' );
		$this->assertIsInt( $response_data['id'], 'The id response did not match expected.' );

		if( array_key_exists( 'data', $request ) && array_key_exists( 'fontFace', $request['data'] ) ){
			$this->assertSame( $expected_response['data']['fontFace'], $response_data['data']['fontFace'], 'The font_family response did not match expected.' );
		}

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

	public function data_update_font_family() {
		return array(
			'font family change name' => array(
				'request' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
						'fontFamily' => 'Family',
					)
				),
				'update' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'New Name',
						'fontFamily' => 'Family',
					)
				),
				'expected_response' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'New Name',
						'fontFamily' => 'Family',
					)
				),
			),
			'Add Font Face to Font Family' => array(
				'request' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
						'fontFamily' => 'Family',
					)
				),
				'update' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'New Name',
						'fontFamily' => 'Family',
						'fontFace' => array(
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'normal',
								'fontWeight'      => '400',
								'preview'	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-normal.svg',
								'src'             => 'https://fonts.gstatic.com/s/abeezee/v22/esDR31xSG-6AGleN6tKukbcHCpE.ttf',
							),
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'italic',
								'fontWeight'      => '400',
								'preview' 	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-italic.svg',
								'src'             => 'https://fonts.gstatic.com/s/abeezee/v22/esDT31xSG-6AGleN2tCklZUCGpG-GQ.ttf',
							),
						),
					)
				),
				'expected_response' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'New Name',
						'fontFamily' => 'Family',
						'fontFace' => array(
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'normal',
								'fontWeight'      => '400',
								'preview'	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-normal.svg',
								'src'             => 'https://fonts.gstatic.com/s/abeezee/v22/esDR31xSG-6AGleN6tKukbcHCpE.ttf',
							),
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'italic',
								'fontWeight'      => '400',
								'preview' 	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-italic.svg',
								'src'             => 'https://fonts.gstatic.com/s/abeezee/v22/esDT31xSG-6AGleN2tCklZUCGpG-GQ.ttf',
							),
						),
					)
				),
			),
		);
	}
}
