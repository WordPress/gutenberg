<?php
// @core-merge: Do not include these tests, they are for Gutenberg only.

/**
 * Tests the file_status field added by Gutenberg_REST_Font_Faces_Controller_7_0.
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers Gutenberg_REST_Font_Faces_Controller_7_0
 */
class Tests_Font_Face_File_Status extends WP_UnitTestCase {
	/**
	 * ID of a super admin user.
	 *
	 * @var int
	 */
	protected static $super_admin_id;

	/**
	 * Sets up test class.
	 *
	 * @param WP_UnitTest_Factory $factory Unit test factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$super_admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		grant_super_admin( self::$super_admin_id );
	}

	/**
	 * Tears down test class.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$super_admin_id );
	}

	/**
	 * Tests that file_status is 'existing' when font files exist on disk.
	 */
	public function test_file_status_existing_when_file_exists() {
		wp_set_current_user( self::$super_admin_id );
		$font_family_id  = $this->create_font_family();
		$create_response = $this->create_font_face_with_upload( $font_family_id );

		$this->assertSame( 201, $create_response->get_status(), 'The font face should be created successfully.' );

		$create_data  = $create_response->get_data();
		$font_face_id = $create_data['id'];

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . $font_family_id . '/font-faces/' . $font_face_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'file_status', $data, 'Response should include file_status field.' );
		$this->assertSame( 'existing', $data['file_status'], 'file_status should be "existing" when font file is on disk.' );

