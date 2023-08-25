<?php
/**
 * Test case for WP_Font_Face_Resolver::get_fonts_from_theme_json().
 *
 * @package    WordPress
 * @subpackage Fonts
 */

require_once dirname( __DIR__ ) . '/base.php';

/**
 * Tests WP_Font_Face_Resolver::get_fonts_from_theme_json().
 *
 * @package WordPress
 * @subpackage Fonts
 *
 * @since X.X.X
 * @group fonts
 * @group fontface
 * @covers WP_Font_Face_Resolver::get_fonts_from_theme_json
 */
class Tests_Fonts_WPFontFaceResolver_GetFontsFromThemeJson extends WP_Font_Face_TestCase {
	const FONTS_THEME = 'fonts-block-theme';

	public static function set_up_before_class() {
		self::$requires_switch_theme_fixtures = true;

		parent::set_up_before_class();
	}

	public function test_should_return_empty_array_when_no_fonts_defined_in_theme() {
		switch_theme( 'block-theme' );

		$fonts = WP_Font_Face_Resolver::get_fonts_from_theme_json();
		$this->assertIsArray( $fonts, 'Should return an array data type' );
		$this->assertEmpty( $fonts, 'Should return an empty array' );
	}

	public function test_should_return_all_fonts_from_theme() {
		switch_theme( static::FONTS_THEME );

		$actual   = WP_Font_Face_Resolver::get_fonts_from_theme_json();
		$expected = $this->get_expected_fonts_for_fonts_block_theme( 'fonts' );
		$this->assertSame( $expected, $actual );
	}

	/**
	 * @dataProvider data_should_replace_src_file_placeholder
	 *
	 * @param string $font_name  Font's name.
	 * @param string $font_index Font's index in the $fonts array.
	 * @param string $expected   Expected src.
	 */
	public function test_should_replace_src_file_placeholder( $font_name, $font_index, $expected ) {
		switch_theme( static::FONTS_THEME );

		$fonts = WP_Font_Face_Resolver::get_fonts_from_theme_json();

		$actual   = $fonts[ $font_name ][ $font_index ]['src'][0];
		$expected = get_stylesheet_directory_uri() . $expected;

		$this->assertStringNotContainsString( 'file:./', $actual, 'Font src should not contain the "file:./" placeholder' );
		$this->assertSame( $expected, $actual, 'Font src should be an URL to its file' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_replace_src_file_placeholder() {
		return array(
			// Theme's theme.json.
			'DM Sans: 400 normal'              => array(
				'font_name'  => 'DM Sans',
				'font_index' => 0,
				'expected'   => '/assets/fonts/dm-sans/DMSans-Regular.woff2',
			),
			'DM Sans: 400 italic'              => array(
				'font_name'  => 'DM Sans',
				'font_index' => 1,
				'expected'   => '/assets/fonts/dm-sans/DMSans-Regular-Italic.woff2',
			),
			'DM Sans: 700 normal'              => array(
				'font_name'  => 'DM Sans',
				'font_index' => 2,
				'expected'   => '/assets/fonts/dm-sans/DMSans-Bold.woff2',
			),
			'DM Sans: 700 italic'              => array(
				'font_name'  => 'DM Sans',
				'font_index' => 3,
				'expected'   => '/assets/fonts/dm-sans/DMSans-Bold-Italic.woff2',
			),
			'Source Serif Pro: 200-900 normal' => array(
				'font_name'  => 'Source Serif Pro',
				'font_index' => 0,
				'expected'   => '/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
			),
			'Source Serif Pro: 200-900 italic' => array(
				'font_name'  => 'Source Serif Pro',
				'font_index' => 1,
				'expected'   => '/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
			),
		);
	}
}
