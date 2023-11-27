<?php
/**
 * Test WP_Font_Family_Utils::format_font_family().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Family_Utils::format_font_family
 */
class Tests_Fonts_WpFontsFamilyUtils_FormatFontFamily extends WP_UnitTestCase {

	/**
	 * @dataProvider data_should_format_font_family
	 *
	 * @param string $font_family   Font family.
	 * @param string $expected  	Expected family.
	 */
	public function test_should_format_font_family( $font_family, $expected ) {
		$this->assertSame(
			$expected,
			WP_Font_Family_Utils::format_font_family(
				$font_family
			)
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_format_font_family() {
		return array(
			'data' => array(
				'font_family' => "Rock 3D , Open Sans, ,serif",
				'expected' => "'Rock 3D', 'Open Sans', , serif",
			),
		);
	}
}
