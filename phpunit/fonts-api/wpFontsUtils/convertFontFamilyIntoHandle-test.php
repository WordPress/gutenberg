<?php
/**
 * WP_Fonts_Utils::convert_font_family_into_handle() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group fontsapi
 * @covers WP_Fonts_Utils::convert_font_family_into_handle
 */
class Tests_Fonts_WpFontsUtils_ConvertFontFamilyIntoHandle extends WP_Fonts_TestCase {

	/**
	 * @dataProvider data_with_valid_input
	 *
	 * @param mixed  $font_family Font family to test.
	 * @param string $expected    Expected results.
	 */
	public function test_should_convert_with_valid_input( $font_family, $expected ) {
		$this->assertSame( $expected, WP_Fonts_Utils::convert_font_family_into_handle( $font_family ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_with_valid_input() {
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
	 * @dataProvider data_with_invalid_input
	 *
	 * @covers WP_Fonts_Utils::convert_font_family_into_handle
	 *
	 * @param mixed $invalid_input Invalid input.
	 */
	public function test_should_not_convert_with_invalid_input( $invalid_input ) {
		$this->assertNull( WP_Fonts_Utils::convert_font_family_into_handle( $invalid_input ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_with_invalid_input() {
		return array(
			'empty string'                    => array( '' ),
			'integer'                         => array( 10 ),
			'font family wrapped in an array' => array( array( 'source-serif-pro' ) ),
		);
	}
}
