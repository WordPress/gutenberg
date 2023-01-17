<?php
/**
 * WP_Fonts_Utils::get_font_family_from_variation() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group fontsapi
 * @covers WP_Fonts_Utils::get_font_family_from_variation
 */
class Tests_Fonts_WpFontsUtils_GetFontFamilyFromVariation extends WP_Fonts_TestCase {

	/**
	 * @dataProvider data_with_valid_variation
	 *
	 * @param array  $variation Variation to test.
	 * @param string $expected  Expected results.
	 */
	public function test_with_valid_variation( array $variation, $expected ) {
		$this->assertSame( $expected, WP_Fonts_Utils::get_font_family_from_variation( $variation ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_with_valid_variation() {
		return array(
			'keyed by font-family'                   => array(
				'variation' => array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
				'expected'  => 'Source Serif Pro',
			),
			'keyed by fontFamily and as a handle'    => array(
				'variation' => array(
					'fontFamily'  => 'source-sans-pro',
					'font-weight' => '200 900',
					'src'         => 'https://example.com/assets/fonts/source-sans-pro/source-sans-pro.ttf.woff2',
					'provider'    => 'local',
				),
				'expected'  => 'source-sans-pro',
			),
			'with font family name and full variant' => array(
				'variation' => array(
					'provider'     => 'local',
					'font-family'  => 'Merriweather',
					'font-style'   => 'normal',
					'font-weight'  => '400 600',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
					'font-display' => 'fallback',
				),
				'expected'  => 'Merriweather',
			),
		);
	}

	/**
	 * @dataProvider data_with_invalid_input
	 *
	 * @param array  $invalid_variation Variation to test.
	 * @param string $expected_message  Expected notice message.
	 */
	public function test_with_invalid_input( array $invalid_variation, $expected_message ) {
		$this->expectNotice();
		$this->expectNoticeMessage( $expected_message );

		$this->assertNull( WP_Fonts_Utils::get_font_family_from_variation( $invalid_variation ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_with_invalid_input() {
		return array(
			'keyed with underscore'       => array(
				'variation'        => array(
					'provider'     => 'local',
					'font_family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
				'expected_message' => 'Font family not found.',
			),
			'keyed with space'            => array(
				'variation'        => array(
					'font family' => 'Source Sans Pro',
					'font-weight' => '200 900',
					'src'         => 'https://example.com/assets/fonts/source-sans-pro/source-sans-pro.ttf.woff2',
					'provider'    => 'local',
				),
				'expected_message' => 'Font family not found.',
			),
			'fontFamily => empty string'  => array(
				'variation'        => array(
					'fontFamily'  => '',
					'font-weight' => '200 900',
					'src'         => 'https://example.com/assets/fonts/source-sans-pro/source-sans-pro.ttf.woff2',
					'provider'    => 'local',
				),
				'expected_message' => 'Font family not defined in the variation.',
			),
			'font-family => empty string' => array(
				'variation'        => array(
					'provider'     => 'local',
					'font-family'  => '',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
				'expected_message' => 'Font family not defined in the variation.',
			),
		);
	}
}
