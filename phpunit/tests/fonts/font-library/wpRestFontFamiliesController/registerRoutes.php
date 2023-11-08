<?php
/**
 * Test WP_REST_Font_Families_Controller::register_routes().
 *
 * @package WordPress
 * @subpackage Fonts
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_REST_Font_Families_Controller::register_routes
 */
class WP_Test_REST_Font_Families_Controller_RegisterRoutes extends WP_UnitTestCase {

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/font-families', $routes, 'Rest server has not the fonts path intialized.' );
		$this->assertCount( 2, $routes['/wp/v2/font-families'], 'Rest server has not the 2 fonts paths initialized.' );
		$this->assertCount( 2, $routes['/wp/v2/font-families/(?P<slug>[\/\w-]+)'], 'Rest server has not the 2 fonts paths initialized.' );
		$this->assertArrayHasKey( 'GET', $routes['/wp/v2/font-families'][0]['methods'], 'Rest server has not the GET method for fonts intialized.' );
		$this->assertArrayHasKey( 'POST', $routes['/wp/v2/font-families'][1]['methods'], 'Rest server has not the POST method for fonts intialized.' );
		$this->assertArrayHasKey( 'GET', $routes['/wp/v2/font-families/(?P<slug>[\/\w-]+)'][0]['methods'], 'Rest server has not the GET method for fonts intialized.' );
		$this->assertArrayHasKey( 'DELETE', $routes['/wp/v2/font-families/(?P<slug>[\/\w-]+)'][1]['methods'], 'Rest server has not the DELETE method for fonts intialized.' );
	}
}
