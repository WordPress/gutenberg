<?php

/**
 * Test WP_REST_Font_Families_Controller::create_item().
 *
 * @package WordPress
 * @subpackage Fonts
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_REST_Font_Families_Controller::create_item()
 */
class WP_Test_REST_Font_Families_Controller_CreateItem extends WP_Test_REST_Font_Families_Controller_UnitTestCase {

	/**
	 *
	 * @dataProvider data_create_item
	 *
	 * @param array $font_family       Font families to install in theme.json format.
	 * @param array $files             Font files to install.
	 * @param array $expected_response Expected response data.
	 */
	public function test_create_item( $font_family, $files, $expected_response ) {
		$create_item_request = new WP_REST_Request( 'POST', '/wp/v2/font-families' );

		$create_item_request->set_param( 'slug', $font_family['slug'] );
		$create_item_request->set_param( 'fontFamily', $font_family['fontFamily'] );
		$create_item_request->set_param( 'name', $font_family['name'] );
		if ( ! empty( $font_family['fontFace'] ) ) {
			$create_item_request->set_param( 'fontFace', json_encode( $font_family['fontFace'] ) );
		}
		$create_item_request->set_file_params( $files );
		$response       = rest_get_server()->dispatch( $create_item_request );
		$installed_font = $response->get_data();
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );

		if ( isset( $installed_font['fontFace'] ) || isset( $expected_response['fontFace'] ) ) {
			for ( $face_index = 0; $face_index < count( $installed_font['fontFace'] ); $face_index++ ) {
				// Checks that the font asset were created correctly.
				if ( isset( $installed_font['fontFace'][ $face_index ]['src'] ) ) {
					$this->assertStringEndsWith( $expected_response['fontFace'][ $face_index ]['src'], $installed_font['fontFace'][ $face_index ]['src'], 'The src of the fonts were not updated as expected.' );
				}
				// Removes the src from the response to compare the rest of the data.
				unset( $installed_font['fontFace'][ $face_index ]['src'] );
				unset( $expected_response['fontFace'][ $face_index ]['src'] );
				unset( $installed_font['fontFace'][ $face_index ]['uploadedFile'] );
			}
		}

