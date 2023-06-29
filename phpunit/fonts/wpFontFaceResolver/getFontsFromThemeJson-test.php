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
			// From style variation.
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

	public function test_should_return_style_variation_fonts() {
		switch_theme( static::FONTS_THEME );

		$fonts = WP_Font_Face_Resolver::get_fonts_from_theme_json();

		$this->assertArrayHasKey( 'Open Sans', $fonts );
	}

	/**
	 * Tests all font families are registered and enqueued. "All" means all font families from
	 * the theme's theme.json and within the style variations.
	 */
	public function test_should_return_all_defined_font_families() {
		switch_theme( static::FONTS_THEME );

		$fonts = WP_Font_Face_Resolver::get_fonts_from_theme_json();

		$expected = static::FONT_FAMILIES[ static::FONTS_THEME ];
		$this->assertSameSetsWithIndex( $expected, $fonts );
	}

	/**
	 * Test ensures duplicate fonts and variations in the style variations
	 * are not re-registered.
	 *
	 * The Dm Sans fonts are duplicated in the theme's /styles/variations-duplicate-fonts.json.
	 */
	public function test_should_not_reregister_duplicate_fonts_from_style_variations() {
		switch_theme( static::FONTS_THEME );

		WP_Fonts_Resolver::register_fonts_from_theme_json();
		$wp_fonts = wp_fonts();

		// Font families are not duplicated.
		$this->assertSameSetsWithIndex(
			static::FONT_FAMILIES[ static::FONTS_THEME ],
			$wp_fonts->get_registered_font_families(),
			'Font families should not be duplicated'
		);

		// Font variations are not duplicated.
		$this->assertSameSets(
			array(
				// From theme.json.
				'dm-sans',
				'dm-sans-400-normal',
				'dm-sans-400-italic',
				'dm-sans-700-normal',
				'dm-sans-700-italic',
				'source-serif-pro',
				'source-serif-pro-200-900-normal',
				'source-serif-pro-200-900-italic',
				// From style variation.
				'open-sans',
				'open-sans-400-normal',
				'open-sans-400-italic',
				'dm-sans-500-normal',
				'dm-sans-500-italic',
			),
			$wp_fonts->get_registered(),
			'Font families and their variations should not be duplicated'
		);
	}

	/**
	 * @dataProvider data_should_replace_src_file_placeholder
	 *
	 * @param string $handle   Variation's handle.
	 * @param string $expected Expected src.
	 */
	public function test_should_replace_src_file_placeholder( $handle, $expected ) {
		switch_theme( static::FONTS_THEME );

		WP_Fonts_Resolver::register_fonts_from_theme_json();

		$variation = wp_fonts()->registered[ $handle ];
		$actual    = array_pop( $variation->src );
		$expected  = get_stylesheet_directory_uri() . $expected;

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
			'DM Sans: 400 normal'                          => array(
				'handle'   => 'dm-sans-400-normal',
				'expected' => '/assets/fonts/dm-sans/DMSans-Regular.woff2',
			),
			'DM Sans: 400 italic'                          => array(
				'handle'   => 'dm-sans-400-italic',
				'expected' => '/assets/fonts/dm-sans/DMSans-Regular-Italic.woff2',
			),
			'DM Sans: 700 normal'                          => array(
				'handle'   => 'dm-sans-700-normal',
				'expected' => '/assets/fonts/dm-sans/DMSans-Bold.woff2',
			),
			'DM Sans: 700 italic'                          => array(
				'handle'   => 'dm-sans-700-italic',
				'expected' => '/assets/fonts/dm-sans/DMSans-Bold-Italic.woff2',
			),
			'Source Serif Pro: 200-900 normal'             => array(
				'handle'   => 'source-serif-pro-200-900-normal',
				'expected' => '/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
			),
			'Source Serif Pro: 200-900 italic'             => array(
				'handle'   => 'source-serif-pro-200-900-italic',
				'expected' => '/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
			),

			// Style Variation: variation-with-new-font-family.json.
			'Style Variation: new font-family'             => array(
				'handle'   => 'open-sans-400-normal',
				'expected' => '/assets/fonts/open-sans/OpenSans-VariableFont_wdth,wght.tff',
			),
			'Style Variation: new font-family italic variation' => array(
				'handle'   => 'open-sans-400-italic',
				'expected' => '/assets/fonts/open-sans/OpenSans-Italic-VariableFont_wdth,wght.tff',
			),

			// Style Variation: variation-with-new-variation.json.
			'Style Variation: new medium variation'        => array(
				'handle'   => 'dm-sans-500-normal',
				'expected' => '/assets/fonts/dm-sans/DMSans-Medium.woff2',
			),
			'Style Variation: new medium italic variation' => array(
				'handle'   => 'dm-sans-500-italic',
				'expected' => '/assets/fonts/dm-sans/DMSans-Medium-Italic.woff2',
			),
		);
	}

	public function test_should_convert_font_face_properties_into_kebab_case() {
		switch_theme( static::FONTS_THEME );

		WP_Fonts_Resolver::register_fonts_from_theme_json();

		// Testing only one variation since this theme's fonts use the same properties.
		$variation         = wp_fonts()->registered['dm-sans-400-normal'];
		$actual_properties = $variation->extra['font-properties'];

		$this->assertArrayHasKey( 'font-family', $actual_properties, 'fontFamily should have been converted into font-family' );
		$this->assertArrayNotHasKey( 'fontFamily', $actual_properties, 'fontFamily should not exist.' );
		$this->assertArrayHasKey( 'font-stretch', $actual_properties, 'fontStretch should have been converted into font-stretch' );
		$this->assertArrayNotHasKey( 'fontStretch', $actual_properties, 'fontStretch should not exist' );
		$this->assertArrayHasKey( 'font-style', $actual_properties, 'fontStyle should have been converted into font-style' );
		$this->assertArrayNotHasKey( 'fontStyle', $actual_properties, 'fontStyle should not exist.' );
		$this->assertArrayHasKey( 'font-weight', $actual_properties, 'fontWeight should have been converted into font-weight' );
		$this->assertArrayNotHasKey( 'fontWeight', $actual_properties, 'fontWeight should not exist' );
	}

	/**
	 * Tests that WP_Fonts_Resolver::register_fonts_from_theme_json() skips fonts that are already registered
	 * in the Fonts API. How does it do that? Using the 'origin' property when checking each variation.
	 * This property is added when WP_Theme_JSON_Resolver_Gutenberg::get_merged_data() runs.
	 *
	 * To simulate this scenario, a font is registered first, but not enqueued. Then after running,
	 * it checks if the WP_Fonts_Resolver::register_fonts_from_theme_json() enqueued the font. If no, then
	 * it was skipped as expected.
	 */
	public function test_should_skip_registered_fonts() {
		switch_theme( static::FONTS_THEME );

		// Register Lato font.
		wp_register_fonts(
			array(
				'Lato' => array(
					array(
						'font-family' => 'Lato',
						'font-style'  => 'normal',
						'font-weight' => '400',
						'src'         => 'https://example.com/tests/assets/fonts/lato/Lato-Regular.woff2',
					),
					array(
						'font-family' => 'Lato',
						'font-style'  => 'italic',
						'font-weight' => '400',
						'src'         => 'https://example.com/tests/assets/fonts/lato/Lato-Regular-Italic.woff2',
					),
				),
			)
		);

		// Pre-check to ensure no fonts are enqueued.
		$this->assertEmpty( wp_fonts()->get_enqueued(), 'No fonts should be enqueued before running WP_Fonts_Resolver::register_fonts_from_theme_json()' );

		/*
		 * When this function runs, it invokes WP_Theme_JSON_Resolver_Gutenberg::get_merged_data(),
		 * which will include the Lato fonts with a 'origin' property set in each variation.
		 */
		WP_Fonts_Resolver::register_fonts_from_theme_json();

		$actual_enqueued_fonts = wp_fonts()->get_enqueued();

		$this->assertNotContains( 'lato', $actual_enqueued_fonts, 'Lato font-family should not be enqueued' );
		$this->assertSameSets( static::FONT_FAMILIES[ static::FONTS_THEME ], $actual_enqueued_fonts, 'Only the theme font families should be enqueued' );
	}

	public function test_should_skip_when_font_face_not_defined() {
		switch_theme( static::FONTS_THEME );
		$expected_font_family = 'source-serif-pro';

		/**
		 * Callback that removes the 'fontFace' of the expected font family from the theme's theme.json data.
		 * This callback is invoked at the start of WP_Fonts_Resolver::register_fonts_from_theme_json() before processing
		 * within that function. How? It's in the call stack of WP_Theme_JSON_Resolver_Gutenberg::get_merged_data().
		 *
		 * @param WP_Theme_JSON_Data_Gutenberg| WP_Theme_JSON_Data $theme_json_data Instance of the Data object.
		 * @return WP_Theme_JSON_Data_Gutenberg| WP_Theme_JSON_Data Modified instance.
		 * @throws ReflectionException
		 */
		$remove_expected_font_family = static function( $theme_json_data ) use ( $expected_font_family ) {
			// Need to get the underlying data array which is in WP_Theme_JSON_Gutenberg | WP_Theme_JSON object.
			$property = new ReflectionProperty( $theme_json_data, 'theme_json' );
			$property->setAccessible( true );
			$theme_json_object = $property->getValue( $theme_json_data );

			$property = new ReflectionProperty( $theme_json_object, 'theme_json' );
			$property->setAccessible( true );
			$data = $property->getValue( $theme_json_object );

			// Loop through the fonts to find the expected font-family to modify.
			foreach ( $data['settings']['typography']['fontFamilies']['theme'] as $index => $definitions ) {
				if ( $expected_font_family !== $definitions['slug'] ) {
					continue;
				}

				// Remove the 'fontFace' element, which removes the font's variations.
				unset( $data['settings']['typography']['fontFamilies']['theme'][ $index ]['fontFace'] );
				break;
			}

			$theme_json_data->update_with( $data );

			return $theme_json_data;
		};
		add_filter( 'wp_theme_json_data_theme', $remove_expected_font_family );

		WP_Fonts_Resolver::register_fonts_from_theme_json();

		remove_filter( 'wp_theme_json_data_theme', $remove_expected_font_family );

		$this->assertNotContains( $expected_font_family, wp_fonts()->get_registered_font_families() );
	}
}
