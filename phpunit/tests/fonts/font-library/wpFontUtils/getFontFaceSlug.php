<?php
/**
 * Test WP_Font_Utils::get_font_face_slug().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Utils::get_font_face_slug
 */
class Tests_Fonts_WpFontUtils_GetFontFaceSlug extends WP_UnitTestCase {
	/**
	 * @dataProvider data_get_font_face_slug_normalizes_values
	 *
	 * @param string[] $settings      Settings to test.
	 * @param string   $expected_slug Expected slug results.
	 */
	public function test_get_font_face_slug_normalizes_values( $settings, $expected_slug ) {
		$slug = WP_Font_Utils::get_font_face_slug( $settings );

		$this->assertSame( $expected_slug, $slug );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_font_face_slug_normalizes_values() {
		return array(
			'Sets defaults'                           => array(
				'settings'      => array(
					'fontFamily' => 'Open Sans',
				),
				'expected_slug' => 'open sans;normal;400;100%;U+0-10FFFF',
			),
			'Converts normal weight to 400'           => array(
				'settings'      => array(
					'fontFamily' => 'Open Sans',
					'fontWeight' => 'normal',
				),
				'expected_slug' => 'open sans;normal;400;100%;U+0-10FFFF',
			),
			'Converts bold weight to 700'             => array(
				'settings'      => array(
					'fontFamily' => 'Open Sans',
					'fontWeight' => 'bold',
				),
				'expected_slug' => 'open sans;normal;700;100%;U+0-10FFFF',
			),
			'Converts normal font-stretch to 100%'    => array(
				'settings'      => array(
					'fontFamily'  => 'Open Sans',
					'fontStretch' => 'normal',
				),
				'expected_slug' => 'open sans;normal;400;100%;U+0-10FFFF',
			),
			'Removes double quotes from fontFamilies' => array(
				'settings'      => array(
					'fontFamily' => '"Open Sans"',
				),
				'expected_slug' => 'open sans;normal;400;100%;U+0-10FFFF',
			),
			'Removes single quotes from fontFamilies' => array(
				'settings'      => array(
					'fontFamily' => "'Open Sans'",
				),
				'expected_slug' => 'open sans;normal;400;100%;U+0-10FFFF',
			),
			'Removes spaces between comma separated font families' => array(
				'settings'      => array(
					'fontFamily' => 'Open Sans, serif',
				),
				'expected_slug' => 'open sans,serif;normal;400;100%;U+0-10FFFF',
			),
			'Removes tabs between comma separated font families' => array(
				'settings'      => array(
					'fontFamily' => "Open Sans,\tserif",
				),
				'expected_slug' => 'open sans,serif;normal;400;100%;U+0-10FFFF',
			),
			'Removes new lines between comma separated font families' => array(
				'settings'      => array(
					'fontFamily' => "Open Sans,\nserif",
				),
				'expected_slug' => 'open sans,serif;normal;400;100%;U+0-10FFFF',
			),
		);
	}
}
