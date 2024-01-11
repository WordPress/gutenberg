<?php
/**
 * Unit tests covering WP_REST_Menu_Items_Controller functionality.
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.5.0
 *
 * @group restapi
 *
 * @coversDefaultClass WP_REST_Menu_Items_Controller
 */
class WP_REST_Font_Faces_Controller_Test extends WP_Test_REST_Controller_Testcase {
	protected static $admin_id;
	protected static $editor_id;

	protected static $font_family_id;
	protected static $other_font_family_id;

	protected static $font_face_id1;
	protected static $font_face_id2;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$font_family_id       = $factory->post->create( array( 'post_type' => 'wp_font_family' ) );
		self::$other_font_family_id = $factory->post->create( array( 'post_type' => 'wp_font_family' ) );
		self::$font_face_id1        = $factory->post->create(
			wp_slash(
				array(
					'post_type'    => 'wp_font_face',
					'post_parent'  => self::$font_family_id,
					'post_status'  => 'publish',
					'post_title'   => 'Open Sans',
					'post_name'    => 'open-sans',
					'post_content' => wp_json_encode(
						array(
							'font_face_settings' => array(
								'fontFamily' => 'Open Sans',
								'fontWeight' => '400',
								'fontStyle'  => 'normal',
								'src'        => home_url( '/wp-content/fonts/open-sans-medium.ttf' ),
							),
						)
					),
				)
			)
		);
		self::$font_face_id2        = $factory->post->create(
			wp_slash(
				array(
					'post_type'    => 'wp_font_face',
					'post_parent'  => self::$font_family_id,
					'post_status'  => 'publish',
					'post_title'   => 'Open Sans',
					'post_name'    => 'open-sans',
					'post_content' => wp_json_encode(
						array(
							'font_face_settings' => array(
								'fontFamily' => 'Open Sans',
								'fontWeight' => '900',
								'fontStyle'  => 'normal',
								'src'        => home_url( '/wp-content/fonts/open-sans-bold.ttf' ),
							),
						)
					),
				)
			)
		);

		self::$admin_id  = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$editor_id = $factory->user->create(
			array(
				'role' => 'editor',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey(
			'/wp/v2/font-families/(?P<font_family_id>[\d]+)/font-faces',
			$routes,
			'Font faces collection for the given font family does not exist'
		);
		$this->assertCount(
			2,
			$routes['/wp/v2/font-families/(?P<font_family_id>[\d]+)/font-faces'],
			'Font faces collection for the given font family does not have exactly two elements'
		);
		$this->assertArrayHasKey(
			'/wp/v2/font-families/(?P<font_family_id>[\d]+)/font-faces/(?P<id>[\d]+)',
			$routes,
			'Single font face route for the given font family does not exist'
		);
		$this->assertCount(
			2,
			$routes['/wp/v2/font-families/(?P<font_family_id>[\d]+)/font-faces/(?P<id>[\d]+)'],
			'Font faces collection for the given font family does not have exactly two elements'
		);
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Controller does not use get_context_param().
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_items
	 */
	public function test_get_items() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 2, $data );
		$this->assertArrayHasKey( '_links', $data[0] );
		$this->check_font_face_data( $data[0], self::$font_face_id1, $data[0]['_links'] );
		$this->assertArrayHasKey( '_links', $data[1] );
		$this->check_font_face_data( $data[1], self::$font_face_id2, $data[1]['_links'] );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_items
	 */
	public function test_get_items_no_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 401 );

