<?php
/**
 * Tests for WP_REST_Fonts_Library_Controller class
 *
 * @package    Gutenberg
 * @subpackage Fonts Library
 */

/**
 * @coversDefaultClass WP_REST_Fonts_Library_Controller
 */
class WP_REST_Fonts_Library_Controller_Test extends WP_UnitTestCase {
	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Creates fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetupBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	/**
	 * @covers ::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/fonts', $routes, 'Rest server has not the fonts path intialized.' );
		$this->assertCount( 2, $routes['/wp/v2/fonts'], 'Rest server has not the 2 fonts paths initialized.' );
		$this->assertArrayHasKey( 'POST', $routes['/wp/v2/fonts'][0]['methods'], 'Rest server has not the POST method for fonts intialized.' );
		$this->assertArrayHasKey( 'DELETE', $routes['/wp/v2/fonts'][1]['methods'], 'Rest server has not the DELETE method for fonts intialized.' );
	}

	/**
	 * @covers ::uninstall_fonts
	 */
	public function test_uninstall_non_existing_fonts() {
		wp_set_current_user( self::$admin_id );
		$uninstall_request = new WP_REST_Request( 'DELETE', '/wp/v2/fonts' );

		$non_existing_font_data = array(
			array(
				'slug' => 'non-existing-font',
				'name' => 'Non existing font',
			),
			array(
				'slug' => 'another-not-installed-font',
				'name' => 'Another not installed font',
			),
		);

		$uninstall_request->set_param( 'fontFamilies', $non_existing_font_data );
		$response = rest_get_server()->dispatch( $uninstall_request );
		$response->get_data();
		$this->assertSame( 500, $response->get_status(), 'The response status is not 500.' );
	}


	/**
	 * @covers ::install_fonts
	 * @covers ::uninstall_fonts
	 *
	 * @dataProvider data_install_and_uninstall_fonts
	 *
	 * @param array $font_families     Font families to install in theme.json format.
	 * @param array $files             Font files to install.
	 * @param array $expected_response Expected response data.
	 */
	public function test_install_and_uninstall_fonts( $font_families, $files, $expected_response ) {
		wp_set_current_user( self::$admin_id );
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

		$uninstall_request = new WP_REST_Request( 'DELETE', '/wp/v2/fonts' );
		$uninstall_request->set_param( 'fontFamilies', $font_families );
		$response = rest_get_server()->dispatch( $uninstall_request );
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
	}

	/**
	 * Data provider for test_install_and_uninstall_fonts
	 */
	public function data_install_and_uninstall_fonts() {

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
								'fontFamily'        => 'Piazzolla',
								'fontStyle'         => 'normal',
								'fontWeight'        => '400',
								'src'               => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf',
								'download_from_url' => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf',
							),
						),
					),
					array(
						'fontFamily' => 'Montserrat',
						'slug'       => 'montserrat',
						'name'       => 'Montserrat',
						'fontFace'   => array(
							array(
								'fontFamily'        => 'Montserrat',
								'fontStyle'         => 'normal',
								'fontWeight'        => '100',
								'src'               => 'http://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Uw-Y3tcoqK5.ttf',
								'download_from_url' => 'http://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Uw-Y3tcoqK5.ttf',
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
								'src'        => '/wp-content/uploads/fonts/piazzolla_normal_400.ttf',
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
								'src'        => '/wp-content/uploads/fonts/montserrat_normal_100.ttf',
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
								'fontFamily'    => 'Piazzolla',
								'fontStyle'     => 'normal',
								'fontWeight'    => '400',
								'uploaded_file' => 'files0',
							),
						),
					),
					array(
						'fontFamily' => 'Montserrat',
						'slug'       => 'montserrat',
						'name'       => 'Montserrat',
						'fontFace'   => array(
							array(
								'fontFamily'    => 'Montserrat',
								'fontStyle'     => 'normal',
								'fontWeight'    => '100',
								'uploaded_file' => 'files1',
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
								'src'        => '/wp-content/uploads/fonts/piazzolla_normal_400.ttf',
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
								'src'        => '/wp-content/uploads/fonts/montserrat_normal_100.ttf',
							),
						),
					),
				),
			),
		);
	}
}
