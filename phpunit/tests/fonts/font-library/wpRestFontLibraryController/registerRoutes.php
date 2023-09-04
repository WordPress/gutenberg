<?php
/**
 * Test WP_REST_Font_Library_Controller::register_routes().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_REST_Font_Library_Controller::register_routes
 */

class Tests_Fonts_WPRESTFontLibraryController_RegisterRoutes extends WP_UnitTestCase {

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/fonts', $routes, 'Rest server has not the fonts path intialized.' );
		$this->assertCount( 2, $routes['/wp/v2/fonts'], 'Rest server has not the 2 fonts paths initialized.' );
		$this->assertCount( 1, $routes['/wp/v2/fonts/collections'], 'Rest server has not the collections path initialized.' );
		$this->assertCount( 1, $routes['/wp/v2/fonts/collections/(?P<id>[\/\w-]+)'], 'Rest server has not the collection path initialized.' );

		$this->assertArrayHasKey( 'POST', $routes['/wp/v2/fonts'][0]['methods'], 'Rest server has not the POST method for fonts intialized.' );
		$this->assertArrayHasKey( 'DELETE', $routes['/wp/v2/fonts'][1]['methods'], 'Rest server has not the DELETE method for fonts intialized.' );
		$this->assertArrayHasKey( 'GET', $routes['/wp/v2/fonts/collections'][0]['methods'], 'Rest server has not the GET method for collections intialized.' );
		$this->assertArrayHasKey( 'GET', $routes['/wp/v2/fonts/collections/(?P<id>[\/\w-]+)'][0]['methods'], 'Rest server has not the GET method for collection intialized.' );
	}
}

