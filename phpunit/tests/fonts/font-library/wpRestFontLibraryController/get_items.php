<?php
/**
 * Test WP_REST_Font_Family_Controller:get_items()
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 * @group font-library-refactor
 *
 * @covers WP_REST_Font_Family_Controller:get_items()
 */

class Tests_Fonts_Font_Family_Controller_get_items extends WP_REST_Font_Library_Controller_UnitTestCase {

	/**
	 * Test getting a collection of all created font families
	 */
	public function test_get_font_families() {
		$sample_fonts = array(
			array(
				'data' => array(
					'slug'      => 'slugone',
					'name'        => 'Name One',
					'fontFamily' => 'FontFamily1',
				),
			),
			array(
				'data' => array(
					'slug'      => 'slugtwo',
					'name'        => 'Name Two',
					'fontFamily' => 'FontFamily2',
				),
			),
		);

		foreach ($sample_fonts as $font_family) {
			$install_request    = new WP_REST_Request('POST', '/wp/v2/font-families');
			$install_request->set_param('data', $font_family['data']);
			rest_get_server()->dispatch($install_request);
		}

		$verify_request  = new WP_REST_Request('GET', '/wp/v2/font-families');
		$verify_response = rest_get_server()->dispatch($verify_request);
		$verify_data     = $verify_response->get_data();

		$this->assertSame(200, $verify_response->get_status(), 'The response status is not 200.');

		for ( $i = 0; $i < count( $sample_fonts ); $i++ ) {
			$this->assertSame( $sample_fonts[ $i ]['data']['slug'], $verify_data[ $i ]['data']['slug'], 'The slug response did not match expected.' );
			$this->assertSame( $sample_fonts[ $i ]['data']['name'], $verify_data[ $i ]['data']['name'], 'The name response did not match expected.' );
			$this->assertSame( $sample_fonts[ $i ]['data']['fontFamily'], $verify_data[ $i ]['data']['fontFamily'], 'The font_family response did not match expected.' );
			$this->assertIsInt( $verify_data[ $i ]['id'], 'The id response did not match expected.' );
		}
	}
}
