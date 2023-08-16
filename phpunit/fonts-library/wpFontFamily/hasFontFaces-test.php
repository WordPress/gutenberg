<?php
/**
 * Test WP_Font_Family::has_font_faces().
 *
 * @package WordPress
 * @subpackage Fonts Library
 *
 * @group fonts
 * @group fonts-library
 *
 * @covers WP_Font_Family::has_font_faces
 */
class Tests_Fonts_WpFontFamily_HasFontFaces extends WP_UnitTestCase {

	public function test_should_return_true_when_check_succeeds() {
		$font_data = array(
			'slug'     => 'piazzolla',
			'fontFace' => array(
				array(
					'fontFamily' => 'Piazzolla',
					'fontStyle'  => 'italic',
					'fontWeight' => '400',
				),
			),
		);
		$font      = new WP_Font_Family( $font_data );
		$this->assertTrue( $font->has_font_faces() );
	}

	/**
	 * @dataProvider data_should_return_false_when_check_fails
	 *
	 * @param array $font_data Font family data in theme.json format.
	 */
	public function test_should_return_false_when_check_fails( $font_data ) {
		$font = new WP_Font_Family( $font_data );
		$this->assertFalse( $font->has_font_faces() );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_return_false_when_check_fails() {
		return array(
			'wrong fontFace key' => array(
				array(
					'slug'      => 'piazzolla',
					'fontFaces' => array(
						array(
							'fontFamily' => 'Piazzolla',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
						),
					),
				),
			),
			'without font faces' => array(
				array(
					'slug' => 'piazzolla',
				),
			),
			'empty array'        => array(
				array(
					'slug'     => 'piazzolla',
					'fontFace' => array(),
				),
			),
			'null'               => array(
				array(
					'slug'     => 'piazzolla',
					'fontFace' => null,
				),
			),
		);
	}
}
