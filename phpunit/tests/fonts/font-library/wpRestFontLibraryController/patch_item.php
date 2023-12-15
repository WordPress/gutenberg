<?php
/**
 * Test WP_REST_Font_Family_Controller:patch_item()
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 * @group font-library-refactor
 *
 * @covers WP_REST_Font_Family_Controller:patch_item()
 */

class Tests_Fonts_Font_Family_Controller_patch_item extends WP_REST_Font_Library_Controller_UnitTestCase {

	/**
	 * Tests responses when sucessfully patching Font Families
	 *
	 * @dataProvider data_patch_font_family
	 *
	 * @param array $font_family     Font families to install in theme.json format.
	 * @param array $expected_response Expected response data.
	 */
	public function test_patch_font_family_success( $request, $update, $expected_response, $files=null ) {

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

		// Patch the font family.
		$update_request  = new WP_REST_Request( 'PATCH', '/wp/v2/font-families/' . $installed_font_id );
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

	public function data_patch_font_family() {
		return array(
			// 'font family change name' => array(
			// 	'request' => array(
			// 		'data' => array(
			// 			'slug'      => 'slug',
			// 			'name'        => 'Name',
			// 			'fontFamily' => 'Family',
			// 		)
			// 	),
			// 	'update' => array(
			// 		'data' => array(
			// 			'name'        => 'New Name',
			// 		)
			// 	),
			// 	'expected_response' => array(
			// 		'data' => array(
			// 			'slug'      => 'slug',
			// 			'name'        => 'New Name',
			// 			'fontFamily' => 'Family',
			// 		)
			// 	),
			// ),
			// 'Add Font Faces to Font Family' => array(
			// 	'request' => array(
			// 		'data' => array(
			// 			'slug'      => 'slug',
			// 			'name'        => 'Name',
			// 			'fontFamily' => 'Family',
			// 		)
			// 	),
			// 	'update' => array(
			// 		'data' => array(
			// 			'fontFace' => array(
			// 				array(
			// 					'fontFamily'      => 'Family',
			// 					'fontStyle'       => 'normal',
			// 					'fontWeight'      => '400',
			// 					'preview'	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-normal.svg',
			// 					'src'             => 'https://fonts.gstatic.com/s/abeezee/v22/esDR31xSG-6AGleN6tKukbcHCpE.ttf',
			// 				),
			// 				array(
			// 					'fontFamily'      => 'Family',
			// 					'fontStyle'       => 'italic',
			// 					'fontWeight'      => '400',
			// 					'preview' 	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-italic.svg',
			// 					'src'             => 'https://fonts.gstatic.com/s/abeezee/v22/esDT31xSG-6AGleN2tCklZUCGpG-GQ.ttf',
			// 				),
			// 			),
			// 		)
			// 	),
			// 	'expected_response' => array(
			// 		'data' => array(
			// 			'slug'      => 'slug',
			// 			'name'        => 'Name',
			// 			'fontFamily' => 'Family',
			// 			'fontFace' => array(
			// 				array(
			// 					'fontFamily'      => 'Family',
			// 					'fontStyle'       => 'normal',
			// 					'fontWeight'      => '400',
			// 					'preview'	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-normal.svg',
			// 					'src'             => 'https://fonts.gstatic.com/s/abeezee/v22/esDR31xSG-6AGleN6tKukbcHCpE.ttf',
			// 				),
			// 				array(
			// 					'fontFamily'      => 'Family',
			// 					'fontStyle'       => 'italic',
			// 					'fontWeight'      => '400',
			// 					'preview' 	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-italic.svg',
			// 					'src'             => 'https://fonts.gstatic.com/s/abeezee/v22/esDT31xSG-6AGleN2tCklZUCGpG-GQ.ttf',
			// 				),
			// 			),
			// 		)
			// 	),
			// ),
			'Add a Font Face to a Font Family without removing existing' => array(
				'request' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
						'fontFamily' => 'Family',
						'fontFace' => array(
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
				'update' => array(
					'data' => array(
						'fontFace' => array(
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'normal',
								'fontWeight'      => '400',
								'preview'	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-normal.svg',
								'src'             => 'https://fonts.gstatic.com/s/abeezee/v22/esDR31xSG-6AGleN6tKukbcHCpE.ttf',
							),
						),
					)
				),
				'expected_response' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
						'fontFamily' => 'Family',
						'fontFace' => array(
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'italic',
								'fontWeight'      => '400',
								'preview' 	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-italic.svg',
								'src'             => 'https://fonts.gstatic.com/s/abeezee/v22/esDT31xSG-6AGleN2tCklZUCGpG-GQ.ttf',
							),
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'normal',
								'fontWeight'      => '400',
								'preview'	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-normal.svg',
								'src'             => 'https://fonts.gstatic.com/s/abeezee/v22/esDR31xSG-6AGleN6tKukbcHCpE.ttf',
							),
						),
					)
				),
			),
		);
	}
}
