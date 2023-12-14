<?php
/**
 * Test WP_Font_Library::set_upload_dir().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Library::set_upload_dir
 */
class Tests_Fonts_WpFontLibrary_SetUploadDir extends WP_UnitTestCase {

	public function test_should_set_fonts_upload_dir() {
		$defaults = array(
			'path' => '/any/path/abc',
			'url'  => 'http://example.com/an/arbitrary/url/abc',
		);
		$expected = array(
			'path' => path_join( WP_CONTENT_DIR, 'fonts' ),
			'url'  => content_url( 'fonts' ),
		);
		$this->assertSame( $expected, WP_Font_Library::set_upload_dir( $defaults ) );
	}
}
