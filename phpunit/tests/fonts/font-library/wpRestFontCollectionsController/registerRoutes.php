<?php
/**
 * Test WP_REST_Font_Collections_Controller::register_routes().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_REST_Font_Collections_Controller::register_routes
 */

class Tests_Fonts_WPRESTFontCollectionsController_RegisterRoutes extends WP_UnitTestCase {

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertCount( 1, $routes['/wp/v2/font-collections'], 'Rest server has not the collections path initialized.' );
		$this->assertCount( 1, $routes['/wp/v2/font-collections/(?P<slug>[\/\w-]+)'], 'Rest server has not the collection path initialized.' );

		$this->assertArrayHasKey( 'GET', $routes['/wp/v2/font-collections'][0]['methods'], 'Rest server has not the GET method for collections intialized.' );
		$this->assertArrayHasKey( 'GET', $routes['/wp/v2/font-collections/(?P<slug>[\/\w-]+)'][0]['methods'], 'Rest server has not the GET method for collection intialized.' );
	}
}
