<?php

/**
 * Test WP_REST_Font_Families_Controller::get_items().
 *
 * @package WordPress
 * @subpackage Fonts
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_REST_Font_Families_Controller::get_items()
 */
class Tests_Fonts_WPRESTFontFamilesController_GetItems extends WP_REST_Font_Families_Controller_UnitTestCase {

	/**
	 * Install fonts to test get items.
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
						'fontFamily' => 'Piazzolla',
						'fontStyle'  => 'normal',
						'fontWeight' => '400',
						'src'        => 'http://example.com/fonts/example1.ttf',
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
						'src'        => 'http://example.com/fonts/example2.ttf',
					),
				),
			),
		);

		foreach ( $mock_families as $font_family ) {

			$create_item_request = new WP_REST_Request( 'GET', '/wp/v2/font-families' );

			$create_item_request = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
			$create_item_request->set_param( 'slug', $font_family['slug'] );
			$create_item_request->set_param( 'fontFamily', $font_family['fontFamily'] );
			$create_item_request->set_param( 'name', $font_family['name'] );
			if ( ! empty( $font_family['fontFace'] ) ) {
				$create_item_request->set_param( 'fontFace', json_encode( $font_family['fontFace'] ) );
			}
			rest_get_server()->dispatch( $create_item_request );
		}
	}

	public function tear_down() {
		parent::tear_down();

		// Delete mock fonts after tests.
		$uninstall_request = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/montserrat' );
		rest_get_server()->dispatch( $uninstall_request );
		$uninstall_request = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/piazzolla' );
		rest_get_server()->dispatch( $uninstall_request );
	}

	public function test_get_items() {
		$get_items_request = new WP_REST_Request( 'GET', '/wp/v2/font-families' );
		$response          = rest_get_server()->dispatch( $get_items_request );
		$expected_response = array(
			array(
				'fontFamily' => 'Montserrat',
				'slug'       => 'montserrat',
				'name'       => 'Montserrat',
				'fontFace'   => array(
					array(
						'fontFamily' => 'Montserrat',
						'fontStyle'  => 'normal',
						'fontWeight' => '100',
						'src'        => 'http://example.com/fonts/example2.ttf',
					),
				),
			),
			array(
				'fontFamily' => 'Piazzolla',
				'slug'       => 'piazzolla',
				'name'       => 'Piazzolla',
				'fontFace'   => array(
					array(
						'fontFamily' => 'Piazzolla',
						'fontStyle'  => 'normal',
						'fontWeight' => '400',
						'src'        => 'http://example.com/fonts/example1.ttf',
					),
				),
			),
		);
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );

		$this->assertEquals( $expected_response, $response->get_data(), 'The response data is not expected.' );
	}
}
