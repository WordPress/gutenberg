<?php
/**
 * Unit tests covering WP_REST_Font_Faces_Controller_Test functionality.
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.5.0
 *
 * @group restapi
 * @group fonts
 * @group font-library
 *
 * @coversDefaultClass WP_REST_Font_Faces_Controller
 */
class Tests_REST_WpRestFontFacesController extends WP_Test_REST_Controller_Testcase {
	protected static $admin_id;
	protected static $editor_id;

	protected static $font_family_id;
	protected static $other_font_family_id;

	protected static $font_face_id1;
	protected static $font_face_id2;

	private static $post_ids_for_cleanup = array();

	protected static $default_settings = array(
		'fontFamily' => '"Open Sans"',
		'fontWeight' => '400',
		'fontStyle'  => 'normal',
		'src'        => 'https://fonts.gstatic.com/s/open-sans/v30/KFOkCnqEu92Fr1MmgWxPKTM1K9nz.ttf',
	);

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$font_family_id       = Tests_REST_WpRestFontFamiliesController::create_font_family_post();
		self::$other_font_family_id = Tests_REST_WpRestFontFamiliesController::create_font_family_post();

		self::$font_face_id1 = self::create_font_face_post(
			self::$font_family_id,
			array(
				'fontFamily' => '"Open Sans"',
				'fontWeight' => '400',
				'fontStyle'  => 'normal',
				'src'        => home_url( '/wp-content/fonts/open-sans-medium.ttf' ),
			)
		);
		self::$font_face_id2 = self::create_font_face_post(
			self::$font_family_id,
			array(
				'fontFamily' => '"Open Sans"',
				'fontWeight' => '900',
				'fontStyle'  => 'normal',
				'src'        => home_url( '/wp-content/fonts/open-sans-bold.ttf' ),
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

		self::$post_ids_for_cleanup = array();
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );

		wp_delete_post( self::$font_family_id, true );
		wp_delete_post( self::$other_font_family_id, true );
		wp_delete_post( self::$font_face_id1, true );
		wp_delete_post( self::$font_face_id2, true );
	}

	public function tear_down() {
		foreach ( self::$post_ids_for_cleanup as $post_id ) {
			wp_delete_post( $post_id, true );
		}
		self::$post_ids_for_cleanup = array();
		parent::tear_down();
	}

