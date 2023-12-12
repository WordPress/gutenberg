<?php
/**
 * Test WP_REST_Font_Library_Controller::get_font_collection().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 * @group font-library-refactor
 *
 * @covers WP_REST_Font_Library_Controller
 */

class Tests_Fonts_FontLibraryController extends WP_REST_Font_Library_Controller_UnitTestCase {

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		// $this->assertArrayHasKey( 'POST', $routes['/wp/v2/fonts'][0]['methods'], 'Rest server has not the POST method for fonts intialized.' );
		// $this->assertArrayHasKey( 'DELETE', $routes['/wp/v2/fonts'][1]['methods'], 'Rest server has not the DELETE method for fonts intialized.' );
		// $this->assertArrayHasKey( 'GET', $routes['/wp/v2/fonts/collections'][0]['methods'], 'Rest server has not the GET method for collections intialized.' );
		// $this->assertArrayHasKey( 'GET', $routes['/wp/v2/fonts/collections/(?P<id>[\/\w-]+)'][0]['methods'], 'Rest server has not the GET method for collection intialized.' );

		$this->assertArrayHasKey( 'POST', $routes['/wp/v2/font-families'][0]['methods'], 'No route to create font families' );
		$this->assertArrayHasKey( 'GET', $routes['/wp/v2/font-families/(?P<slug>[\/\w-]+)'][0]['methods'], 'No route to get a font family' );
		$this->assertArrayHasKey( 'GET', $routes['/wp/v2/all-font-families'][0]['methods'], 'No route to get font families' );
	}
	/**
	 * Tests failure when getting a font family that does not exist
	 */
	public function test_get_font_family_not_exist() {

		$request    = new WP_REST_Request( 'GET', '/wp/v2/font-families/pickles' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 404, $response->get_status() );

	}



	/**
	 * Tests failure when fonfaces has improper inputs
	 *
	 * @dataProvider data_create_font_family_with_improper_inputs
	 *
	 * @param array $font_families Font families to install in theme.json format.
	 */
	public function test_create_font_family_errors( $request, $expected_response ) {
		$install_request    = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		if( array_key_exists( 'slug', $request ) ){
			$install_request->set_param( 'slug', $request['slug'] );
		}
		if( array_key_exists( 'name', $request ) ){
			$install_request->set_param( 'name', $request['name'] );
		}
		if( array_key_exists( 'font_family', $request ) ){
			$install_request->set_param( 'font_family', $request['font_family'] );
		}

		$response = rest_get_server()->dispatch( $install_request );
		$this->assertSame( $expected_response['data']['status'], $response->get_status() );
		$this->assertSame( $expected_response['code'], $response->get_data()['code'], 'Error Response Unexpected' );
		$this->assertSame( $expected_response['message'], $response->get_data()['message'], 'Error Response Unexpected' );
	}

	/**
	 * Data provider for test_install_with_improper_inputs
	 */
	public function data_create_font_family_with_improper_inputs() {
		return array(
			'no valid parameters'        => array(
				'request' => array(
					'apples' => 'bananas',
				),
				'expected_response' => array(
					'code'    => 'rest_missing_callback_param',
					'message' => __( 'Missing parameter(s): slug, name, font_family', 'wp-font-library' ),
					'data'    => array(
						'status' => 400,
					),
				),
			),
			'missing slug'        => array(
				'request' => array(
					'name' => 'Name',
					'font_family' => 'Font Family',
				),
				'expected_response' => array(
					'code'    => 'rest_missing_callback_param',
					'message' => __( 'Missing parameter(s): slug', 'wp-font-library' ),
					'data'    => array(
						'status' => 400,
					),
				),
			),
			'missing name'        => array(
				'request' => array(
					'slug' => 'slug',
					'font_family' => 'Font Family',
				),
				'expected_response' => array(
					'code'    => 'rest_missing_callback_param',
					'message' => __( 'Missing parameter(s): name', 'wp-font-library' ),
					'data'    => array(
						'status' => 400,
					),
				),
			),
			'missing font_family'        => array(
				'request' => array(
					'slug' => 'slug',
					'name' => 'Name',
				),
				'expected_response' => array(
					'code'    => 'rest_missing_callback_param',
					'message' => __( 'Missing parameter(s): font_family', 'wp-font-library' ),
					'data'    => array(
						'status' => 400,
					),
				),
			),
		);
	}

	/**
	 *
	 * @dataProvider data_create_font_family
	 *
	 * @param array $font_families     Font families to install in theme.json format.
	 * @param array $expected_response Expected response data.
	 */
	public function test_create_font_family( $request, $expected_response ) {
		$install_request    = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$install_request->set_param( 'slug', $request['slug'] );
		$install_request->set_param( 'name', $request['name'] );
		$install_request->set_param( 'font_family', $request['font_family'] );
		$response = rest_get_server()->dispatch( $install_request );
		$response_data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
		$this->assertSame( $expected_response['slug'], $response_data['slug'], 'The slug response did not match expected.' );
		$this->assertSame( $expected_response['name'], $response_data['name'], 'The name response did not match expected.' );
		$this->assertSame( $expected_response['font_family'], $response_data['font_family'], 'The font_family response did not match expected.' );
		$this->assertIsInt( $response_data['id'], 'The id response did not match expected.' );
	}

	/**
	 *
	 * @dataProvider data_create_font_family
	 *
	 * @param array $font_families     Font families to install in theme.json format.
	 * @param array $expected_response Expected response data.
	 */
	public function test_get_font_family( $request, $expected_response ) {
		$install_request    = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$install_request->set_param( 'slug', $request['slug'] );
		$install_request->set_param( 'name', $request['name'] );
		$install_request->set_param( 'font_family', $request['font_family'] );
	 	rest_get_server()->dispatch( $install_request );

		$verify_request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . $request['slug'] );
		$verify_response = rest_get_server()->dispatch( $verify_request );
		$verify_data     = $verify_response->get_data();

		$this->assertSame( 200, $verify_response->get_status(), 'The response status is not 200.' );
		$this->assertSame( $expected_response['slug'], $verify_data['slug'], 'The slug response did not match expected.' );
		$this->assertSame( $expected_response['name'], $verify_data['name'], 'The name response did not match expected.' );
		$this->assertSame( $expected_response['font_family'], $verify_data['font_family'], 'The font_family response did not match expected.' );
		$this->assertIsInt( $verify_data['id'], 'The id response did not match expected.' );

	}

	/**
	 * Data provider for test_install_fonts
	 */
	public function data_create_font_family() {

		return array(

			'A Font with No Faces'      => array(
				'request' 	    => array(
					'slug'      => 'arial',
					'name'        => 'Arial',
					'font_family' => 'Arial',
				),
				'expected_response' => array(
					'slug'      => 'arial',
					'name'      => 'Arial',
					'font_family' => 'Arial',
				),
			),
		);
	}

	/**
	 *
	 */
	public function test_get_font_families() {
		$sample_fonts = array(
			array(
				'slug'      => 'arial',
				'name'        => 'Arial',
				'font_family' => 'Arial',
			),
			array(
				'slug'      => 'sebastian',
				'name'        => 'Sebastian',
				'font_family' => 'Sebastian',
			),
		);

		foreach ($sample_fonts as $font_family) {
			$install_request    = new WP_REST_Request('POST', '/wp/v2/font-families');
			$install_request->set_param('slug', $font_family['slug']);
			$install_request->set_param('name', $font_family['name']);
			$install_request->set_param('font_family', $font_family['font_family']);
			rest_get_server()->dispatch($install_request);
		}

		$verify_request  = new WP_REST_Request('GET', '/wp/v2/all-font-families');
		$verify_response = rest_get_server()->dispatch($verify_request);
		$verify_data     = $verify_response->get_data();

		$this->assertSame(200, $verify_response->get_status(), 'The response status is not 200.');

		for ( $i = 0; $i < count( $sample_fonts ); $i++ ) {
			$this->assertSame( $sample_fonts[ $i ]['slug'], $verify_data[ $i ]['slug'], 'The slug response did not match expected.' );
			$this->assertSame( $sample_fonts[ $i ]['name'], $verify_data[ $i ]['name'], 'The name response did not match expected.' );
			$this->assertSame( $sample_fonts[ $i ]['font_family'], $verify_data[ $i ]['font_family'], 'The font_family response did not match expected.' );
			$this->assertIsInt( $verify_data[ $i ]['id'], 'The id response did not match expected.' );
		}
	}


}
