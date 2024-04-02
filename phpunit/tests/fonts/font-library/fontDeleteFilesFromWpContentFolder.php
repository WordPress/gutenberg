<?php
// @core-merge: Do not include these tests, they are for Gutenberg only.

/**
 * Test deleting font files from the previous fonts folder (wp-content/fonts).
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers ::gutenberg_before_delete_font_face
 */
class Tests_Font_Delete_Files_From_Wp_Content_Folder extends WP_UnitTestCase {
	protected static $super_admin_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$super_admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		grant_super_admin( self::$super_admin_id );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$super_admin_id );
	}

	public function test_uploaded_font_files_are_deleted_from_wp_content_folder() {
		wp_set_current_user( self::$super_admin_id );
		$font_family_id = $this->create_font_family();

		// Upload the font file to wp-content/fonts, the previous directory used for fonts.
		add_filter( 'font_dir', array( $this, 'filter_font_dir' ) );
		$response = $this->create_font_face( $font_family_id );
		remove_filter( 'font_dir', array( $this, 'filter_font_dir' ) );

		$this->assertSame( 201, $response->get_status(), 'The font face should be created successfully.' );

		$data      = $response->get_data();
		$font_path = str_replace( content_url(), WP_CONTENT_DIR, $data['font_face_settings']['src'] );

		// Ensure the file was uploaded to the correct location.
		$this->assertFalse( str_contains( $font_path, 'uploads' ), 'The font file should not be in the uploads folder.' );
		$this->assertTrue( file_exists( $font_path ), 'The font file should exist in the wp-content/fonts folder.' );

		// Ensure the file is deleted when the font face post is deleted, even when the directory is not filtered.
		wp_delete_post( $font_family_id, true );
		$this->assertTrue( str_contains( wp_get_font_dir()['path'], 'uploads' ), 'The font directory should be in uploads.' );
		$this->assertFalse( file_exists( $font_path ), 'The font file should be deleted from the wp-content/fonts folder.' );
	}

	/**
	 * @group multisite
	 * @group ms-required
	 */
	public function test_uploaded_font_files_are_deleted_from_wp_content_folder_multisite() {
		wp_set_current_user( self::$super_admin_id );
		$blog_id = self::factory()->blog->create();

		switch_to_blog( $blog_id );
		$font_family_id = $this->create_font_family();

		// Upload the font file to wp-content/fonts, the previous directory used for fonts.
		add_filter( 'font_dir', array( $this, 'filter_font_dir' ) );
		$response = $this->create_font_face( $font_family_id );
		remove_filter( 'font_dir', array( $this, 'filter_font_dir' ) );
		restore_current_blog();

		$this->assertSame( 201, $response->get_status(), 'The font face should be created successfully.' );

		$data      = $response->get_data();
		$font_path = str_replace( content_url(), WP_CONTENT_DIR, $data['font_face_settings']['src'] );

		// Ensure the file was uploaded to the correct location.
		$this->assertFalse( str_contains( $font_path, 'uploads' ), 'The font file should not be in the uploads folder.' );
		$this->assertTrue( file_exists( $font_path ), 'The font file should exist in the wp-content/fonts folder.' );

		// Ensure the file is deleted when the font face post is deleted, even when the directory is not filtered.
		switch_to_blog( $blog_id );
		wp_delete_post( $font_family_id, true );
		restore_current_blog();

		$this->assertTrue( str_contains( wp_get_font_dir()['path'], 'uploads' ), 'The font directory should be in uploads.' );
		$this->assertFalse( file_exists( $font_path ), 'The font file should be deleted from the wp-content/fonts folder.' );
	}

	/**
	 * Set the font directory to wp-content/fonts, the default previously used in Gutenberg.
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

	protected function create_font_face( $font_family_id ) {
		// Create a new font face with a font file upload.
		$font_file = GUTENBERG_DIR_TESTDATA . '/fonts/OpenSans-Regular.woff2';
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
					'fontWeight' => '200',
					'fontStyle'  => 'normal',
					'src'        => 'file-0',
				)
			)
		);
		$request->set_file_params( $files );
		return rest_get_server()->dispatch( $request );
	}
}
