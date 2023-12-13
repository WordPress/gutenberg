<?php
/**
 * Test WP_REST_Font_Family_Controller
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 * @group font-library-refactor
 *
 * @covers WP_REST_Font_Family_Controller
 */

class Tests_Fonts_Font_Family_Controller extends WP_REST_Font_Library_Controller_UnitTestCase {

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
		if( array_key_exists( 'data', $request ) ){
			$install_request->set_param( 'data', $request['data'] );
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
					'message' => __( 'Missing parameter(s): data', 'wp-font-library' ),
					'data'    => array(
						'status' => 400,
					),
				),
			),
			'missing slug'        => array(
				'request' => array(
					'data' => array(
						'name' => 'Name',
						'fontFamily' => 'Font Family',
					)
				),
				'expected_response' => array(
					'code'    => 'rest_invalid_param',
					'message' => __( 'Invalid parameter(s): data', 'wp-font-library' ),
					'data'    => array(
						'status' => 400,
					),
				),
			),
			'missing name'        => array(
				'request' => array(
					'data' => array(
						'slug' => 'slug',
						'fontFamily' => 'Font Family',
					),
				),
				'expected_response' => array(
					'code'    => 'rest_invalid_param',
					'message' => __( 'Invalid parameter(s): data', 'wp-font-library' ),
					'data'    => array(
						'status' => 400,
					),
				),
			),
			'missing fontFamily'        => array(
				'request' => array(
					'data' => array(
						'slug' => 'slug',
						'name' => 'Name',
					),
				),
				'expected_response' => array(
					'code'    => 'rest_invalid_param',
					'message' => __( 'Invalid parameter(s): data', 'wp-font-library' ),
					'data'    => array(
						'status' => 400,
					),
				),
			),
		);
	}

	/**
	 * Tests responses when sucessfully creating Font Families
	 *
	 * @dataProvider data_create_font_family
	 *
	 * @param array $font_family     Font families to install in theme.json format.
	 * @param array $expected_response Expected response data.
	 */
	public function test_create_font_family( $font_family ) {
		$install_request    = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$install_request->set_param( 'data', $font_family );
		$response = rest_get_server()->dispatch( $install_request );
		$response_data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
		$this->assertSame( $font_family['slug'], $response_data['data']['slug'], 'The slug response did not match expected.' );
		$this->assertSame( $font_family['name'], $response_data['data']['name'], 'The name response did not match expected.' );
		$this->assertSame( $font_family['fontFamily'], $response_data['data']['fontFamily'], 'The font_family response did not match expected.' );
		$this->assertIsInt( $response_data['id'], 'The id response did not match expected.' );
		if ( array_key_exists( 'fontFace', $font_family ) ) {
			$this->assertSame( $font_family['fontFace'], $response_data['data']['fontFace'], 'The font_family response did not match expected.' );
		}
	}

	/**
	 * Tests responses when getting existing Font Families
	 *
	 * @dataProvider data_create_font_family
	 *
	 * @param array $font_families     Font families to install in theme.json format.
	 * @param array $expected_response Expected response data.
	 */
	public function test_get_font_family( $font_family ) {
		$install_request    = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$install_request->set_param( 'data', $font_family );
	 	$install_response = rest_get_server()->dispatch( $install_request );
		$install_data     = $install_response->get_data();
		$installed_font_id = $install_data['id'];

		$verify_request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . $installed_font_id );
		$verify_response = rest_get_server()->dispatch( $verify_request );
		$verify_data     = $verify_response->get_data();

		$this->assertSame( 200, $verify_response->get_status(), 'The response status is not 200.' );
		$this->assertSame( $font_family['slug'], $verify_data['data']['slug'], 'The slug response did not match expected.' );
		$this->assertSame( $font_family['name'], $verify_data['data']['name'], 'The name response did not match expected.' );
		$this->assertSame( $font_family['fontFamily'], $verify_data['data']['fontFamily'], 'The font_family response did not match expected.' );
		$this->assertIsInt( $verify_data['id'], 'The id response did not match expected.' );

	}

	/**
	 * Tests failure when deleting a font family that does not exist
	 */
	public function test_delete_font_family_not_exist() {

		$request    = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/8888888' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 404, $response->get_status() );
	}

	/**
	 * Tests deleting existing Font Families.  First creates a font family, then deletes it, then gets it to make sure it's gone.
	 *
	 * @dataProvider data_create_font_family
	 *
	 * @param array $font_family     Font families to install in theme.json format.
	 * @param array $expected_response Expected response data.
	 */
	public function test_delete_font_family( $font_family ) {
		$install_request    = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$install_request->set_param( 'data', $font_family );
	 	$install_response = rest_get_server()->dispatch( $install_request );
		$install_data     = $install_response->get_data();
		$installed_font_id = $install_data['id'];

		//TODO: adding  . '?force=true' to the end doesn't work like it is supposed to.
		$delete_request  = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . $installed_font_id);
		$delete_response = rest_get_server()->dispatch( $delete_request );
		$delete_data     = $delete_response->get_data();

		$this->assertSame( 200, $delete_response->get_status(), 'The response status is not 200.' );
		$this->assertSame( $font_family['slug'], $delete_data['previous']['data']['slug'], 'The slug response did not match expected.' );
		$this->assertSame( $font_family['name'], $delete_data['previous']['data']['name'], 'The name response did not match expected.' );
		$this->assertSame( $font_family['fontFamily'], $delete_data['previous']['data']['fontFamily'], 'The font_family response did not match expected.' );
		$this->assertIsInt( $delete_data['previous']['id'], 'The id response did not match expected.' );
		$this->assertTrue( $delete_data['deleted'], 'The response did not flag deleted status as expected.' );

		$verify_request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . $installed_font_id );
		$verify_response = rest_get_server()->dispatch( $verify_request );

		$this->assertSame( 404, $verify_response->get_status(), 'The response status is not 200.' );

	}

	/**
	 * Data provider for test_install_fonts
	 */
	public function data_create_font_family() {
		return array(
			'Arial'      => array( array(
				'slug'      => 'arial',
				'name'        => 'Arial',
				'fontFamily' => 'Arial',
			)),
			'Hosted Font Face'      => array( array(
				'slug'      => 'abeezee',
				'name'        => 'ABeeZee',
				'fontFamily' => 'ABeeZee',
				'fontFace' => array(
					array(
						'fontFamily'      => 'ABeeZee',
						'fontStyle'       => 'normal',
						'fontWeight'      => '400',
						'src'             => 'https://fonts.gstatic.com/s/abeezee/v22/esDR31xSG-6AGleN6tKukbcHCpE.ttf',
						'preview'	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-normal.svg',
					),
					array(
						'fontFamily'      => 'ABeeZee',
						'fontStyle'       => 'italic',
						'fontWeight'      => '400',
						'src'             => 'https://fonts.gstatic.com/s/abeezee/v22/esDT31xSG-6AGleN2tCklZUCGpG-GQ.ttf',
						'preview' 	  => 'https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-italic.svg',
					),
				),
			)),
		);
	}

	public function test_update_font_family() {

		$create_request    = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$create_request->set_param( 'data', array(
			'fontFamily' => 'Piazzolla',
			'slug'       => 'piazzolla',
			'name'       => 'Piazzolla',
		));
		$create_response = rest_get_server()->dispatch( $create_request );
		$create_data     = $create_response->get_data();
		$installed_font_id = $create_data['id'];

		$update_request    = new WP_REST_Request( 'PUT', '/wp/v2/font-families/' . $installed_font_id );
		$update_request->set_param( 'data', array(
			'fontFamily' => 'Piazzolla, serif',
		));
		$update_response = rest_get_server()->dispatch( $update_request );
		$update_data     = $update_response->get_data();

		$this->assertSame( 200, $update_response->get_status(), 'The response status is not 200.' );
		$this->assertSame( 'piazzolla', $update_data['data']['slug'], 'The slug response did not match expected.' );
		$this->assertSame( 'Piazzolla', $update_data['data']['name'], 'The name response did not match expected.' );
		$this->assertSame( 'Piazzolla, serif', $update_data['data']['fontFamily'], 'The font_family response did not match expected.' );
		$this->assertSame( $installed_font_id, $update_data['id'], 'The id response did not match expected.' );

		$verify_request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . $installed_font_id );
		$verify_response = rest_get_server()->dispatch( $verify_request );
		$verify_data     = $verify_response->get_data();

		$this->assertSame( 200, $verify_response->get_status(), 'The response status is not 200.' );
		$this->assertSame( 'piazzolla', $verify_data['data']['slug'], 'The slug response did not match expected.' );
		$this->assertSame( 'Piazzolla', $verify_data['data']['name'], 'The name response did not match expected.' );
		$this->assertSame( 'Piazzolla, serif', $verify_data['data']['fontFamily'], 'The font_family response did not match expected.' );
		$this->assertSame( $installed_font_id, $verify_data['id'], 'The id response did not match expected.' );

	}

	/**
	 * Test getting a collection of all created font families
	 */
	public function test_get_font_families() {
		$sample_fonts = array(
			array(
				'data' => array(
					'slug'      => 'arial',
					'name'        => 'Arial',
					'fontFamily' => 'Arial',
				),
			),
			array(
				'data' => array(
					'slug'      => 'sebastian',
					'name'        => 'Sebastian',
					'fontFamily' => 'Sebastian',
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

	public function test_add_font_face() {

		$create_request    = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$create_request->set_param( 'data', array(
			'fontFamily' => 'Piazzolla',
			'slug'       => 'piazzolla',
			'name'       => 'Piazzolla',
		));
		$create_response = rest_get_server()->dispatch( $create_request );
		$create_data     = $create_response->get_data();
		$installed_font_id = $create_data['id'];

		$add_font_face_request    = new WP_REST_Request( 'PUT', '/wp/v2/font-families/' . $installed_font_id );
		$add_font_face_request->set_param( 'data', array( 'fontFace' => array( array(
			'fontFamily'      => 'Piazzolla',
			'fontStyle'       => 'normal',
			'fontWeight'      => '400',
			'src'             => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf',

		))));
		$add_font_face_response = rest_get_server()->dispatch( $add_font_face_request );
		$add_font_face_data     = $add_font_face_response->get_data();

		$this->assertSame( 200, $add_font_face_response->get_status(), 'The response status is not 200.' );
		$this->assertSame( 'Piazzolla', $add_font_face_data['data']['fontFace'][0]['fontFamily'], 'The font_family response did not match expected.' );
		$this->assertSame( 'normal', $add_font_face_data['data']['fontFace'][0]['fontStyle'], 'The font_family response did not match expected.' );
		$this->assertSame( '400', $add_font_face_data['data']['fontFace'][0]['fontWeight'], 'The font_family response did not match expected.' );
		$this->assertSame( 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf', $add_font_face_data['data']['fontFace'][0]['src'], 'The font_family response did not match expected.' );

		$verify_request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . $installed_font_id );
		$verify_response = rest_get_server()->dispatch( $verify_request );
		$verify_data     = $verify_response->get_data();

		$this->assertSame( 200, $verify_response->get_status(), 'The response status is not 200.' );
		$this->assertSame( 'Piazzolla', $verify_data['data']['fontFace'][0]['fontFamily'], 'The font_family response did not match expected.' );
		$this->assertSame( 'normal', $verify_data['data']['fontFace'][0]['fontStyle'], 'The font_family response did not match expected.' );
		$this->assertSame( '400', $verify_data['data']['fontFace'][0]['fontWeight'], 'The font_family response did not match expected.' );
		$this->assertSame( 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf', $verify_data['data']['fontFace'][0]['src'], 'The font_family response did not match expected.' );

	}
}