		// Clean up.
		wp_delete_post( $font_family_id, true );
	}

	/**
	 * Tests that file_status is 'missing' when font files have been deleted from disk.
	 */
	public function test_file_status_missing_when_file_deleted() {
		wp_set_current_user( self::$super_admin_id );
		$font_family_id  = $this->create_font_family();
		$create_response = $this->create_font_face_with_upload( $font_family_id );

		$this->assertSame( 201, $create_response->get_status(), 'The font face should be created successfully.' );

		$create_data  = $create_response->get_data();
		$font_face_id = $create_data['id'];

		// Delete the font file from disk.
		$font_path = str_replace( content_url(), WP_CONTENT_DIR, $create_data['font_face_settings']['src'] );
		$this->assertTrue( file_exists( $font_path ), 'Font file should exist before deletion.' );
		unlink( $font_path );
		$this->assertFalse( file_exists( $font_path ), 'Font file should be deleted.' );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . $font_family_id . '/font-faces/' . $font_face_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'missing', $data['file_status'], 'file_status should be "missing" when font file is deleted from disk.' );

		// Clean up.
		wp_delete_post( $font_family_id, true );
	}

	/**
	 * Tests that file_status is 'none' when font face has no local file (external URL or system font).
	 */
	public function test_file_status_none_when_no_local_file() {
		wp_set_current_user( self::$super_admin_id );
		$font_family_id = $this->create_font_family();

		// Create a font face post directly with an external URL (no _wp_font_face_file meta).
		$font_face_id = self::factory()->post->create(
			wp_slash(
				array(
					'post_type'    => 'wp_font_face',
					'post_parent'  => $font_family_id,
					'post_status'  => 'publish',
					'post_title'   => '',
					'post_name'    => 'open-sans-normal-400',
					'post_content' => wp_json_encode(
						array(
							'fontFamily' => '"Open Sans"',
							'fontWeight' => '400',
							'fontStyle'  => 'normal',
							'src'        => 'https://fonts.example.com/open-sans-regular.woff2',
						)
					),
				)
			)
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . $font_family_id . '/font-faces/' . $font_face_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'none', $data['file_status'], 'file_status should be "none" when font face has no local file.' );

		// Clean up.
		wp_delete_post( $font_family_id, true );
	}

	/**
	 * Tests that file_status is 'existing' when font file exists in the legacy wp-content/fonts directory.
	 */
	public function test_file_status_existing_in_legacy_directory() {
		wp_set_current_user( self::$super_admin_id );
		$font_family_id = $this->create_font_family();

		// Upload font to the legacy directory.
		add_filter( 'font_dir', array( $this, 'filter_font_dir' ) );
		$create_response = $this->create_font_face_with_upload( $font_family_id );
		remove_filter( 'font_dir', array( $this, 'filter_font_dir' ) );

		$this->assertSame( 201, $create_response->get_status(), 'The font face should be created successfully.' );

		$create_data  = $create_response->get_data();
		$font_face_id = $create_data['id'];
		$font_path    = str_replace( content_url(), WP_CONTENT_DIR, $create_data['font_face_settings']['src'] );

		$this->assertFalse( str_contains( $font_path, 'uploads' ), 'Font file should be in wp-content/fonts, not uploads.' );
		$this->assertTrue( file_exists( $font_path ), 'Font file should exist in legacy directory.' );

		// Query WITHOUT the legacy dir filter — the controller should still find it.
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . $font_family_id . '/font-faces/' . $font_face_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'existing', $data['file_status'], 'file_status should be "existing" when font file is in the legacy directory.' );

		// Clean up.
		wp_delete_post( $font_family_id, true );
	}

	/**
	 * Tests that file_status is included in the schema.
	 */
	public function test_file_status_in_schema() {
		$controller = new Gutenberg_REST_Font_Faces_Controller_7_0( 'wp_font_face' );
		$schema     = $controller->get_item_schema();

		$this->assertArrayHasKey( 'file_status', $schema['properties'], 'Schema should include file_status property.' );
		$this->assertSame( 'string', $schema['properties']['file_status']['type'] );
		$this->assertSame(
			array( 'existing', 'missing', 'none' ),
			$schema['properties']['file_status']['enum'],
			'file_status enum should include existing, missing, and none.'
		);
		$this->assertTrue( $schema['properties']['file_status']['readonly'], 'file_status should be readonly.' );
	}

	/**
	 * Tests that file_status is included when listing font faces.
	 */
	public function test_file_status_in_list_response() {
		wp_set_current_user( self::$super_admin_id );
		$font_family_id  = $this->create_font_family();
		$create_response = $this->create_font_face_with_upload( $font_family_id );

		$this->assertSame( 201, $create_response->get_status() );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-families/' . $font_family_id . '/font-faces' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotEmpty( $data, 'Font faces list should not be empty.' );
		$this->assertArrayHasKey( 'file_status', $data[0], 'List response should include file_status.' );
		$this->assertSame( 'existing', $data[0]['file_status'] );

		// Clean up.
		wp_delete_post( $font_family_id, true );
	}

	/**
	 * Sets the font upload directory to wp-content/fonts, the default previously used in Gutenberg.
	 *
	 * @param array $font_dir Font directory settings.
	 * @return array Filtered font directory settings.
	 */
	public function filter_font_dir( $font_dir ) {
		$site_path = '';
		if ( is_multisite() && ! ( is_main_network() && is_main_site() ) ) {
			$site_path = '/sites/' . get_current_blog_id();
		}

		$font_dir['path']    = path_join( WP_CONTENT_DIR, 'fonts' ) . $site_path;
		$font_dir['url']     = untrailingslashit( content_url( 'fonts' ) ) . $site_path;
		$font_dir['basedir'] = path_join( WP_CONTENT_DIR, 'fonts' ) . $site_path;
		$font_dir['baseurl'] = untrailingslashit( content_url( 'fonts' ) ) . $site_path;

		return $font_dir;
	}

	/**
	 * Creates a font family post for testing.
	 *
	 * @return int Font family post ID.
	 */
	protected function create_font_family() {
		return self::factory()->post->create(
			wp_slash(
				array(
					'post_type'    => 'wp_font_family',
					'post_status'  => 'publish',
					'post_title'   => 'Open Sans',
					'post_name'    => 'open-sans',
					'post_content' => wp_json_encode(
						array(
							'fontFamily' => '"Open Sans"',
						)
					),
				)
			)
		);
	}

	/**
	 * Creates a font face post with a file upload under the specified font family.
	 *
	 * @param int $font_family_id Font family post ID.
	 * @return WP_REST_Response REST response object.
	 */
	protected function create_font_face_with_upload( $font_family_id ) {
		$font_file = GUTENBERG_DIR_TESTDATA . 'fonts/OpenSans-Regular.woff2';
		$font_path = wp_tempnam( 'OpenSans-Regular.woff2' );
		copy( $font_file, $font_path );

		$files = array(
			'file-0' => array(
				'name'      => 'OpenSans-Regular.woff2',
				'full_path' => 'OpenSans-Regular.woff2',
				'type'      => 'font/woff2',
				'tmp_name'  => $font_path,
				'error'     => 0,
				'size'      => filesize( $font_path ),
			),
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/font-families/' . $font_family_id . '/font-faces' );
		$request->set_param(
			'font_face_settings',
			wp_json_encode(
				array(
					'fontFamily' => '"Open Sans"',
					'fontWeight' => '400',
					'fontStyle'  => 'normal',
					'src'        => 'file-0',
				)
			)
		);
		$request->set_file_params( $files );
		return rest_get_server()->dispatch( $request );
	}
}
