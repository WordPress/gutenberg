<?php
/**
 * WP_Webfonts_Utils tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/wp-webfonts-testcase.php';

/**
 * @group webfonts
 */
class Tests_Webfonts_WpWebfontsUtils extends WP_Webfonts_TestCase {

	/**
	 * @dataProvider data_convert_font_family_into_handle
	 *
	 * @covers WP_Webfonts_Utils::convert_font_family_into_handle
	 *
	 * @param mixed  $font_family Font family to test.
	 * @param string $expected    Expected results.
	 */
	public function test_convert_font_family_into_handle( $font_family, $expected ) {
		$this->assertSame( $expected, WP_Webfonts_Utils::convert_font_family_into_handle( $font_family ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_convert_font_family_into_handle() {
		return array(
			'font family single word name'               => array(
				'font_family' => 'Merriweather',
				'expected'    => 'merriweather',
			),
			'font family multiword name'                 => array(
				'font_family' => 'Source Sans Pro',
				'expected'    => 'source-sans-pro',
			),
			'font family handle delimited by hyphens'    => array(
				'font_family' => 'source-serif-pro',
				'expected'    => 'source-serif-pro',
			),
			'font family handle delimited by underscore' => array(
				'font_family' => 'source_serif_pro',
				'expected'    => 'source_serif_pro',
			),
			'font family handle delimited by hyphens and underscore' => array(
				'font_family' => 'my-custom_font_family',
				'expected'    => 'my-custom_font_family',
			),
			'font family handle delimited mixture'       => array(
				'font_family' => 'My custom_font-family',
				'expected'    => 'my-custom_font-family',
			),
		);
	}

	/**
	 * @dataProvider data_convert_font_family_into_handle_with_invalid_input
	 *
	 * @covers WP_Webfonts_Utils::convert_font_family_into_handle
	 *
	 * @param mixed $invalid_input Invalid input.
	 */
	public function test_convert_font_family_into_handle_with_invalid_input( $invalid_input ) {
		$this->assertNull( WP_Webfonts_Utils::convert_font_family_into_handle( $invalid_input ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_convert_font_family_into_handle_with_invalid_input() {
		return array(
			'empty string'                    => array( '' ),
			'integer'                         => array( 10 ),
			'font family wrapped in an array' => array( array( 'source-serif-pro' ) ),
		);
	}

	/**
	 * @dataProvider data_convert_variation_into_handle
	 *
	 * @covers WP_Webfonts_Utils::convert_variation_into_handle
	 *
	 * @param string $font_family Font family to test.
	 * @param array  $variation   Variation to test.
	 * @param string $expected    Expected results.
	 */
	public function test_convert_variation_into_handlee( $font_family, array $variation, $expected ) {
		$this->assertSame( $expected, WP_Webfonts_Utils::convert_variation_into_handle( $font_family, $variation ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_convert_variation_into_handle() {
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
	 * @dataProvider data_convert_variation_into_handle_with_invalid_variation
	 *
	 * @covers WP_Webfonts_Utils::convert_variation_into_handle
	 *
	 * @param string $font_family   Font family to test.
	 * @param array  $invalid_input Variation to test.
	 */
	public function tests_convert_variation_into_handle_with_invalid_variation( $font_family, $invalid_input ) {
		$this->expectNotice();
		$this->expectNoticeMessage( 'Variant handle could not be determined as font-weight and/or font-style are require' );

		$this->assertNull( WP_Webfonts_Utils::convert_variation_into_handle( $font_family, $invalid_input ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_convert_variation_into_handle_with_invalid_variation() {
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

	/**
	 * @dataProvider data_get_font_family_from_variation
	 *
	 * @covers WP_Webfonts_Utils::convert_variation_into_handle
	 *
	 * @param array  $variation Variation to test.
	 * @param string $expected  Expected results.
	 */
	public function test_get_font_family_from_variation( array $variation, $expected ) {
		$this->assertSame( $expected, WP_Webfonts_Utils::get_font_family_from_variation( $variation ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_font_family_from_variation() {
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
	 * @dataProvider data_get_font_family_from_variation_with_invalid_input
	 *
	 * @covers  WP_Webfonts_Utils::get_font_family_from_variation
	 *
	 * @param array  $invalid_variation Variation to test.
	 * @param string $expected_message  Expected notice message.
	 */
	public function test_get_font_family_from_variation_with_invalid_input( array $invalid_variation, $expected_message ) {
		$this->expectNotice();
		$this->expectNoticeMessage( $expected_message );

		$this->assertNull( WP_Webfonts_Utils::get_font_family_from_variation( $invalid_variation ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_font_family_from_variation_with_invalid_input() {
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

	/**
	 * @dataProvider data_is_defined
	 *
	 * @covers WP_Webfonts_Utils::is_defined
	 *
	 * @param mixed $input Input to test.
	 */
	public function test_is_defined( $input ) {
		$this->assertTrue( WP_Webfonts_Utils::is_defined( $input ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_is_defined() {
		return array(
			'name: non empty string'   => array( 'Some Font Family' ),
			'handle: non empty string' => array( 'some-font-family' ),
		);
	}

	/**
	 * @dataProvider data_is_defined_when_not_defined
	 *
	 * @covers WP_Webfonts_Utils::is_defined
	 *
	 * @param mixed $invalid_input Input to test.
	 */
	public function test_is_defined_when_not_defined( $invalid_input ) {
		$this->assertFalse( WP_Webfonts_Utils::is_defined( $invalid_input ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_is_defined_when_not_defined() {
		return array(
			'empty string'               => array( '' ),
			'string 0'                   => array( '0' ),
			'integer'                    => array( 10 ),
			'name wrapped in an array'   => array( array( 'Some Font Family' ) ),
			'handle wrapped in an array' => array( array( 'some-font-family' ) ),
		);
	}
}
