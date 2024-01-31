<?php
/**
 * Unit tests covering WP_REST_Font_Families_Controller_Test functionality.
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.5.0
 *
 * @group restapi
 *
 * @coversDefaultClass WP_REST_Font_Families_Controller
 */
class Tests_REST_WpRestFontFamiliesController extends WP_Test_REST_Controller_Testcase {
	protected static $admin_id;
	protected static $editor_id;

	protected static $font_family_id1;
	protected static $font_family_id2;

	protected static $font_face_id1;
	protected static $font_face_id2;

	protected static $default_settings = array(
		'name'       => 'Open Sans',
		'slug'       => 'open-sans',
		'fontFamily' => '"Open Sans", sans-serif',
		'preview'    => 'https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-400-normal.svg',
	);

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
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

		self::$font_family_id1 = self::create_font_family_post(
			array(
				'name'       => 'Open Sans',
				'slug'       => 'open-sans',
				'fontFamily' => '"Open Sans", sans-serif',
				'preview'    => 'https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-400-normal.svg',
			)
		);
		self::$font_family_id2 = self::create_font_family_post(
			array(
				'name'       => 'Helvetica',
				'slug'       => 'helvetica',
				'fontFamily' => 'Helvetica, Arial, sans-serif',
			)
		);
		self::$font_face_id1   = Tests_REST_WpRestFontFacesController::create_font_face_post(
			self::$font_family_id1,
			array(
				'fontFamily' => '"Open Sans"',
				'fontWeight' => '400',
				'fontStyle'  => 'normal',
				'src'        => home_url( '/wp-content/fonts/open-sans-medium.ttf' ),
			)
		);
		self::$font_face_id2   = Tests_REST_WpRestFontFacesController::create_font_face_post(
			self::$font_family_id1,
			array(
				'fontFamily' => '"Open Sans"',
				'fontWeight' => '900',
				'fontStyle'  => 'normal',
				'src'        => home_url( '/wp-content/fonts/open-sans-bold.ttf' ),
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
	}

	public static function create_font_family_post( $settings = array() ) {
		$settings = array_merge( self::$default_settings, $settings );
		return self::factory()->post->create(
			wp_slash(
				array(
					'post_type'    => 'wp_font_family',
					'post_status'  => 'publish',
					'post_title'   => $settings['name'],
					'post_name'    => $settings['slug'],
					'post_content' => wp_json_encode(
						array(
							'fontFamily' => $settings['fontFamily'],
							'preview'    => $settings['preview'],
						)
					),
				)
			)
		);
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey(
			'/wp/v2/font-families',
			$routes,
			'Font faces collection for the given font family does not exist'
		);
		$this->assertCount(
			2,
			$routes['/wp/v2/font-families'],
			'Font faces collection for the given font family does not have exactly two elements'
		);
		$this->assertArrayHasKey(
			'/wp/v2/font-families/(?P<id>[\d]+)',
			$routes,
			'Single font face route for the given font family does not exist'
		);
		$this->assertCount(
			3,
			$routes['/wp/v2/font-families/(?P<id>[\d]+)'],
			'Font faces collection for the given font family does not have exactly two elements'
		);
	}

	public function test_font_families_no_autosave_routes() {
		// @core-merge: Enable this test.
		$this->markTestSkipped( 'This test only works with WP 6.4 and above. Enable it once 6.5 is released.' );
		$routes = rest_get_server()->get_routes();
		$this->assertArrayNotHasKey(
			'/wp/v2/font-families/(?P<id>[\d]+)/autosaves',
			$routes,
			'Font families autosaves route exists.'
		);
		$this->assertArrayNotHasKey(
			'/wp/v2/font-families/(?P<parent>[\d]+)/autosaves/(?P<id>[\d]+)',
			$routes,
			'Font families autosaves by id route exists.'
		);
	}

	/**
	 * @covers WP_REST_Font_Families_Controller::get_context_param
	 */
	public function test_context_param() {
		// Collection.
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/font-families' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertArrayNotHasKey( 'allow_batch', $data['endpoints'][0] );
		$this->assertSame( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertSame( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );

		// Single.
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/font-families/' . self::$font_family_id1 );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertArrayNotHasKey( 'allow_batch', $data['endpoints'][0] );
		$this->assertSame( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertSame( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}


	/**
	 * @covers WP_REST_Font_Faces_Controller::get_items
	 */
	public function test_get_items() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 2, $data );
		$this->assertArrayHasKey( '_links', $data[0] );
		$this->check_font_family_data( $data[0], self::$font_family_id2, $data[0]['_links'] );
		$this->assertArrayHasKey( '_links', $data[1] );
		$this->check_font_family_data( $data[1], self::$font_family_id1, $data[1]['_links'] );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_items
	 */
	public function test_get_items_by_slug() {
		$font_family = get_post( self::$font_family_id2 );

		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/font-families' );
		$request->set_param( 'slug', $font_family->post_name );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 1, $data );
		$this->assertSame( $font_family->ID, $data[0]['id'] );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_items
	 */
	public function test_get_items_no_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 401 );

		wp_set_current_user( self::$editor_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 403 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_item
	 */
	public function test_get_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id1 );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->check_font_family_data( $data, self::$font_family_id1, $response->get_links() );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::prepare_item_for_response
	 */
	public function test_get_item_embedded_font_faces() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id1 );
		$request->set_param( '_embed', true );
		$response = rest_get_server()->dispatch( $request );
		$data     = rest_get_server()->response_to_data( $response, true );

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( '_embedded', $data );
		$this->assertArrayHasKey( 'font_faces', $data['_embedded'] );
		$this->assertCount( 2, $data['_embedded']['font_faces'] );

		foreach ( $data['_embedded']['font_faces'] as $font_face ) {
			$this->assertArrayHasKey( 'id', $font_face );

			$font_face_request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id1 . '/font-faces/' . $font_face['id'] );
			$font_face_response = rest_get_server()->dispatch( $font_face_request );
			$font_face_data     = rest_get_server()->response_to_data( $font_face_response, true );

			$this->assertSame( $font_face_data, $font_face );
		}
	}

	/**
	 * @covers WP_REST_Font_Families_Controller::get_item
	 */
	public function test_get_item_removes_extra_settings() {
		$font_family_id = self::create_font_family_post( array( 'fontFace' => array() ) );

		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . $font_family_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayNotHasKey( 'fontFace', $data['font_family_settings'] );

		wp_delete_post( $font_family_id, true );
	}

	/**
	 * @covers WP_REST_Font_Families_Controller::prepare_item_for_response
	 */
	public function test_get_item_malformed_post_content_returns_empty_settings() {
		$font_family_id = wp_insert_post(
			array(
				'post_type'    => 'wp_font_family',
				'post_status'  => 'publish',
				'post_content' => 'invalid',
			)
		);

		$empty_settings = array(
			'name'       => '',
			// Slug will default to the post id.
			'slug'       => (string) $font_family_id,
			'fontFamily' => '',
			'preview'    => '',
		);

		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . $font_family_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $empty_settings, $data['font_family_settings'] );

		wp_delete_post( $font_family_id, true );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_item
	 */
	public function test_get_item_invalid_font_family_id() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_id', $response, 404 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_item
	 */
	public function test_get_item_no_permission() {
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id1 );

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 401 );

		wp_set_current_user( self::$editor_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 403 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::create_item
	 */
	public function test_create_item() {
		$settings = array_merge( self::$default_settings, array( 'slug' => 'open-sans-2' ) );

		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$request->set_param( 'theme_json_version', 2 );
		$request->set_param( 'font_family_settings', wp_json_encode( $settings ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->check_font_family_data( $data, $data['id'], $response->get_links() );

		$reponse_settings = $data['font_family_settings'];
		$this->assertSame( $settings, $reponse_settings );
		$this->assertEmpty( $data['font_faces'] );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::validate_create_font_face_request
	 */
	public function test_create_item_default_theme_json_version() {
		$settings = array_merge( self::$default_settings, array( 'slug' => 'open-sans-2' ) );
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$request->set_param( 'font_family_settings', wp_json_encode( $settings ) );

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->assertArrayHasKey( 'theme_json_version', $data );
		$this->assertSame( 2, $data['theme_json_version'], 'The default theme.json version should be 2.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * @dataProvider data_create_item_invalid_theme_json_version
	 *
	 * @covers WP_REST_Font_Faces_Controller::create_item
	 */
	public function test_create_item_invalid_theme_json_version( $theme_json_version ) {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$request->set_param( 'theme_json_version', $theme_json_version );
		$request->set_param( 'font_family_settings', wp_json_encode( self::$default_settings ) );

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
	 * @dataProvider data_create_item_with_default_preview
	 *
	 * @covers WP_REST_Font_Faces_Controller::sanitize_font_family_settings
	 */
	public function test_create_item_with_default_preview( $settings ) {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$request->set_param( 'theme_json_version', 2 );
		$request->set_param( 'font_family_settings', wp_json_encode( $settings ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$response_settings = $data['font_family_settings'];
		$this->assertArrayHasKey( 'preview', $response_settings );
		$this->assertSame( '', $response_settings['preview'] );

		wp_delete_post( $data['id'], true );
	}

	public function data_create_item_with_default_preview() {
		$default_settings = array(
			'name'       => 'Open Sans',
			'slug'       => 'open-sans-2',
			'fontFamily' => '"Open Sans", sans-serif',
		);
		return array(
			'No preview param' => array(
				'settings' => $default_settings,
			),
			'Empty preview'    => array(
				'settings' => array_merge( $default_settings, array( 'preview' => '' ) ),
			),
		);
	}

	/**
	 * @dataProvider data_create_item_invalid_settings
	 *
	 * @covers WP_REST_Font_Faces_Controller::validate_create_font_face_settings
	 */
	public function test_create_item_invalid_settings( $settings ) {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$request->set_param( 'theme_json_version', 2 );
		$request->set_param( 'font_family_settings', wp_json_encode( $settings ) );

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function data_create_item_invalid_settings() {
		return array(
			'Missing name'          => array(
				'settings' => array_diff_key( self::$default_settings, array( 'name' => '' ) ),
			),
			'Empty name'            => array(
				'settings' => array_merge( self::$default_settings, array( 'name' => '' ) ),
			),
			'Wrong name type'       => array(
				'settings' => array_merge( self::$default_settings, array( 'name' => 1234 ) ),
			),
			'Missing slug'          => array(
				'settings' => array_diff_key( self::$default_settings, array( 'slug' => '' ) ),
			),
			'Empty slug'            => array(
				'settings' => array_merge( self::$default_settings, array( 'slug' => '' ) ),
			),
			'Wrong slug type'       => array(
				'settings' => array_merge( self::$default_settings, array( 'slug' => 1234 ) ),
			),
			'Missing fontFamily'    => array(
				'settings' => array_diff_key( self::$default_settings, array( 'fontFamily' => '' ) ),
			),
			'Empty fontFamily'      => array(
				'settings' => array_merge( self::$default_settings, array( 'fontFamily' => '' ) ),
			),
			'Wrong fontFamily type' => array(
				'settings' => array_merge( self::$default_settings, array( 'fontFamily' => 1234 ) ),
			),
		);
	}

	/**
	 * @covers WP_REST_Font_Family_Controller::validate_font_family_settings
	 */
	public function test_create_item_invalid_settings_json() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$request->set_param( 'theme_json_version', 2 );
		$request->set_param( 'font_family_settings', 'invalid' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$expected_message = 'font_family_settings parameter must be a valid JSON string.';
		$message          = $response->as_error()->get_all_error_data()[0]['params']['font_family_settings'];
		$this->assertSame( $expected_message, $message );
	}

	/**
	 * @covers WP_REST_Font_Family_Controller::create_item
	 */
	public function test_create_item_with_duplicate_slug() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$request->set_param( 'theme_json_version', 2 );
		$request->set_param( 'font_family_settings', wp_json_encode( array_merge( self::$default_settings, array( 'slug' => 'helvetica' ) ) ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_duplicate_font_family', $response, 400 );
		$expected_message = 'A font family with slug "helvetica" already exists.';
		$message          = $response->as_error()->get_error_messages()[0];
		$this->assertSame( $expected_message, $message );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::create_item
	 */
	public function test_create_item_no_permission() {
		$settings = array_merge( self::$default_settings, array( 'slug' => 'open-sans-2' ) );
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$request->set_param( 'font_family_settings', wp_json_encode( $settings ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_create', $response, 401 );

		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families' );
		$request->set_param(
			'font_family_settings',
			wp_json_encode(
				array(
					'name'       => 'Open Sans',
					'slug'       => 'open-sans',
					'fontFamily' => '"Open Sans", sans-serif',
					'preview'    => 'https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-400-normal.svg',
				)
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_create', $response, 403 );
	}

	/**
	 * @covers WP_REST_Font_Families_Controller::update_item
	 */
	public function test_update_item() {
		wp_set_current_user( self::$admin_id );

		$settings = array(
			'name'       => 'Open Sans',
			'fontFamily' => '"Open Sans, "Noto Sans", sans-serif',
			'preview'    => 'https://s.w.org/images/fonts/16.9/previews/open-sans/open-sans-400-normal.svg',
		);

		$font_family_id = self::create_font_family_post( array( 'slug' => 'open-sans-2' ) );
		$request        = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . $font_family_id );
		$request->set_param(
			'font_family_settings',
			wp_json_encode( $settings )
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->check_font_family_data( $data, $font_family_id, $response->get_links() );

		$expected_settings = array(
			'name'       => $settings['name'],
			'slug'       => 'open-sans-2',
			'fontFamily' => $settings['fontFamily'],
			'preview'    => $settings['preview'],
		);
		$this->assertSame( $expected_settings, $data['font_family_settings'] );

		wp_delete_post( $font_family_id, true );
	}

	/**
	 * @dataProvider data_update_item_individual_settings
	 * @covers WP_REST_Font_Families_Controller::update_item
	 */
	public function test_update_item_individual_settings( $settings ) {
		wp_set_current_user( self::$admin_id );

		$font_family_id = self::create_font_family_post();
		$request        = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . $font_family_id );
		$request->set_param( 'font_family_settings', wp_json_encode( $settings ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$key   = key( $settings );
		$value = current( $settings );
		$this->assertArrayHasKey( $key, $data['font_family_settings'] );
		$this->assertSame( $value, $data['font_family_settings'][ $key ] );

		wp_delete_post( $font_family_id, true );
	}

	public function data_update_item_individual_settings() {
		return array(
			array( array( 'name' => 'Opened Sans' ) ),
			array( array( 'fontFamily' => '"Opened Sans", sans-serif' ) ),
			array( array( 'preview' => 'https://s.w.org/images/fonts/16.7/previews/opened-sans/opened-sans-400-normal.svg' ) ),
			// Empty preview is allowed.
			array( array( 'preview' => '' ) ),
		);
	}

		/**
	 * @dataProvider data_update_item_santize_font_family
	 *
	 * @covers WP_REST_Font_Families_Controller::sanitize_font_face_settings
	 */
	public function test_update_item_santize_font_family( $font_family_setting, $expected ) {
		wp_set_current_user( self::$admin_id );

		$font_family_id = self::create_font_family_post();
		$request        = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . $font_family_id );
		$request->set_param( 'font_family_settings', wp_json_encode( array( 'fontFamily' => $font_family_setting ) ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $expected, $data['font_family_settings']['fontFamily'] );

		wp_delete_post( $font_family_id, true );
	}

	public function data_update_item_santize_font_family() {
		return array(
			array( 'Libre Barcode 128 Text', '"Libre Barcode 128 Text"' ),
			array( 'B612 Mono', '"B612 Mono"' ),
			array( 'Open Sans, Noto Sans, sans-serif', '"Open Sans", "Noto Sans", sans-serif' ),
		);
	}

	/**
	 * @dataProvider data_update_item_invalid_settings
	 *
	 * @covers WP_REST_Font_Faces_Controller::update_item
	 */
	public function test_update_item_empty_settings( $settings ) {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id1 );
		$request->set_param(
			'font_family_settings',
			wp_json_encode( $settings )
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function data_update_item_invalid_settings() {
		return array(
			'Empty name'            => array(
				array( 'name' => '' ),
			),
			'Wrong name type'       => array(
				array( 'name' => 1234 ),
			),
			'Empty fontFamily'      => array(
				array( 'fontFamily' => '' ),
			),
			'Wrong fontFamily type' => array(
				array( 'fontFamily' => 1234 ),
			),
		);
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::update_item
	 */
	public function test_update_item_update_slug_not_allowed() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id1 );
		$request->set_param(
			'font_family_settings',
			wp_json_encode( array( 'slug' => 'new-slug' ) )
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$expected_message = 'font_family_settings[slug] cannot be updated.';
		$message          = $response->as_error()->get_all_error_data()[0]['params']['font_family_settings'];
		$this->assertSame( $expected_message, $message );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::update_item
	 */
	public function test_update_item_invalid_font_family_id() {
		$settings = array_diff_key( self::$default_settings, array( 'slug' => '' ) );

		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$request->set_param( 'font_family_settings', wp_json_encode( $settings ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_id', $response, 404 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::update_item
	 */
	public function test_update_item_no_permission() {
		$settings = array_diff_key( self::$default_settings, array( 'slug' => '' ) );

		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id1 );
		$request->set_param( 'font_family_settings', wp_json_encode( $settings ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 401 );

		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . self::$font_family_id1 );
		$request->set_param( 'font_family_settings', wp_json_encode( $settings ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}


	/**
	 * @covers WP_REST_Font_Faces_Controller::delete_item
	 */
	public function test_delete_item() {
		wp_set_current_user( self::$admin_id );
		$font_family_id   = self::create_font_family_post();
		$request          = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . $font_family_id );
		$request['force'] = true;
		$response         = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNull( get_post( $font_family_id ) );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::delete_item
	 */
	public function test_delete_item_no_trash() {
		wp_set_current_user( self::$admin_id );
		$font_family_id = self::create_font_family_post();

		// Attempt trashing.
		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . $font_family_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_trash_not_supported', $response, 501 );

		$request->set_param( 'force', 'false' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_trash_not_supported', $response, 501 );

		// Ensure the post still exists.
		$post = get_post( $font_family_id );
		$this->assertNotEmpty( $post );

		wp_delete_post( $font_family_id, true );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::delete_item
	 */
	public function test_delete_item_invalid_font_family_id() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_id', $response, 404 );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::delete_item
	 */
	public function test_delete_item_no_permissions() {
		$font_family_id = self::create_font_family_post();

		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . $font_family_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_delete', $response, 401 );

		wp_set_current_user( self::$editor_id );
		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/font-families/' . $font_family_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_delete', $response, 403 );

		wp_delete_post( $font_family_id, true );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::prepare_item_for_response
	 */
	public function test_prepare_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . self::$font_family_id2 );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->check_font_family_data( $data, self::$font_family_id2, $response->get_links() );
	}

	/**
	 * @covers WP_REST_Font_Faces_Controller::get_item_schema
	 */
	public function test_get_item_schema() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/font-families' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$properties = $data['schema']['properties'];
		$this->assertCount( 4, $properties );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'theme_json_version', $properties );
		$this->assertArrayHasKey( 'font_faces', $properties );
		$this->assertArrayHasKey( 'font_family_settings', $properties );
	}

	protected function check_font_family_data( $data, $post_id, $links ) {
		$post = get_post( $post_id );

		$this->assertArrayHasKey( 'id', $data );
		$this->assertSame( $post->ID, $data['id'] );

		$this->assertArrayHasKey( 'theme_json_version', $data );
		$this->assertSame( WP_Theme_JSON::LATEST_SCHEMA, $data['theme_json_version'] );

		$font_face_ids = get_children(
			array(
				'fields'      => 'ids',
				'post_parent' => $post_id,
				'post_type'   => 'wp_font_face',
				'order'       => 'ASC',
				'orderby'     => 'ID',
			)
		);
		$this->assertArrayHasKey( 'font_faces', $data );

		foreach ( $font_face_ids as $font_face_id ) {
			$this->assertContains( $font_face_id, $data['font_faces'] );
		}

		$this->assertArrayHasKey( 'font_family_settings', $data );
		$settings          = $data['font_family_settings'];
		$expected_settings = array(
			'name'       => $post->post_title,
			'slug'       => $post->post_name,
			'fontFamily' => $settings['fontFamily'],
			'preview'    => $settings['preview'],
		);
		$this->assertSame( $expected_settings, $settings );

		$this->assertNotEmpty( $links );
		$this->assertSame( rest_url( 'wp/v2/font-families/' . $post->ID ), $links['self'][0]['href'] );
		$this->assertSame( rest_url( 'wp/v2/font-families' ), $links['collection'][0]['href'] );

		if ( ! $font_face_ids ) {
			return;
		}

		// Check font_face links, if present.
		$this->assertArrayHasKey( 'font_faces', $links );
		foreach ( $links['font_faces'] as $index => $link ) {
			$this->assertSame( rest_url( 'wp/v2/font-families/' . $post->ID . '/font-faces/' . $font_face_ids[ $index ] ), $link['href'] );

			$embeddable = isset( $link['attributes']['embeddable'] )
				? $link['attributes']['embeddable']
				: $link['embeddable'];
			$this->assertTrue( $embeddable );
		}
	}
}
