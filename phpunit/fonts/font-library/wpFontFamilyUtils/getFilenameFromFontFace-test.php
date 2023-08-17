<?php
/**
 * Test WP_Font_Family_Utils::get_filename_from_font_face().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Family_Utils::get_filename_from_font_face
 */
class Tests_Fonts_WpFontsFamilyUtils_GetFilenameFromFontFace extends WP_UnitTestCase {

	/**
	 * @dataProvider data_should_get_filename
	 *
	 * @param string $slug      Font slug.
	 * @param array  $font_face Font face data in theme.json format.
	 * @param string $suffix    Suffix added to the resulting filename.
	 * @param string $expected  Expected filename.
	 */
	public function test_should_get_filename( $slug, $font_face, $suffix, $expected ) {
		$this->assertSame(
			$expected,
			WP_Font_Family_Utils::get_filename_from_font_face(
				$slug,
				$font_face,
				$font_face['src'],
				$suffix
			)
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_get_filename() {
		return array(
			'piazzolla' => array(
				'slug'               => 'piazzolla',
				'font_face'          => array(
					'fontStyle'  => 'italic',
					'fontWeight' => '400',
					'src'        => 'http://example.com/fonts/font_file.ttf',
				),
				'suffix'             => '',
				'expected_file_name' => 'piazzolla_italic_400.ttf',
			),
			'inter'     => array(
				'slug'               => 'inter',
				'font_face'          => array(
					'fontStyle'  => 'normal',
					'fontWeight' => '600',
					'src'        => 'http://example.com/fonts/font_file.otf',
				),
				'suffix'             => '',
				'expected_file_name' => 'inter_normal_600.otf',
			),
		);
	}
}
