<?php
/**
 * Test deleting wp_font_family and wp_font_face post types.
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 */
class Tests_Fonts_FontLibraryHooks extends WP_UnitTestCase {

	public function test_deleting_font_family_deletes_child_font_faces() {
		$font_family_id       = self::factory()->post->create(
			array(
				'post_type' => 'wp_font_family',
			)
		);
		$font_face_id         = self::factory()->post->create(
			array(
				'post_type'   => 'wp_font_face',
				'post_parent' => $font_family_id,
			)
		);
		$other_font_family_id = self::factory()->post->create(
			array(
				'post_type' => 'wp_font_family',
			)
		);
		$other_font_face_id   = self::factory()->post->create(
			array(
				'post_type'   => 'wp_font_face',
				'post_parent' => $other_font_family_id,
			)
		);

		wp_delete_post( $font_family_id, true );

		$this->assertNull( get_post( $font_face_id ), 'Font face post should also have been deleted.' );
		$this->assertNotNull( get_post( $other_font_face_id ), 'The other post should exist.' );
	}

	public function test_deleting_font_faces_deletes_associated_font_files() {
		list( $font_face_id, $font_path ) = $this->create_font_face_with_file( 'OpenSans-Regular.woff2' );
		list( , $other_font_path )        = $this->create_font_face_with_file( 'OpenSans-Regular.ttf' );

		wp_delete_post( $font_face_id, true );

		$this->assertFalse( file_exists( $font_path ), 'The font file should have been deleted when the post was deleted.' );
		$this->assertTrue( file_exists( $other_font_path ), 'The other font file should exist.' );
	}

	protected function create_font_face_with_file( $filename ) {
		$font_face_id = self::factory()->post->create(
			array(
				'post_type' => 'wp_font_face',
			)
		);

		$font_file = $this->upload_font_file( $filename );

		// Make sure the font file uploaded successfully.
		$this->assertFalse( $font_file['error'] );

		$font_path     = $font_file['file'];
		$font_filename = basename( $font_path );
		add_post_meta( $font_face_id, '_wp_font_face_file', $font_filename );

		return array( $font_face_id, $font_path );
	}

	protected function upload_font_file( $font_filename ) {
		// @core-merge Use `DIR_TESTDATA` instead of `GUTENBERG_DIR_TESTDATA`.
		$font_file_path = GUTENBERG_DIR_TESTDATA . 'fonts/' . $font_filename;

		add_filter( 'upload_mimes', array( 'WP_Font_Library', 'set_allowed_mime_types' ) );
		add_filter( 'upload_dir', 'wp_get_font_dir' );
		$font_file = wp_upload_bits(
			$font_filename,
			null,
			file_get_contents( $font_file_path )
		);
		remove_filter( 'upload_dir', 'wp_get_font_dir' );
		remove_filter( 'upload_mimes', array( 'WP_Font_Library', 'set_allowed_mime_types' ) );

		return $font_file;
	}
}