		wp_set_current_user( self::$editor_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 403 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_items
	 */
	public function test_get_items_missing_parent() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER . '/font-faces' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_parent', $response, 404 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_item
	 */
	public function test_get_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . self::$font_face_id1 );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->check_font_face_data( $data, self::$font_face_id1, $response->get_links() );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_item
	 */
	public function test_get_item_invalid_font_face_id() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_id', $response, 404 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_item
	 */
	public function test_get_item_no_permission() {
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . self::$font_face_id1 );

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 401 );

		wp_set_current_user( self::$editor_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 403 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_item
	 */
	public function test_get_item_missing_parent() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER . '/font-faces/' . self::$font_face_id1 );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_post_invalid_parent', $response, 404 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_item
	 */
	public function test_get_item_valid_parent_id() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . self::$font_face_id1 );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( self::$font_family_id, $data['parent'], 'The returned parent id should match the font family id.' );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_item
	 */
	public function test_get_item_invalid_parent_id() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$other_font_family_id . '/font-faces/' . self::$font_face_id1 );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_font_face_parent_id_mismatch', $response, 404 );

		$expected_message = 'The font face does not belong to the specified font family with id of "' . self::$other_font_family_id . '"';
		$this->assertSame( $expected_message, $response->as_error()->get_error_messages()[0], 'The message must contain the correct parent ID.' );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::create_item
	 */
	public function test_create_item() {
		wp_set_current_user( self::$admin_id );
		$files = $this->setup_font_file_upload( array( 'woff2' ) );

		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$request->set_param( 'theme_json_version', 2 );
		$request->set_param(
			'font_face_settings',
			wp_json_encode(
				array(
					'fontFamily' => 'Open Sans',
					'fontWeight' => '400',
					'fontStyle'  => 'normal',
					'src'        => array_keys( $files )[0],
				)
			)
		);
		$request->set_file_params( $files );

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->check_font_face_data( $data, $data['id'], $response->get_links() );
		$this->check_file_meta( $data['id'], array( $data['font_face_settings']['src'] ) );

		$settings = $data['font_face_settings'];
		unset( $settings['src'] );
		$this->assertSame(
			$settings,
			array(
				'fontFamily' => 'Open Sans',
				'fontWeight' => '400',
				'fontStyle'  => 'normal',
			)
		);

		$this->assertSame( self::$font_family_id, $data['parent'], 'The returned parent id should match the font family id.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::create_item
	 */
	public function test_create_item_with_multiple_font_files() {
		wp_set_current_user( self::$admin_id );
		$files = $this->setup_font_file_upload( array( 'ttf', 'otf', 'woff', 'woff2' ) );

		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$request->set_param( 'theme_json_version', 2 );
		$request->set_param(
			'font_face_settings',
			wp_json_encode(
				array(
					'fontFamily' => 'Open Sans',
					'fontWeight' => '400',
					'fontStyle'  => 'normal',
					'src'        => array_keys( $files ),
				)
			)
		);
		$request->set_file_params( $files );

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->check_font_face_data( $data, $data['id'], $response->get_links() );
		$this->check_file_meta( $data['id'], $data['font_face_settings']['src'] );

		$settings = $data['font_face_settings'];
		$this->assertCount( 4, $settings['src'] );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::create_item
	 */
	public function test_create_item_with_url_src() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$request->set_param( 'theme_json_version', 2 );
		$request->set_param(
			'font_face_settings',
			wp_json_encode(
				array(
					'fontFamily' => 'Open Sans',
					'fontWeight' => '400',
					'fontStyle'  => 'normal',
					'src'        => 'https://fonts.gstatic.com/s/open-sans/v30/KFOkCnqEu92Fr1MmgWxPKTM1K9nz.ttf',
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->check_font_face_data( $data, $data['id'], $response->get_links() );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::create_item
	 */
	public function test_create_item_with_all_properties() {
		wp_set_current_user( self::$admin_id );

		$properties = array(
			'fontFamily'            => 'Open Sans',
			'fontWeight'            => '300 500',
			'fontStyle'             => 'oblique 30deg 50deg',
			'fontDisplay'           => 'swap',
			'fontStretch'           => 'expanded',
			'ascentOverride'        => '70%',
			'descentOverride'       => '30%',
			'fontVariant'           => 'normal',
			'fontFeatureSettings'   => '"swsh" 2',
			'fontVariationSettings' => '"xhgt" 0.7',
			'lineGapOverride'       => '10%',
			'sizeAdjust'            => '90%',
			'unicodeRange'          => 'U+0025-00FF, U+4??',
			'preview'               => 'https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-400-normal.svg',
			'src'                   => 'https://fonts.gstatic.com/s/open-sans/v30/KFOkCnqEu92Fr1MmgWxPKTM1K9nz.ttf',
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$request->set_param( 'theme_json_version', 2 );
		$request->set_param( 'font_face_settings', wp_json_encode( $properties ) );

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'font_face_settings', $data );
		$this->assertSame( $properties, $data['font_face_settings'] );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::validate_create_font_face_request
	 */
	public function test_create_item_default_theme_json_version() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$request->set_param(
			'font_face_settings',
			wp_json_encode(
				array(
					'fontFamily' => 'Open Sans',
					'src'        => 'https://fonts.gstatic.com/s/open-sans/v30/KFOkCnqEu92Fr1MmgWxPKTM1K9nz.ttf',
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 2, $data['theme_json_version'], 'The default theme.json version should be 2.' );
	}

	/**
	 * @dataProvider data_create_item_invalid_theme_json_version
	 *
	 * @covers WP_REST_Font_Faces_Controller::create_item
	 */
	public function test_create_item_invalid_theme_json_version( $theme_json_version ) {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$request->set_param( 'theme_json_version', $theme_json_version );
		$request->set_param( 'font_face_settings', '' );

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function data_create_item_invalid_theme_json_version() {
		return array(
			array( 1 ),
			array( 3 ),
		);
	}

	/**
	 * @dataProvider data_create_item_invalid_settings
	 *
	 * @covers WP_REST_Font_Faces_Controller::validate_create_font_face_settings
	 */
	public function test_create_item_invalid_settings( $settings ) {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$request->set_param( 'theme_json_version', 2 );
		$request->set_param( 'font_face_settings', wp_json_encode( $settings ) );

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function data_create_item_invalid_settings() {
		return array(
			'Missing src'         => array(
				'settings' => array(
					'fontFamily' => 'Open Sans',
					'fontWeight' => '400',
					'fontStyle'  => 'normal',
				),
			),
			'Invalid src'         => array(
				'settings' => array(
					'fontFamily' => 'Open Sans',
					'src'        => '',
				),
			),
			'Missing fontFamily'  => array(
				'settings' => array(
					'fontWeight' => '400',
					'fontStyle'  => 'normal',
					'src'        => 'https://fonts.gstatic.com/s/open-sans/v30/KFOkCnqEu92Fr1MmgWxPKTM1K9nz.ttf',
				),
			),
			'Invalid fontDisplay' => array(
				'settings' => array(
					'fontFamily'  => 'Open Sans',
					'fontDisplay' => 'invalid',
					'src'         => 'https://fonts.gstatic.com/s/open-sans/v30/KFOkCnqEu92Fr1MmgWxPKTM1K9nz.ttf',
				),
			),
		);
	}

	public function test_update_item() {
		$request  = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . self::$font_face_id1 );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_no_route', $response, 404 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::delete_item
	 */
	public function test_delete_item() {
		wp_set_current_user( self::$admin_id );
		$font_face_id     = self::factory()->post->create(
			array(
				'post_type'   => 'wp_font_face',
				'post_parent' => self::$font_family_id,
			)
		);
		$request          = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . $font_face_id );
		$request['force'] = true;
		$response         = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNull( get_post( $font_face_id ) );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::delete_item
	 */
	public function test_delete_item_no_trash() {
		wp_set_current_user( self::$admin_id );
		$font_face_id = self::factory()->post->create(
			array(
				'post_type'   => 'wp_font_face',
				'post_parent' => self::$font_family_id,
			)
		);

		// Attempt trashing.
		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . $font_face_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_trash_not_supported', $response, 501 );

		$request->set_param( 'force', 'false' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_trash_not_supported', $response, 501 );

		// Ensure the post still exists.
		$post = get_post( $font_face_id );
		$this->assertNotEmpty( $post );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::delete_item
	 */
	public function test_delete_item_invalid_delete_permissions() {
		wp_set_current_user( self::$editor_id );
		$font_face_id = self::factory()->post->create(
			array(
				'post_type'   => 'wp_font_face',
				'post_parent' => self::$font_family_id,
			)
		);
		$request      = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . $font_face_id );
		$response     = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_delete', $response, 403 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::prepare_item_for_response
	 */
	public function test_prepare_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . self::$font_face_id2 );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->check_font_face_data( $data, self::$font_face_id2, $response->get_links() );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_item_schema
	 */
	public function test_get_item_schema() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$properties = $data['schema']['properties'];
		$this->assertCount( 4, $properties );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'theme_json_version', $properties );
		$this->assertArrayHasKey( 'parent', $properties );
		$this->assertArrayHasKey( 'font_face_settings', $properties );
	}

	protected function check_font_face_data( $data, $post_id, $links ) {
		$post = get_post( $post_id );

		$this->assertArrayHasKey( 'id', $data );
		$this->assertSame( $post->ID, $data['id'] );

		$this->assertArrayHasKey( 'parent', $data );
		$this->assertSame( $post->post_parent, $data['parent'] );

		$this->assertArrayHasKey( 'theme_json_version', $data );
		$this->assertSame( 2, $data['theme_json_version'] );

		$this->assertArrayHasKey( 'font_face_settings', $data );
		$this->assertSame( $post->post_content, wp_json_encode( $data['font_face_settings'] ) );

		$this->assertNotEmpty( $links );
		$this->assertSame( rest_url( 'wp/v2/font-families/' . $post->post_parent . '/font-faces/' . $post->ID ), $links['self'][0]['href'] );
		$this->assertSame( rest_url( 'wp/v2/font-families/' . $post->post_parent . '/font-faces' ), $links['collection'][0]['href'] );
		$this->assertSame( rest_url( 'wp/v2/font-families/' . $post->post_parent ), $links['parent'][0]['href'] );
	}

	protected function check_file_meta( $font_face_id, $srcs ) {
		$file_meta = get_post_meta( $font_face_id, '_wp_font_face_file' );

		foreach ( $srcs as $src ) {
			$file_name = basename( $src );
			$this->assertContains( $file_name, $file_meta, 'The uploaded font file path should be saved in the post meta.' );
		}
	}

	protected function setup_font_file_upload( $formats ) {
		$files = array();
		foreach ( $formats as $format ) {
			$font_file = GUTENBERG_DIR_TESTDATA . 'fonts/OpenSans-Regular.' . $format;
			$font_path = wp_tempnam( 'OpenSans-Regular.' . $format );
			copy( $font_file, $font_path );

			$files[ 'file-' . count( $files ) ] = array(
				'name'      => 'OpenSans-Regular.' . $format,
				'full_path' => 'OpenSans-Regular.' . $format,
				'type'      => 'font/' . $format,
				'tmp_name'  => $font_path,
				'error'     => 0,
				'size'      => filesize( $font_path ),
			);
		}

		return $files;
	}
}
