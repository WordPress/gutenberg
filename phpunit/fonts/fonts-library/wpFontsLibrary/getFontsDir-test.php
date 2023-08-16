<?php
/**
 * Test WP_Fonts_Library::get_fonts_dir().
 *
 * @package WordPress
 * @subpackage Fonts Library
 *
 * @group fonts
 * @group fonts-library
 *
 * @covers WP_Fonts_Library::get_fonts_dir
 */
class Tests_Fonts_WpFontsLibrary_GetFontsDir extends WP_UnitTestCase {

	public function test_get_fonts_dir() {
		$this->assertStringEndsWith( '/wp-content/uploads/fonts', WP_Fonts_Library::get_fonts_dir() );
	}
}
