<?php
/**
 * Test WP_Font_Library::get_fonts_dir().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Library::get_fonts_dir
 */
class Tests_Fonts_WpFontLibrary_GetFontsDir extends WP_UnitTestCase {

	public function test_get_fonts_dir() {
		$this->assertStringEndsWith( '/wp-content/uploads/fonts', WP_Font_Library::get_fonts_dir() );
	}
}
