<?php

require_once __DIR__ . '/../../fonts-api/wp-fonts-testcase.php';
// This code is only needed if the Font API is enabled.
// It should be removed after Font Manager is merged into Gutenberg.
if ( ! class_exists( 'WP_Font_Face' ) ) {
	require_once __DIR__ . '/../../../lib/experimental/fonts/class-wp-font-face.php';
	require_once __DIR__ . '/../../../lib/experimental/fonts/class-wp-font-face-resolver.php';
	require_once __DIR__ . '/../../../lib/experimental/fonts/fonts.php';
}

/**
 * Test WP_Theme_JSON_Resolver_Gutenberg class.
 *
 * @package Gutenberg
 */

class Tests_Fonts_WpFontFaceResolver_GetFontsFromThemeJson extends WP_Fonts_TestCase {
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
		$this->assertEmpty( $fonts );
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
		foreach ($style_variations_fonts as $style_variations_font ) {
			$this->assertArrayNotHasKey($style_variations_font, $fonts);
		}
	}
}
