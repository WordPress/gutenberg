<?php
/**
 * Test WP_Font_Family_Utils::has_font_mime_type().
 *
 * @package WordPress
 * @subpackage Fonts Library
 *
 * @group fonts
 * @group fonts-library
 *
 * @covers WP_Font_Family_Utils::has_font_mime_type
 */
class Tests_Fonts_WpFontsFamilyUtils_HasFontMimeType extends WP_UnitTestCase {

	/**
	 * @dataProvider data_should_succeed_when_has_mime_type
	 *
	 * @param string $font_file Font file path.
	 */
	public function test_should_succeed_when_has_mime_type( $font_file ) {
		$this->assertTrue( WP_Font_Family_Utils::has_font_mime_type( $font_file ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_succeed_when_has_mime_type() {
		return array(
			'ttf'   => array( '/temp/piazzolla_400_italic.ttf' ),
			'otf'   => array( '/temp/piazzolla_400_italic.otf' ),
			'woff'  => array( '/temp/piazzolla_400_italic.woff' ),
			'woff2' => array( '/temp/piazzolla_400_italic.woff2' ),
		);
	}

	/**
	 * @dataProvider data_should_fail_when_mime_not_supported
	 *
	 * @param string $font_file Font file path.
	 */
	public function test_should_fail_when_mime_not_supported( $font_file ) {
		$this->assertFalse( WP_Font_Family_Utils::has_font_mime_type( $font_file ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_fail_when_mime_not_supported() {
		return array(
			'exe' => array( '/temp/test.exe' ),
			'md'  => array( '/temp/license.md' ),
			'php' => array( '/temp/test.php' ),
			'txt' => array( '/temp/test.txt' ),
			'zip' => array( '/temp/lato.zip' ),
		);
	}
}