		// Compares if the rest of the data is the same.
		$this->assertEquals( $expected_response, $installed_font, 'The endpoint answer is not as expected.' );
	}

	/**
	 * Data provider for test_install_fonts
	 */
	public function data_create_item() {
		$temp_file_path1 = wp_tempnam( 'Piazzola1-' );
		copy( path_join( GUTENBERG_DIR_TESTDATA, 'fonts/Merriweather.ttf' ), $temp_file_path1 );

		return array(

			'google_fonts_to_download'      => array(
				'font_family'       => array(
					'fontFamily' => 'Piazzolla',
					'slug'       => 'piazzolla',
					'name'       => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily'      => 'Piazzolla',
							'fontStyle'       => 'normal',
							'fontWeight'      => '400',
							'src'             => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf',
							'downloadFromUrl' => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf',
						),
					),
				),
				'files'             => array(),
				'expected_response' => array(
					'fontFamily' => 'Piazzolla',
					'slug'       => 'piazzolla',
					'name'       => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'normal',
							'fontWeight' => '400',
							'src'        => '/wp-content/fonts/piazzolla_normal_400.ttf',
						),
					),
				),
			),

			'google_fonts_to_use_as_is'     => array(
				'font_family'       => array(
					'fontFamily' => 'Piazzolla',
					'slug'       => 'piazzolla',
					'name'       => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'normal',
							'fontWeight' => '400',
							'src'        => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf',
						),
					),
				),
				'files'             => array(),
				'expected_response' => array(
					'fontFamily' => 'Piazzolla',
					'slug'       => 'piazzolla',
					'name'       => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'normal',
							'fontWeight' => '400',
							'src'        => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf',
						),
					),
				),
			),

			'fonts_without_font_faces'      => array(
				'font_family'       => array(
					'fontFamily' => 'Arial',
					'slug'       => 'arial',
					'name'       => 'Arial',
				),
				'files'             => array(),
				'expected_response' => array(
					'fontFamily' => 'Arial',
					'slug'       => 'arial',
					'name'       => 'Arial',
				),
			),

			'fonts_with_local_fonts_assets' => array(
				'font_family'       => array(
					'fontFamily' => 'Piazzolla',
					'slug'       => 'piazzolla',
					'name'       => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily'   => 'Piazzolla',
							'fontStyle'    => 'normal',
							'fontWeight'   => '400',
							'uploadedFile' => 'files0',
						),
					),
				),
				'files'             => array(
					'files0' => array(
						'name'     => 'piazzola1.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => $temp_file_path1,
						'error'    => 0,
						'size'     => 123,
					),
				),
				'expected_response' => array(
					'fontFamily' => 'Piazzolla',
					'slug'       => 'piazzolla',
					'name'       => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'normal',
							'fontWeight' => '400',
							'src'        => '/wp-content/fonts/piazzolla_normal_400.ttf',
						),
					),
				),
			),
		);
	}

	/**
	 * Tests failure when fontFaces has improper inputs
	 *
	 * @dataProvider data_create_item_with_improper_inputs
	 *
	 * @param array $font_family Font families to install in theme.json format.
	 * @param array $files         Font files to install.
	 */
	public function test_create_item_with_improper_inputs( $font_family, $files = array() ) {
		$create_item_request = new WP_REST_Request( 'POST', '/wp/v2/font-families' );

		if ( isset( $font_family['slug'] ) ) {
			$create_item_request->set_param( 'slug', $font_family['slug'] );
		}
		if ( isset( $font_family['fontFamily'] ) ) {
			$create_item_request->set_param( 'fontFamily', $font_family['fontFamily'] );
		}
		if ( isset( $font_family['name'] ) ) {
			$create_item_request->set_param( 'name', $font_family['name'] );
		}
		if ( isset( $font_family['fontFace'] ) ) {
			$create_item_request->set_param( 'fontFace', json_encode( $font_family['fontFace'] ) );
		}
		$create_item_request->set_file_params( $files );

		$response = rest_get_server()->dispatch( $create_item_request );
		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * Data provider for test_install_with_improper_inputs
	 */
	public function data_create_item_with_improper_inputs() {

		$temp_file_path1 = wp_tempnam( 'Piazzola1-' );
		copy( path_join( DIR_TESTDATA, 'fonts/Merriweather.ttf' ), $temp_file_path1 );

		return array(
			'empty array'                      => array(
				'font_family' => array(),
			),

			'without slug'                     => array(
				'font_family' => array(
					'fontFamily' => 'Piazzolla',
					'name'       => 'Piazzolla',
				),
			),

			'with improper font face property' => array(
				'font_family' => array(
					'fontFamily' => 'Piazzolla',
					'name'       => 'Piazzolla',
					'slug'       => 'piazzolla',
					'fontFace'   => 'This is not an array',
				),
			),

			'with empty font face property'    => array(
				'font_family' => array(
					'fontFamily' => 'Piazzolla',
					'name'       => 'Piazzolla',
					'slug'       => 'piazzolla',
					'fontFace'   => array(),
				),
			),

			'fontface referencing uploaded file without uploaded files' => array(
				'font_family' => array(
					'fontFamily' => 'Piazzolla',
					'name'       => 'Piazzolla',
					'slug'       => 'piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily'   => 'Piazzolla',
							'fontStyle'    => 'normal',
							'fontWeight'   => '400',
							'uploadedFile' => 'files0',
						),
					),
				),
				'files'       => array(),
			),

			'fontface referencing uploaded file without uploaded files' => array(
				'font_family' => array(
					'fontFamily' => 'Piazzolla',
					'name'       => 'Piazzolla',
					'slug'       => 'piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily'   => 'Piazzolla',
							'fontStyle'    => 'normal',
							'fontWeight'   => '400',
							'uploadedFile' => 'files666',
						),
					),
				),
				'files'       => array(
					'files0' => array(
						'name'     => 'piazzola1.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => $temp_file_path1,
						'error'    => 0,
						'size'     => 123,
					),
				),
			),

			'fontface with incompatible properties (downloadFromUrl and uploadedFile together)' => array(
				'font_family' => array(
					'fontFamily' => 'Piazzolla',
					'slug'       => 'piazzolla',
					'name'       => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily'      => 'Piazzolla',
							'fontStyle'       => 'normal',
							'fontWeight'      => '400',
							'src'             => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf',
							'downloadFromUrl' => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf',
							'uploadedFile'    => 'files0',
						),
					),
				),
			),
		);
	}
}
