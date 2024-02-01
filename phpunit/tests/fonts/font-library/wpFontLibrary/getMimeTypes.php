<?php
/**
 * Test WP_Font_Library::get_expected_font_mime_types_per_php_version().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Library::get_expected_font_mime_types_per_php_version
 */
class Tests_Fonts_WpFontLibrary_GetMimeTypes extends WP_Font_Library_UnitTestCase {

	/**
	 * @dataProvider data_should_supply_correct_mime_type_for_php_version
	 *
	 * @param int   $php_version_id PHP_VERSION_ID value.
	 * @param array $expected       Expected mime types.
	 */
	public function test_should_supply_correct_mime_type_for_php_version( $php_version_id, $expected ) {
		$mimes = WP_Font_Library::get_expected_font_mime_types_per_php_version( $php_version_id );
		$this->assertSame( $expected, $mimes );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_supply_correct_mime_type_for_php_version() {
		return array(
			'version 7.2' => array(
				'php_version_id' => 70200,
				'expected'       => array(
					'otf'   => 'application/vnd.ms-opentype',
					'ttf'   => 'application/x-font-ttf',
					'woff'  => 'application/font-woff',
					'woff2' => 'application/font-woff2',
				),
			),
			'version 7.3' => array(
				'php_version_id' => 70300,
				'expected'       => array(
					'otf'   => 'application/vnd.ms-opentype',
					'ttf'   => 'application/font-sfnt',
					'woff'  => 'application/font-woff',
					'woff2' => 'application/font-woff2',
				),
			),
			'version 7.4' => array(
				'php_version_id' => 70400,
				'expected'       => array(
					'otf'   => 'application/vnd.ms-opentype',
					'ttf'   => 'font/sfnt',
					'woff'  => 'application/font-woff',
					'woff2' => 'application/font-woff2',
				),
			),
			'version 8.0' => array(
				'php_version_id' => 80000,
				'expected'       => array(
					'otf'   => 'application/vnd.ms-opentype',
					'ttf'   => 'font/sfnt',
					'woff'  => 'application/font-woff',
					'woff2' => 'application/font-woff2',
				),
			),
			'version 8.1' => array(
				'php_version_id' => 80100,
				'expected'       => array(
					'otf'   => 'application/vnd.ms-opentype',
					'ttf'   => 'font/sfnt',
					'woff'  => 'font/woff',
					'woff2' => 'font/woff2',
				),
			),
			'version 8.2' => array(
				'php_version_id' => 80200,
				'expected'       => array(
					'otf'   => 'application/vnd.ms-opentype',
					'ttf'   => 'font/sfnt',
					'woff'  => 'font/woff',
					'woff2' => 'font/woff2',
				),
			),
		);
	}
}
