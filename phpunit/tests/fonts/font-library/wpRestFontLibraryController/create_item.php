<?php
/**
 * Test WP_REST_Font_Family_Controller:create_item()
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 * @group font-library-refactor
 *
 * @covers WP_REST_Font_Family_Controller:create_item()
 */

class Tests_Fonts_Font_Family_Controller_create_item extends WP_REST_Font_Library_Controller_UnitTestCase {

	/**
	 * Tests failure when fonfaces has improper inputs
	 *
	 * @dataProvider data_create_font_family_with_improper_inputs
	 *
	 * @param array $font_families Font families to install in theme.json format.
	 */
	public function test_create_font_family_errors( $request, $expected_response, $files=null ) {
		$install_request    = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		if( array_key_exists( 'data', $request ) ){
			$install_request->set_param( 'data', $request['data'] );
		}
		if( $files ){
			$install_request->set_file_params( $files );
		}

		$response = rest_get_server()->dispatch( $install_request );
		$this->assertSame( $expected_response['data']['status'], $response->get_status() );
		$this->assertSame( $expected_response['code'], $response->get_data()['code'], 'Error Response Unexpected' );
		$this->assertSame( $expected_response['message'], $response->get_data()['message'], 'Error Response Unexpected' );
	}

	/**
	 * Data provider for test_install_with_improper_inputs
	 */
	public function data_create_font_family_with_improper_inputs() {

		$temp_file_path1 = wp_tempnam( 'Piazzola1-' );
		file_put_contents( $temp_file_path1, 'Mocking file content' );

		return array(
			'no valid parameters'        => array(
				'request' => array(
					'apples' => 'bananas',
				),
				'expected_response' => array(
					'code'    => 'rest_missing_callback_param',
					'message' => __( 'Missing parameter(s): data', 'wp-font-library' ),
					'data'    => array(
						'status' => 400,
					),
				),
			),
			'missing slug'        => array(
				'request' => array(
					'data' => array(
						'name' => 'Name',
						'fontFamily' => 'Font Family',
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
			'missing name'        => array(
				'request' => array(
					'data' => array(
						'slug' => 'slug',
						'fontFamily' => 'Font Family',
					),
				),
				'expected_response' => array(
					'code'    => 'rest_invalid_param',
					'message' => __( 'Invalid parameter(s): data', 'wp-font-library' ),
					'data'    => array(
						'status' => 400,
					),
				),
			),
			'missing fontFamily'        => array(
				'request' => array(
					'data' => array(
						'slug' => 'slug',
						'name' => 'Name',
					),
				),
				'expected_response' => array(
					'code'    => 'rest_invalid_param',
					'message' => __( 'Invalid parameter(s): data', 'wp-font-library' ),
					'data'    => array(
						'status' => 400,
					),
				),
			),

			'fontface referencing uploaded file without uploaded files' => array(
				'request'	=> array(
					'data' => array(
						'slug' => 'slug',
						'name' => 'Name',
						'fontFamily' => 'Font Family',
						'fontFace' => array(
							array(
								'fontFamily' => 'Font Family',
								'fontStyle' => 'normal',
								'fontWeight' => '400',
								'uploadedFile' => 'files0',
							),
						),
					),
				),
				'expected_response' => array(
					'code'    => 'font_face_upload_file_missing',
					'message' => __( 'The font face assets was not provided.', 'wp-font-library' ),
					'data'    => array(
						'status' => 500,
					),
				),
			),

			'fontface referencing uploaded file without correct uploaded file' => array(
				'request'	=> array(
					'data' => array(
						'slug' => 'slug',
						'name' => 'Name',
						'fontFamily' => 'Font Family',
						'fontFace' => array(
							array(
								'fontFamily' => 'Font Family',
								'fontStyle' => 'normal',
								'fontWeight' => '400',
								'uploadedFile' => 'filesNotCorrectReference',
							),
						),
					),
				),
				'expected_response' => array(
					'code'    => 'font_face_upload_file_missing',
					'message' => __( 'The font face assets was not provided.', 'wp-font-library' ),
					'data'    => array(
						'status' => 500,
					),
				),
				'files' => array(
					'files0' => array(
						'name'     => 'piazzola1.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => $temp_file_path1,
						'error'    => 0,
						'size'     => 123,
					),
				),
			),
		);

	}

	/**
	 * Tests responses when sucessfully creating Font Families
	 *
	 * @dataProvider data_create_font_family
	 *
	 * @param array $font_family     Font families to install in theme.json format.
	 * @param array $expected_response Expected response data.
	 */
	public function test_create_font_family_success( $request, $expected_response, $files=null ) {

		$install_request    = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		if( array_key_exists( 'data', $request ) ){
			$install_request->set_param( 'data', $request['data'] );
		}
		if( $files ){
			$install_request->set_file_params( $files );
		}

		$response = rest_get_server()->dispatch( $install_request );
		$response_data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );


		$this->assertSame( $expected_response['data']['slug'], $response_data['data']['slug'], 'The slug response did not match expected.' );
		$this->assertSame( $expected_response['data']['name'], $response_data['data']['name'], 'The name response did not match expected.' );
		$this->assertSame( $expected_response['data']['fontFamily'], $response_data['data']['fontFamily'], 'The font_family response did not match expected.' );
		$this->assertIsInt( $response_data['id'], 'The id response did not match expected.' );

		if( array_key_exists( 'data', $request ) && array_key_exists( 'fontFace', $request['data'] ) ){
			$this->assertSame( $expected_response['data']['fontFace'], $response_data['data']['fontFace'], 'The font_family response did not match expected.' );
		}
	}

	/**
	 * Data provider for test_create_font_family_success
	 */
	public function data_create_font_family() {

		$temp_file_path1 = wp_tempnam( 'Piazzola1-' );
		copy( __DIR__ . '/../../../data/fonts/Merriweather.ttf', $temp_file_path1 );

		$temp_file_path2 = wp_tempnam( 'Monteserrat-' );
		copy( __DIR__ . '/../../../data/fonts/Merriweather.ttf', $temp_file_path2 );

		return array(
			'font family with no font faces' => array(
				'request' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
						'fontFamily' => 'Family',
					)
				),
				'expected_response' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
						'fontFamily' => 'Family',
					)
				),
			),

