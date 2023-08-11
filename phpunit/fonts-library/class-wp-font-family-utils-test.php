<?php
/**
 * Tests for Font Family class
 *
 * @package    Gutenberg
 * @subpackage Fonts Library
 */

/**
 * @coversDefaultClass WP_Font_Family_Utils
 */
class WP_Font_Family_Utils_Test extends WP_UnitTestCase {

	/**
	 * @covers ::has_font_mime_type
	 *
	 * @dataProvider data_has_font_mime_type_fixtures
	 *
	 * @param string $font_file Font file path.
	 * @param bool   $expected  Expected result.
	 */
	public function test_has_font_mime_type( $font_file, $expected ) {
		$this->assertSame( $expected, WP_Font_Family_Utils::has_font_mime_type( $font_file ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_has_font_mime_type_fixtures() {
		return array(
			'ttf'   => array(
				'font_file' => '/temp/piazzolla_400_italic.ttf',
				'expected'  => true,
			),
			'otf'   => array(
				'font_file' => '/temp/piazzolla_400_italic.otf',
				'expected'  => true,
			),
			'woff'  => array(
				'font_file' => '/temp/piazzolla_400_italic.woff',
				'expected'  => true,
			),
			'woff2' => array(
				'font_file' => '/temp/piazzolla_400_italic.woff2',
				'expected'  => true,
			),
			'exe'   => array(
				'font_file' => '/temp/piazzolla_400_italic.exe',
				'expected'  => false,
			),
			'php'   => array(
				'font_file' => '/temp/piazzolla_400_italic.php',
				'expected'  => false,
			),
		);
	}

	/**
	 * @covers ::get_filename_from_font_face
	 *
	 * @dataProvider data_get_filename_from_font_face_fixtures
	 *
	 * @param string $slug               Font slug.
	 * @param array  $font_face          Font face data in theme.json format.
	 * @param string $suffix             Suffix added to the resulting filename. Default empty string.
	 * @param string $expected_file_name Expected file name.
	 */
	public function test_get_filename_from_font_face( $slug, $font_face, $suffix, $expected_file_name ) {

		$this->assertSame(
			$expected_file_name,
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
	public function data_get_filename_from_font_face_fixtures() {
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

	/**
	 * @covers ::merge_fonts_data
	 *
	 * @dataProvider data_merge_fonts_data_fixtures
	 *
	 * @param bool  $are_mergeable   Whether the fonts are mergeable.
	 * @param array $font1           First font data in theme.json format.
	 * @param array $font2           Second font data in theme.json format.
	 * @param array $expected_result Expected result.
	 */
	public function test_merge_fonts_data( $are_mergeable, $font1, $font2, $expected_result ) {
		// Fonts with same slug should be merged.
		$merged_font = WP_Font_Family_Utils::merge_fonts_data( $font1, $font2 );

		if ( $are_mergeable ) {
			$this->assertNotWPError( $merged_font, 'Fonts could not be merged' );
			$this->assertSame( $expected_result, $merged_font, 'The font family data and font faces merged not as expected' );
		} else {
			$this->assertWPError( $merged_font, 'Merging non mergeable fonts (diifferent slug) should have failed.' );
		}
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_merge_fonts_data_fixtures() {
		return array(

			'mergeable_fonts'                          => array(
				'are_mergeable'   => true,
				'font1'           => array(
					'slug'       => 'piazzolla',
					'name'       => 'Piazzolla',
					'fontFamily' => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
							'src'        => 'http://example.com/fonts/piazzolla_400_italic.ttf',
						),
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '500',
							'src'        => 'http://example.com/fonts/piazzolla_500_italic.ttf',
						),
					),
				),
				'font2'           => array(
					'slug'       => 'piazzolla',
					'fontFamily' => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'normal',
							'fontWeight' => '600',
							'src'        => 'http://example.com/fonts/piazzolla_600_normal.ttf',
						),
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'normal',
							'fontWeight' => '700',
							'src'        => 'http://example.com/fonts/piazzolla_700_normal.ttf',
						),
					),
				),
				'expected_result' => array(
					'slug'       => 'piazzolla',
					'name'       => 'Piazzolla',
					'fontFamily' => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
							'src'        => 'http://example.com/fonts/piazzolla_400_italic.ttf',
						),
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '500',
							'src'        => 'http://example.com/fonts/piazzolla_500_italic.ttf',
						),
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'normal',
							'fontWeight' => '600',
							'src'        => 'http://example.com/fonts/piazzolla_600_normal.ttf',
						),
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'normal',
							'fontWeight' => '700',
							'src'        => 'http://example.com/fonts/piazzolla_700_normal.ttf',
						),
					),
				),
			),

			'mergeable_fonts_with_repeated_font_faces' => array(
				'are_mergeable'   => true,
				'font1'           => array(
					'slug'       => 'piazzolla',
					'name'       => 'Piazzolla',
					'fontFamily' => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
							'src'        => 'http://example.com/fonts/piazzolla_400_italic.ttf',
						),
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '500',
							'src'        => 'http://example.com/fonts/piazzolla_500_italic.ttf',
						),
					),
				),
				'font2'           => array(
					'slug'       => 'piazzolla',
					'fontFamily' => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'normal',
							'fontWeight' => '600',
							'src'        => 'http://example.com/fonts/piazzolla_600_normal.ttf',
						),
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
							'src'        => 'http://example.com/fonts/piazzolla_400_italic.ttf',
						),
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '500',
							'src'        => 'http://example.com/fonts/piazzolla_500_italic.ttf',
						),
					),
				),
				'expected_result' => array(
					'slug'       => 'piazzolla',
					'name'       => 'Piazzolla',
					'fontFamily' => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
							'src'        => 'http://example.com/fonts/piazzolla_400_italic.ttf',
						),
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '500',
							'src'        => 'http://example.com/fonts/piazzolla_500_italic.ttf',
						),
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'normal',
							'fontWeight' => '600',
							'src'        => 'http://example.com/fonts/piazzolla_600_normal.ttf',
						),
					),
				),
			),

			'non_mergeable_fonts'                      => array(
				'are_mergeable'   => false,
				'font1'           => array(
					'slug'       => 'piazzolla',
					'name'       => 'Piazzolla',
					'fontFamily' => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
							'src'        => 'http://example.com/fonts/piazzolla_400_italic.ttf',
						),
					),
				),
				'font2'           => array(
					'slug'       => 'inter',
					'fontFamily' => 'Inter',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Inter',
							'fontStyle'  => 'normal',
							'fontWeight' => '700',
							'src'        => 'http://example.com/fonts/inter_700_normal.ttf',
						),
					),
				),
				'expected_result' => 'WP_Error',
			),

		);
	}

}
