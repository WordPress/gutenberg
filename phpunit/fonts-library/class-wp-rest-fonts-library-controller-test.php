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
	 * @covers ::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/fonts', $routes, 'Rest server has not the fonts path intialized.' );
		$this->assertCount( 2, $routes['/wp/v2/fonts'], 'Rest server has not the 2 fonts paths initialized.' );
		$this->assertArrayHasKey( 'POST', $routes['/wp/v2/fonts'][0]['methods'], 'Rest server has not the POST method for fonts intialized.' );
		$this->assertArrayHasKey( 'DELETE', $routes['/wp/v2/fonts'][1]['methods'], 'Rest server has not the DELETE method for fonts intialized.' );
	}
}
