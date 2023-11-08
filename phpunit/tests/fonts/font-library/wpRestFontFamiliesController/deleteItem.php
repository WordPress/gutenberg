<?php
/**
 * Test WP_REST_Font_Families_Controller::delete_item().
 *
 * @package WordPress
 * @subpackage Fonts
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_REST_Font_Families_Controller::delete_item
 */
class WP_Test_REST_Font_Families_Controller_DeleteItem extends WP_Test_REST_Font_Families_Controller_UnitTestCase {

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

	public function test_delete_item() {
		$uninstall_request = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/piazzolla' );
		$response          = rest_get_server()->dispatch( $uninstall_request );
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
	}


	public function test_uninstall_non_existing_fonts() {
		$uninstall_request = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/pizza' );
		$response          = rest_get_server()->dispatch( $uninstall_request );
		$this->assertSame( 404, $response->get_status(), 'The response status is not 404.' );
	}
}
