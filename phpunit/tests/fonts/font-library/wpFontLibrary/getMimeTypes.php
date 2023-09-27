<?php
/**
 * Test WP_Font_Family_Utils::get_expected_font_mime_types_per_php_version().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Family_Utils::get_expected_font_mime_types_per_php_version
 */
class Tests_Fonts_WpFontsFamilyUtils_GetMimeTypes extends WP_UnitTestCase {

	/**
	 *
	 * @dataProvider data_should_supply_correct_mime_type_for_php_version
	 *
	 * @param array $php_info Info about php version and expected mime type values.
	 */
	public function test_should_supply_correct_mime_type_for_php_version( $php_info ) {

		$mime_types = WP_Font_Library::get_expected_font_mime_types_per_php_version( $php_info['php_version_id'] );

		$this->assertTrue( $mime_types['otf'] === $php_info['otf'] );
		$this->assertTrue( $mime_types['ttf'] === $php_info['ttf'] );
		$this->assertTrue( $mime_types['woff'] === $php_info['woff'] );
		$this->assertTrue( $mime_types['woff2'] === $php_info['woff2'] );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_supply_correct_mime_type_for_php_version() {
		return array(
			array(
				'version 7.2' => array(
					'php_version_id' => 70200,
					'otf'            => 'font/otf',
					'ttf'            => 'application/x-font-ttf',
					'woff'           => 'application/font-woff',
					'woff2'          => 'application/font-woff2',
				),
				'version 7.3' => array(
					'php_version_id' => 70300,
					'otf'            => 'font/otf',
					'ttf'            => 'application/font-sfnt',
					'woff'           => 'application/font-woff',
					'woff2'          => 'application/font-woff2',
				),
				'version 7.4' => array(
					'php_version_id' => 70400,
					'otf'            => 'font/otf',
					'ttf'            => 'font/sfnt',
					'woff'           => 'application/font-woff',
					'woff2'          => 'application/font-woff2',
				),
				'version 8.0' => array(
					'php_version_id' => 80000,
					'otf'            => 'font/otf',
					'ttf'            => 'font/sfnt',
					'woff'           => 'application/font-woff',
					'woff2'          => 'application/font-woff2',
				),
				'version 8.1' => array(
					'php_version_id' => 80100,
					'otf'            => 'font/otf',
					'ttf'            => 'font/sfnt',
					'woff'           => 'font/woff',
					'woff2'          => 'font/woff2',
				),
				'version 8.2' => array(
					'php_version_id' => 80200,
					'otf'            => 'font/otf',
					'ttf'            => 'font/sfnt',
					'woff'           => 'font/woff',
					'woff2'          => 'font/woff2',
				),
			),
		);
	}
}