	public static function create_font_face_post( $parent_id, $settings = array() ) {
		$settings = array_merge( self::$default_settings, $settings );
		$title    = WP_Font_Utils::get_font_face_slug( $settings );
		$post_id  = self::factory()->post->create(
			wp_slash(
				array(
					'post_type'    => 'wp_font_face',
					'post_status'  => 'publish',
					'post_title'   => $title,
					'post_name'    => sanitize_title( $title ),
					'post_content' => wp_json_encode( $settings ),
					'post_parent'  => $parent_id,
				)
			)
		);

		self::$post_ids_for_cleanup[] = $post_id;

		return $post_id;
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

	public function test_font_faces_no_autosave_routes() {
		// @core-merge: Enable this test.
		$this->markTestSkipped( 'This test only works with WP 6.4 and above. Enable it once 6.5 is released.' );
		$routes = rest_get_server()->get_routes();
		$this->assertArrayNotHasKey(
			'/wp/v2/font-families/(?P<font_family_id>[\d]+)/font-faces/(?P<id>[\d]+)/autosaves',
			$routes,
			'Font faces autosaves route exists.'
		);
		$this->assertArrayNotHasKey(
			'/wp/v2/font-families/(?P<font_family_id>[\d]+)/font-faces/(?P<parent>[\d]+)/autosaves/(?P<id>[\d]+)',
			$routes,
			'Font faces autosaves by id route exists.'
		);
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// See test_get_context_param().
	}

	/**
	 * @dataProvider data_get_context_param
	 *
	 * @covers WP_REST_Font_Faces_Controller::get_context_param
	 *
	 * @param bool $single_route Whether to test a single route.
	 */
	public function test_get_context_param( $single_route ) {
		$route = '/wp/v2/font-families/' . self::$font_family_id . '/font-faces';
		if ( $single_route ) {
			$route .= '/' . self::$font_face_id1;
		}

		$request  = new WP_REST_Request( 'OPTIONS', $route );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$endpoint_data = $data['endpoints'][0];
		$this->assertArrayNotHasKey( 'allow_batch', $endpoint_data, 'The allow_batch property should not exist in the endpoint data.' );
		$this->assertSame( 'view', $endpoint_data['args']['context']['default'], 'The endpoint\'s args::context::default should be set to view.' );
		$this->assertSame( array( 'view', 'embed', 'edit' ), $endpoint_data['args']['context']['enum'], 'The endpoint\'s args::context::enum should be set to [ view, embed, edit ].' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_context_param() {
		return array(
			'Collection' => array( false ),
			'Single'     => array( true ),
		);
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_items
	 */
	public function test_get_items() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'The response status should be 200' );
		$this->assertCount( 2, $data, 'There should be 2 properties in the response data.' );
		$this->assertArrayHasKey( '_links', $data[0], 'The _links property should exist in the response data 0.' );
		$this->check_font_face_data( $data[0], self::$font_face_id2, $data[0]['_links'] );
		$this->assertArrayHasKey( '_links', $data[1], 'The _links property should exist in the response data 1.' );
		$this->check_font_face_data( $data[1], self::$font_face_id1, $data[1]['_links'] );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_items
	 */
	public function test_get_items_no_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 401, 'The response should return an error with a "rest_cannot_read" code and 401 status.' );

		wp_set_current_user( self::$editor_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 403, 'The response should return an error with a "rest_cannot_read" code and 403 status.' );
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
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'The response status should be 200.' );
		$this->check_font_face_data( $data, self::$font_face_id1, $response->get_links() );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::prepare_item_for_response
	 */
	public function test_get_item_removes_extra_settings() {
		$font_face_id = self::create_font_face_post( self::$font_family_id, array( 'extra' => array() ) );

		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . $font_face_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'The response status should be 200.' );
		$this->assertArrayHasKey( 'font_face_settings', $data, 'The font_face_settings property should exist in the response data.' );
		$this->assertArrayNotHasKey( 'extra', $data['font_face_settings'], 'The extra property should exist in the font_face_settings data.' );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::prepare_item_for_response
	 */
	public function test_get_item_malformed_post_content_returns_empty_settings() {
		$font_face_id = wp_insert_post(
			array(
				'post_type'    => 'wp_font_face',
				'post_parent'  => self::$font_family_id,
				'post_status'  => 'publish',
				'post_content' => 'invalid',
			)
		);

		self::$post_ids_for_cleanup[] = $font_face_id;

		$empty_settings = array(
			'fontFamily' => '',
			'src'        => array(),
		);

		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . $font_face_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'The response status should be 200.' );
		$this->assertArrayHasKey( 'font_face_settings', $data, 'The font_face_settings property should exist in the response data.' );
		$this->assertSame( $empty_settings, $data['font_face_settings'], 'The empty settings should exist in the font_face_settings data.' );
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
		$this->assertErrorResponse( 'rest_cannot_read', $response, 401, 'The response should return an error with a "rest_cannot_read" code and 401 status.' );

		wp_set_current_user( self::$editor_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 403, 'The response should return an error with a "rest_cannot_read" code and 403 status.' );
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

		$this->assertSame( 200, $response->get_status(), 'The response status should be 200.' );
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
					'fontFamily' => '"Open Sans"',
					'fontWeight' => '200',
					'fontStyle'  => 'normal',
					'src'        => array_keys( $files )[0],
				)
			)
		);
		$request->set_file_params( $files );

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status(), 'The response status should be 201.' );
		$this->check_font_face_data( $data, $data['id'], $response->get_links() );
		$this->check_file_meta( $data['id'], array( $data['font_face_settings']['src'] ) );

		$settings = $data['font_face_settings'];
		unset( $settings['src'] );
		$this->assertSame(
			$settings,
			array(
				'fontFamily' => '"Open Sans"',
				'fontWeight' => '200',
				'fontStyle'  => 'normal',
			),
			'The font_face_settings data should match the expected data.'
		);

		$this->assertSame( self::$font_family_id, $data['parent'], 'The returned parent id should match the font family id.' );
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
					'fontFamily' => '"Open Sans"',
					'fontWeight' => '200',
					'fontStyle'  => 'normal',
					'src'        => array_keys( $files ),
				)
			)
		);
		$request->set_file_params( $files );

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status(), 'The response status should be 201.' );
		$this->check_font_face_data( $data, $data['id'], $response->get_links() );
		$this->check_file_meta( $data['id'], $data['font_face_settings']['src'] );

		$settings = $data['font_face_settings'];
		$this->assertCount( 4, $settings['src'], 'There should be 4 items in the font_face_settings::src data.' );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::create_item
	 */
	public function test_create_item_invalid_file_type() {
		$image_file = DIR_TESTDATA . '/images/canola.jpg';
		$image_path = wp_tempnam( 'canola.jpg' );
		copy( $image_file, $image_path );

		$files = array(
			'file-0' => array(
				'name'      => 'canola.jpg',
				'full_path' => 'canola.jpg',
				'type'      => 'font/woff2',
				'tmp_name'  => $image_path,
				'error'     => 0,
				'size'      => filesize( $image_path ),
			),
		);

		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$request->set_param( 'theme_json_version', 2 );
		$request->set_param(
			'font_face_settings',
			wp_json_encode(
				array_merge(
					self::$default_settings,
					array(
						'fontWeight' => '200',
						'src'        => array_keys( $files )[0],
					)
				)
			)
		);
		$request->set_file_params( $files );

		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_font_upload_invalid_file_type', $response, 400 );
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
					'fontFamily' => '"Open Sans"',
					'fontWeight' => '200',
					'fontStyle'  => 'normal',
					'src'        => 'https://fonts.gstatic.com/s/open-sans/v30/KFOkCnqEu92Fr1MmgWxPKTM1K9nz.ttf',
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status(), 'The response status should be 201.' );
		$this->check_font_face_data( $data, $data['id'], $response->get_links() );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::create_item
	 */
	public function test_create_item_with_all_properties() {
		wp_set_current_user( self::$admin_id );

		$properties = array(
			'fontFamily'            => '"Open Sans"',
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
		wp_delete_post( $data['id'], true );

		$this->assertSame( 201, $response->get_status(), 'The response status should be 201.' );
		$this->assertArrayHasKey( 'font_face_settings', $data, 'The font_face_settings property should exist in the response data.' );
		$this->assertSame( $properties, $data['font_face_settings'], 'The font_face_settings should match the expected properties.' );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::create_item
	 */
	public function test_create_item_missing_parent() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER . '/font-faces' );
		$request->set_param(
			'font_face_settings',
			wp_json_encode( array_merge( self::$default_settings, array( 'fontWeight' => '100' ) ) )
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_post_invalid_parent', $response, 404 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::create_item
	 */
	public function test_create_item_with_duplicate_properties() {
		$settings = array(
			'fontFamily' => '"Open Sans"',
			'fontWeight' => '200',
			'fontStyle'  => 'italic',
			'src'        => home_url( '/wp-content/fonts/open-sans-italic-light.ttf' ),
		);
		self::create_font_face_post( self::$font_family_id, $settings );

		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$request->set_param( 'font_face_settings', wp_json_encode( $settings ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_duplicate_font_face', $response, 400, 'The response should return an error for "rest_duplicate_font_face" with 400 status.' );
		$expected_message = 'A font face matching those settings already exists.';
		$message          = $response->as_error()->get_error_messages()[0];
		$this->assertSame( $expected_message, $message, 'The response error message should match.' );
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
					'fontFamily' => '"Open Sans"',
					'fontWeight' => '200',
					'src'        => 'https://fonts.gstatic.com/s/open-sans/v30/KFOkCnqEu92Fr1MmgWxPKTM1K9nz.ttf',
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		wp_delete_post( $data['id'], true );

		$this->assertSame( 201, $response->get_status(), 'The response status should be 201.' );
		$this->assertArrayHasKey( 'theme_json_version', $data, 'The theme_json_version property should exist in the response data.' );
		$this->assertSame( 2, $data['theme_json_version'], 'The default theme.json version should be 2.' );
	}

	/**
	 * @dataProvider data_create_item_invalid_theme_json_version
	 *
	 * @covers WP_REST_Font_Faces_Controller::create_item
	 *
	 * @param int $theme_json_version Version input to test.
	 */
	public function test_create_item_invalid_theme_json_version( $theme_json_version ) {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$request->set_param( 'theme_json_version', $theme_json_version );
		$request->set_param( 'font_face_settings', '' );

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
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
	 *
	 * @param mixed $settings Settings to test.
	 */
	public function test_create_item_invalid_settings( $settings ) {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$request->set_param( 'theme_json_version', 2 );
		$request->set_param( 'font_face_settings', wp_json_encode( $settings ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_create_item_invalid_settings() {
		return array(
			'Missing fontFamily'     => array(
				'settings' => array_diff_key( self::$default_settings, array( 'fontFamily' => '' ) ),
			),
			'Empty fontFamily'       => array(
				'settings' => array_merge( self::$default_settings, array( 'fontFamily' => '' ) ),
			),
			'Wrong fontFamily type'  => array(
				'settings' => array_merge( self::$default_settings, array( 'fontFamily' => 1234 ) ),
			),
			'Invalid fontDisplay'    => array(
				'settings' => array_merge( self::$default_settings, array( 'fontDisplay' => 'invalid' ) ),
			),
			'Missing src'            => array(
				'settings' => array_diff_key( self::$default_settings, array( 'src' => '' ) ),
			),
			'Empty src string'       => array(
				'settings' => array_merge( self::$default_settings, array( 'src' => '' ) ),
			),
			'Empty src array'        => array(
				'settings' => array_merge( self::$default_settings, array( 'src' => array() ) ),
			),
			'Empty src array values' => array(
				'settings' => array_merge( self::$default_settings, array( '', '' ) ),
			),
			'Wrong src type'         => array(
				'settings' => array_merge( self::$default_settings, array( 'src' => 1234 ) ),
			),
			'Wrong src array types'  => array(
				'settings' => array_merge( self::$default_settings, array( 'src' => array( 1234, 5678 ) ) ),
			),
		);
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::validate_create_font_face_settings
	 */
	public function test_create_item_invalid_settings_json() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$request->set_param( 'theme_json_version', 2 );
		$request->set_param( 'font_face_settings', 'invalid' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400, 'The response should return an error for "rest_invalid_param" with 400 status.' );
		$expected_message = 'font_face_settings parameter must be a valid JSON string.';
		$message          = $response->as_error()->get_all_error_data()[0]['params']['font_face_settings'];
		$this->assertSame( $expected_message, $message, 'The response error message should match.' );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::validate_create_font_face_settings
	 */
	public function test_create_item_invalid_file_src() {
		$files = $this->setup_font_file_upload( array( 'woff2' ) );

		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$request->set_param( 'theme_json_version', 2 );
		$request->set_param(
			'font_face_settings',
			wp_json_encode(
				array_merge( self::$default_settings, array( 'src' => 'invalid' ) )
			)
		);
		$request->set_file_params( $files );

		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400, 'The response should return an error for "rest_invalid_param" with 400 status.' );
		$expected_message = 'File ' . array_keys( $files )[0] . ' must be used in font_face_settings[src].';
		$message          = $response->as_error()->get_all_error_data()[0]['params']['font_face_settings'];
		$this->assertSame( $expected_message, $message, 'The response error message should match.' );
	}

	/**
	 * @dataProvider data_create_item_santize_font_family
	 *
	 * @covers WP_REST_Font_Face_Controller::sanitize_font_face_settings
	 *
	 * @param string $font_family_setting Setting to test.
	 * @param string $expected            Expected result.
	 */
	public function test_create_item_santize_font_family( $font_family_setting, $expected ) {
		$settings = array_merge( self::$default_settings, array( 'fontFamily' => $font_family_setting ) );

		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$request->set_param( 'font_face_settings', wp_json_encode( $settings ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status(), 'The response status should be 201.' );
		$this->assertSame( $expected, $data['font_face_settings']['fontFamily'], 'The response fontFamily should match.' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_create_item_santize_font_family() {
		return array(
			'multiword font with integer' => array(
				'font_family_setting' => 'Libre Barcode 128 Text',
				'expected'            => '"Libre Barcode 128 Text"',
			),
			'multiword font'              => array(
				'font_family_setting' => 'B612 Mono',
				'expected'            => '"B612 Mono"',
			),
			'comma-separated fonts'       => array(
				'font_family_setting' => 'Open Sans, Noto Sans, sans-serif',
				'expected'            => '"Open Sans", "Noto Sans", sans-serif',
			),
		);
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::create_item
	 */
	// public function test_create_item_no_permission() {}

	/**
	 * @covers WP_REST_Font_Faces_Controller::update_item
	 */
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
		$font_face_id = self::create_font_face_post( self::$font_family_id );
		$request      = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . $font_face_id );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status(), 'The response status should be 201.' );
		$this->assertNull( get_post( $font_face_id ), 'The deleted post should not exist.' );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::delete_item
	 */
	public function test_delete_item_no_trash() {
		wp_set_current_user( self::$admin_id );
		$font_face_id = self::create_font_face_post( self::$font_family_id );

		// Attempt trashing.
		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . $font_face_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_trash_not_supported', $response, 501, 'The response should return an error for "rest_trash_not_supported" with 501 status.' );

		$request->set_param( 'force', 'false' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_trash_not_supported', $response, 501, 'When "force" is false, the response should return an error for "rest_trash_not_supported" with 501 status.' );

		// Ensure the post still exists.
		$post = get_post( $font_face_id );
		$this->assertNotEmpty( $post, 'The post should still exists.' );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::delete_item
	 */
	public function test_delete_item_invalid_font_face_id() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_id', $response, 404 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::delete
	 */
	public function test_delete_item_missing_parent() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER . '/font-faces/' . self::$font_face_id1 );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_post_invalid_parent', $response, 404 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_item
	 */
	public function test_delete_item_invalid_parent_id() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . self::$other_font_family_id . '/font-faces/' . self::$font_face_id1 );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_font_face_parent_id_mismatch', $response, 404, 'The response should return an error for "rest_font_face_parent_id_mismatch" with 404 status.' );

		$expected_message = 'The font face does not belong to the specified font family with id of "' . self::$other_font_family_id . '"';
		$this->assertSame( $expected_message, $response->as_error()->get_error_messages()[0], 'The message must contain the correct parent ID.' );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::delete_item
	 */
	public function test_delete_item_no_permissions() {
		$font_face_id = $this->create_font_face_post( self::$font_family_id );

		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . $font_face_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_delete', $response, 401, 'The response should return an error for "rest_cannot_delete" with 401 status for an invalid user.' );

		wp_set_current_user( self::$editor_id );
		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . $font_face_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_delete', $response, 403, 'The response should return an error for "rest_cannot_delete" with 403 status for a user without permission.' );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::prepare_item_for_response
	 */
	public function test_prepare_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces/' . self::$font_face_id2 );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'The response status should be 200.' );
		$this->check_font_face_data( $data, self::$font_face_id2, $response->get_links() );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_item_schema
	 */
	public function test_get_item_schema() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/font-families/' . self::$font_family_id . '/font-faces' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'The response status should be 200.' );
		$properties = $data['schema']['properties'];
		$this->assertCount( 4, $properties, 'There should be 4 properties in the schema::properties data.' );
		$this->assertArrayHasKey( 'id', $properties, 'The id property should exist in the schema::properties data.' );
		$this->assertArrayHasKey( 'theme_json_version', $properties, 'The id property should exist in the schema::properties data.' );
		$this->assertArrayHasKey( 'parent', $properties, 'The id property should exist in the schema::properties data.' );
		$this->assertArrayHasKey( 'font_face_settings', $properties, 'The id property should exist in the schema::properties data.' );
	}

	protected function check_font_face_data( $data, $post_id, $links ) {
		self::$post_ids_for_cleanup[] = $post_id;
		$post                         = get_post( $post_id );

		$this->assertArrayHasKey( 'id', $data, 'The id property should exist in response data.' );
		$this->assertSame( $post->ID, $data['id'], 'The "id" from the response data should match the post ID.' );

		$this->assertArrayHasKey( 'parent', $data, 'The parent property should exist in response data.' );
		$this->assertSame( $post->post_parent, $data['parent'], 'The "parent" from the response data should match the post parent.' );

		$this->assertArrayHasKey( 'theme_json_version', $data, 'The theme_json_version property should exist in response data.' );
		$this->assertSame( WP_Theme_JSON::LATEST_SCHEMA, $data['theme_json_version'], 'The "theme_json_version" from the response data should match WP_Theme_JSON::LATEST_SCHEMA.' );

		$this->assertArrayHasKey( 'font_face_settings', $data, 'The font_face_settings property should exist in response data.' );
		$this->assertSame( $post->post_content, wp_json_encode( $data['font_face_settings'] ), 'The encoded "font_face_settings" from the response data should match the post content.' );

		$this->assertNotEmpty( $links, 'The links should not be empty in the response data.' );
		$expected = rest_url( 'wp/v2/font-families/' . $post->post_parent . '/font-faces/' . $post->ID );
		$this->assertSame( $expected, $links['self'][0]['href'], 'The links URL from the response data should match the post\'s REST endpoint.' );
		$expected = rest_url( 'wp/v2/font-families/' . $post->post_parent . '/font-faces' );
		$this->assertSame( $expected, $links['collection'][0]['href'], 'The links collection URL from the response data should match the REST endpoint.' );
		$expected = rest_url( 'wp/v2/font-families/' . $post->post_parent );
		$this->assertSame( $expected, $links['parent'][0]['href'], 'The links for a parent URL from the response data should match the parent\'s REST endpoint.' );
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
			// @core-merge Use `DIR_TESTDATA` instead of `GUTENBERG_DIR_TESTDATA`.
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
