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

class Tests_Fonts_WPRESTFontLibraryController_UninstallFonts extends WP_REST_Font_Library_Controller_UnitTestCase {

	/**
	 * Install fonts to test uninstall.
	 */
	public function set_up() {
		parent::set_up();

		// Installs mock fonts to test uninstall.
		$mock_families = array(
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
		);

		$install_request    = new WP_REST_Request( 'POST', '/wp/v2/fonts' );
		$font_families_json = json_encode( $mock_families );
		$install_request->set_param( 'fontFamilies', $font_families_json );
		rest_get_server()->dispatch( $install_request );
	}

	public function test_uninstall() {
		$font_families_to_uninstall = array(
			array(
				'slug' => 'piazzolla',
			),
			array(
				'slug' => 'montserrat',
			),
		);

		$uninstall_request = new WP_REST_Request( 'DELETE', '/wp/v2/fonts' );
		$uninstall_request->set_param( 'fontFamilies', $font_families_to_uninstall );
		$response = rest_get_server()->dispatch( $uninstall_request );
		echo ( print_r( $response->get_data(), true ) );
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );

	}


	public function test_uninstall_non_existing_fonts() {
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
}


