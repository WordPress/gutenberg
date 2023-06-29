<?php
/**
 * Test case for WP_Font_Face_Resolver::get_fonts_from_theme_json().
 *
 * @package    WordPress
 * @subpackage Fonts
 */

require_once __DIR__ . '/../../fonts-api/wp-fonts-testcase.php';
// This code is only needed if the Font API is enabled.
// It should be removed after Font Manager is merged into Gutenberg.
if ( ! class_exists( 'WP_Font_Face' ) ) {
	require_once __DIR__ . '/../../../lib/experimental/fonts/class-wp-font-face.php';
	require_once __DIR__ . '/../../../lib/experimental/fonts/class-wp-font-face-resolver.php';
	require_once __DIR__ . '/../../../lib/experimental/fonts/fonts.php';
}

/**
 * Tests WP_Font_Face_Resolver::get_fonts_from_theme_json().
 *
 * @package WordPress
 * @subpackage Fonts
 *
 * @since X.X.X
 * @group fonts
 * @covers WP_Font_Face_Resolver::get_fonts_from_theme_json
 */
class Tests_Fonts_WPFontFaceResolver_GetFontsFromThemeJson extends WP_Fonts_TestCase {
	const FONTS_THEME   = 'fonts-block-theme';
	const FONT_FAMILIES = array(
		'fonts-block-theme' => array(
			// From theme.json.
			'DM Sans',
			'Source Serif Pro',
		),
	);

	const STYLE_VARIATIONS_FONTS = array(
		'fonts-block-theme' => array(
			'Open Sans',
		),
	);

	public static function set_up_before_class() {
		self::$requires_switch_theme_fixtures = true;

		parent::set_up_before_class();
	}

	public function test_should_return_no_fonts_when_no_fonts_defined() {
		switch_theme( 'block-theme' );

		$fonts = WP_Font_Face_Resolver::get_fonts_from_theme_json();
		$this->assertSame( array(), $fonts );
	}

	/**
	 * Tests all font families are registered and enqueued. "All" means all font families from
	 * the theme's theme.json.
	 */
	public function test_should_return_all_defined_font_families() {
		switch_theme( static::FONTS_THEME );

		$fonts = WP_Font_Face_Resolver::get_fonts_from_theme_json();

		$expected = static::FONT_FAMILIES[ static::FONTS_THEME ];
		$this->assertSameSetsWithIndex( $expected, array_keys( $fonts ) );
	}

	/**
	 * Test ensures that the style variations are not returned.
	 */
	public function test_should_not_return_fonts_from_style_variations() {
		switch_theme( static::FONTS_THEME );

		$fonts = WP_Font_Face_Resolver::get_fonts_from_theme_json();

		$style_variations_fonts = static::STYLE_VARIATIONS_FONTS[ static::FONTS_THEME ];
		foreach ( $style_variations_fonts as $style_variations_font ) {
			$this->assertArrayNotHasKey( $style_variations_font, $fonts );
		}
	}

	/**
	 * @dataProvider data_should_replace_src_file_placeholder
	 *
	 * @param string $font_name Font's name.
	 * @param string $font_index Font's index in the $fonts array.
	 * @param string $expected  Expected src.
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
