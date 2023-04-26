<?php
/**
 * WP_Fonts_Utils::convert_variation_into_handle() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group fontsapi
 * @covers WP_Fonts_Utils::convert_variation_into_handle
 */
class Tests_Fonts_WpFontsUtils_ConvertVariationIntoHandle extends WP_Fonts_TestCase {

	/**
	 * @dataProvider data_with_valid_input
	 *
	 * @param string $font_family Font family to test.
	 * @param array  $variation   Variation to test.
	 * @param string $expected    Expected results.
	 */
	public function test_should_convert_with_valid_inputs( $font_family, array $variation, $expected ) {
		$this->assertSame( $expected, WP_Fonts_Utils::convert_variation_into_handle( $font_family, $variation ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_with_valid_input() {
		return array(
			'with only font-weight'                  => array(
				'font_family' => 'merriweather',
				'variation'   => array(
					'font-weight' => '400',
				),
				'expected'    => 'merriweather-400',
			),
			'with no font-style'                     => array(
				'font_family' => 'source-sans-pro',
				'variation'   => array(
					'font-weight' => '200 900',
					'src'         => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'provider'    => 'local',
				),
				'expected'    => 'source-sans-pro-200-900',
			),
			'with font family name and full variant' => array(
				'font_family' => 'source-sans-pro',
				'variation'   => array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
				'expected'    => 'source-sans-pro-200-900-normal',
			),
		);
	}

	/**
	 * @dataProvider data_with_invalid_input
	 *
	 * @param string $font_family   Font family to test.
	 * @param array  $invalid_input Variation to test.
	 */
	public function tests_should_convert_with_invalid_input( $font_family, $invalid_input ) {
		$this->expectNotice();
		$this->expectNoticeMessage( 'Variant handle could not be determined as font-weight and/or font-style are require' );

		$this->assertNull( WP_Fonts_Utils::convert_variation_into_handle( $font_family, $invalid_input ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_with_invalid_input() {
		return array(
			'with no font-weight or font-style' => array(
				'font_family' => 'merriweather',
				'variation'   => array(
					'provider'     => 'local',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
			),
			'with non-string font-weight'       => array(
				'font_family' => 'merriweather',
				'variation'   => array(
					'font-weight' => 400,
				),
			),
			'with non-string font-style'        => array(
				'font_family' => 'merriweather',
				'variation'   => array(
					'font-style' => 0,
				),
			),
			'with empty string font-weight'     => array(
				'font_family' => 'merriweather',
				'variation'   => array(
					'font-weight' => '',
				),
			),
			'with empty string font-style'      => array(
				'font_family' => 'merriweather',
				'variation'   => array(
					'font-style' => '',
				),
			),
		);
	}
}