			'font family with a font face that needs to be wrapped in quotes' => array(
				'request' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
						'fontFamily' => 'Font Family, serif',
					)
				),
				'expected_response' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
						'fontFamily' => "'Font Family', serif",
					)
				),
			),

			'Font Family with Font Faces with hosted resources' => array(
				'request' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
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
					),
				),
				'expected_response' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
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
					),
				),
			),

			'Font Family with Font Faces with resources to download' => array(
				'request' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
						'fontFamily' => 'Family',
						'fontFace' => array(
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'normal',
								'fontWeight'      => '400',
								'preview'	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-normal.svg',
								'downloadFromUrl' => 'https://fonts.gstatic.com/s/abeezee/v22/esDR31xSG-6AGleN6tKukbcHCpE.ttf',
							),
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'italic',
								'fontWeight'      => '400',
								'preview' 	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-italic.svg',
								'downloadFromUrl' => 'https://fonts.gstatic.com/s/abeezee/v22/esDT31xSG-6AGleN2tCklZUCGpG-GQ.ttf',
							),
						),
					),
				),
				'expected_response' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
						'fontFamily' => 'Family',
						'fontFace' => array(
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'normal',
								'fontWeight'      => '400',
								'preview'	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-normal.svg',
								'src'             => 'http://localhost:8889/wp-content/fonts/slug_normal_400.ttf',
							),
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'italic',
								'fontWeight'      => '400',
								'preview' 	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-italic.svg',
								'src'             => 'http://localhost:8889/wp-content/fonts/slug_italic_400.ttf',
							),
						),
					),
				),
			),

			'Font Family with Font Faces with uploaded resources' => array(
				'request' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
						'fontFamily' => 'Family',
						'fontFace' => array(
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'normal',
								'fontWeight'      => '400',
								'uploadedFile'    => 'files0',
							),
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'italic',
								'fontWeight'      => '400',
								'uploadedFile'    => 'files1',
							),
						),
					),
				),
				'expected_response' => array(
					'data' => array(
						'slug'      => 'slug',
						'name'        => 'Name',
						'fontFamily' => 'Family',
						'fontFace' => array(
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'normal',
								'fontWeight'      => '400',
								'src'             => 'http://localhost:8889/wp-content/fonts/slug_normal_400.ttf',
							),
							array(
								'fontFamily'      => 'Family',
								'fontStyle'       => 'italic',
								'fontWeight'      => '400',
								'src'             => 'http://localhost:8889/wp-content/fonts/slug_italic_400.ttf',
							),
						),
					),
				),
				'files' => array(
					'files0' => array(
						'name'     => 'piazzola1.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => $temp_file_path1,
						'error'    => 0,
						'size'     => 123,
					),
					'files1' => array(
						'name'     => 'montserrat1.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => $temp_file_path2,
						'error'    => 0,
						'size'     => 123,
					),
				),
			),

		);
	}
}
