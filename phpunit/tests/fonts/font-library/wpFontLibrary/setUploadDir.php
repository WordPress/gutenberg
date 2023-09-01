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
			'subdir'  => '/abc',
			'basedir' => '/var/www/html/wp-content',
			'baseurl' => 'http://example.com/wp-content',
		);
		$expected = array(
			'subdir'  => '/fonts',
			'basedir' => '/var/www/html/wp-content',
			'baseurl' => content_url(),
			'path'    => '/var/www/html/wp-content/fonts',
			'url'     => content_url() . '/fonts',
		);
		$this->assertSame( $expected, WP_Font_Library::set_upload_dir( $defaults ) );
	}
}
