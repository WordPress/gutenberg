<?php
/**
 * Test WP_REST_Font_Library_Controller::install_fonts().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_REST_Font_Library_Controller::install_fonts
 */

class Tests_Fonts_WPRESTFontLibraryController_InstallFonts extends WP_REST_Font_Library_Controller_UnitTestCase {

	/**
	 *
	 * @dataProvider data_install_fonts
	 *
	 * @param array $font_families     Font families to install in theme.json format.
	 * @param array $files             Font files to install.
	 * @param array $expected_response Expected response data.
	 */
	public function test_install_fonts( $font_families, $files, $expected_response ) {
		$install_request    = new WP_REST_Request( 'POST', '/wp/v2/fonts' );
		$font_families_json = json_encode( $font_families );
		$install_request->set_param( 'fontFamilies', $font_families_json );
		$install_request->set_file_params( $files );
		$response = rest_get_server()->dispatch( $install_request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
		$this->assertCount( count( $expected_response ), $data, 'Not all the font families were installed correctly.' );

		// Checks that the font families were installed correctly.
		for ( $family_index = 0; $family_index < count( $data ); $family_index++ ) {
			$installed_font = $data[ $family_index ];
			$expected_font  = $expected_response[ $family_index ];

			if ( isset( $installed_font['fontFace'] ) || isset( $expected_font['fontFace'] ) ) {
				for ( $face_index = 0; $face_index < count( $installed_font['fontFace'] ); $face_index++ ) {
					// Checks that the font asset were created correctly.
					$this->assertStringEndsWith( $expected_font['fontFace'][ $face_index ]['src'], $installed_font['fontFace'][ $face_index ]['src'], 'The src of the fonts were not updated as expected.' );
					// Removes the src from the response to compare the rest of the data.
					unset( $installed_font['fontFace'][ $face_index ]['src'] );
					unset( $expected_font['fontFace'][ $face_index ]['src'] );
				}
			}

			// Compares if the rest of the data is the same.
			$this->assertEquals( $expected_font, $installed_font, 'The endpoint answer is not as expected.' );
		}

	}

	/**
	 * Data provider for test_install_fonts
	 */
	public function data_install_fonts() {

		$temp_file_path1 = wp_tempnam( 'Piazzola1-' );
		file_put_contents( $temp_file_path1, 'Mocking file content' );
		$temp_file_path2 = wp_tempnam( 'Monteserrat-' );
		file_put_contents( $temp_file_path2, 'Mocking file content' );

		return array(

			'google_fonts_to_download'      => array(
				'font_families'     => array(
					array(
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
					array(
						'fontFamily' => 'Montserrat',
						'slug'       => 'montserrat',
						'name'       => 'Montserrat',
						'fontFace'   => array(
							array(
								'fontFamily'      => 'Montserrat',
								'fontStyle'       => 'normal',
								'fontWeight'      => '100',
								'src'             => 'http://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Uw-Y3tcoqK5.ttf',
								'downloadFromUrl' => 'http://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Uw-Y3tcoqK5.ttf',
							),
						),
					),
				),
				'files'             => array(),
				'expected_response' => array(
					array(
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
					array(
						'fontFamily' => 'Montserrat',
						'slug'       => 'montserrat',
						'name'       => 'Montserrat',
						'fontFace'   => array(
							array(
								'fontFamily' => 'Montserrat',
								'fontStyle'  => 'normal',
								'fontWeight' => '100',
								'src'        => '/wp-content/fonts/montserrat_normal_100.ttf',
							),
						),
					),
				),
			),

			'google_fonts_to_use_as_is'     => array(
				'font_families'     => array(
					array(
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
					array(
						'fontFamily' => 'Montserrat',
						'slug'       => 'montserrat',
						'name'       => 'Montserrat',
						'fontFace'   => array(
							array(
								'fontFamily' => 'Montserrat',
								'fontStyle'  => 'normal',
								'fontWeight' => '100',
								'src'        => 'http://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Uw-Y3tcoqK5.ttf',
							),
						),
					),
				),
				'files'             => array(),
				'expected_response' => array(
					array(
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
					array(
						'fontFamily' => 'Montserrat',
						'slug'       => 'montserrat',
						'name'       => 'Montserrat',
						'fontFace'   => array(
							array(
								'fontFamily' => 'Montserrat',
								'fontStyle'  => 'normal',
								'fontWeight' => '100',
								'src'        => 'http://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Uw-Y3tcoqK5.ttf',

							),
						),
					),
				),
			),

			'fonts_without_font_faces'      => array(
				'font_families'     => array(
					array(
						'fontFamily' => 'Arial',
						'slug'       => 'arial',
						'name'       => 'Arial',
					),
				),
				'files'             => array(),
				'expected_response' => array(
					array(
						'fontFamily' => 'Arial',
						'slug'       => 'arial',
						'name'       => 'Arial',
					),
				),
			),

			'fonts_with_local_fonts_assets' => array(
				'font_families'     => array(
					array(
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
					array(
						'fontFamily' => 'Montserrat',
						'slug'       => 'montserrat',
						'name'       => 'Montserrat',
						'fontFace'   => array(
							array(
								'fontFamily'   => 'Montserrat',
								'fontStyle'    => 'normal',
								'fontWeight'   => '100',
								'uploadedFile' => 'files1',
							),
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
					'files1' => array(
						'name'     => 'montserrat1.ttf',
						'type'     => 'font/ttf',
						'tmp_name' => $temp_file_path2,
						'error'    => 0,
						'size'     => 123,
					),
				),
				'expected_response' => array(
					array(
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
					array(
						'fontFamily' => 'Montserrat',
						'slug'       => 'montserrat',
						'name'       => 'Montserrat',
						'fontFace'   => array(
							array(
								'fontFamily' => 'Montserrat',
								'fontStyle'  => 'normal',
								'fontWeight' => '100',
								'src'        => '/wp-content/fonts/montserrat_normal_100.ttf',
							),
						),
					),
				),
			),
		);
	}

	/**
	 * Tests failure when fonfaces has improper inputs
	 *
	 * @dataProvider data_install_with_improper_inputs
	 *
	 * @param array $font_families Font families to install in theme.json format.
	 * @param array $files         Font files to install.
	 */
	public function test_install_with_improper_inputs( $font_families, $files = array() ) {
		$install_request    = new WP_REST_Request( 'POST', '/wp/v2/fonts' );
		$font_families_json = json_encode( $font_families );
		$install_request->set_param( 'fontFamilies', $font_families_json );
		$install_request->set_file_params( $files );

		$response = rest_get_server()->dispatch( $install_request );
		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * Data provider for test_install_with_improper_inputs
	 */
	public function data_install_with_improper_inputs() {
		$temp_file_path1 = wp_tempnam( 'Piazzola1-' );
		file_put_contents( $temp_file_path1, 'Mocking file content' );

		return array(
			'not a font families array'        => array(
				'font_families' => 'This is not an array',
			),

			'empty array'                      => array(
				'font_families' => array(),
			),

			'without slug'                     => array(
				'font_families' => array(
					array(
						'fontFamily' => 'Piazzolla',
						'name'       => 'Piazzolla',
					),
				),
			),

			'with improper font face property' => array(
				'font_families' => array(
					array(
						'fontFamily' => 'Piazzolla',
						'name'       => 'Piazzolla',
						'slug'       => 'piazzolla',
						'fontFace'   => 'This is not an array',
					),
				),
			),

			'with empty font face property'    => array(
				'font_families' => array(
					array(
						'fontFamily' => 'Piazzolla',
						'name'       => 'Piazzolla',
						'slug'       => 'piazzolla',
						'fontFace'   => array(),
					),
				),
			),

			'fontface referencing uploaded file without uploaded files' => array(
				'font_families' => array(
					array(
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
				),
				'files'         => array(),
			),

			'fontface referencing uploaded file without uploaded files' => array(
				'font_families' => array(
					array(
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
				),
				'files'         => array(
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
				'font_families' => array(
					array(
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
			),
		);
	}
}

