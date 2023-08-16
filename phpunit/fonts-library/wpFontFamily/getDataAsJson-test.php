<?php
/**
 * Test WP_Font_Family::get_data_as_json().
 *
 * @package WordPress
 * @subpackage Fonts Library
 *
 * @group fonts
 * @group fonts-library
 *
 * @covers WP_Font_Family::get_data_as_json
 */
class Tests_Fonts_WpFontFamily_GetDataAsJson extends WP_UnitTestCase {

	/**
	 * @dataProvider data_should_get_data_as_json
	 *
	 * @param array  $font_data Font family data in theme.json format.
	 * @param string $expected  Expected result.
	 */
	public function test_should_get_data_as_json( $font_data, $expected ) {
		$font = new WP_Font_Family( $font_data );
		$this->assertSame( $expected, $font->get_data_as_json() );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_get_data_as_json() {
		return array(
			'piazzolla'  => array(
				'font_data' => array(
					'slug'       => 'piazzolla',
					'fontFamily' => 'Piazzolla',
					'name'       => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'src'        => 'https://example.com/fonts/piazzolla_italic_400.ttf',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
						),
					),
				),
				'expected'  => '{"slug":"piazzolla","fontFamily":"Piazzolla","name":"Piazzolla","fontFace":[{"fontFamily":"Piazzolla","src":"https:\/\/example.com\/fonts\/piazzolla_italic_400.ttf","fontStyle":"italic","fontWeight":"400"}]}',
			),
			'piazzolla2' => array(
				'font_data' => array(
					'slug'       => 'piazzolla',
					'fontFamily' => 'Piazzolla',
					'name'       => 'Piazzolla',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Piazzolla',
							'src'        => 'https://example.com/fonts/piazzolla_italic_400.ttf',
							'fontStyle'  => 'italic',
							'fontWeight' => '400',
						),
					),
				),
				'expected'  => '{"slug":"piazzolla","fontFamily":"Piazzolla","name":"Piazzolla","fontFace":[{"fontFamily":"Piazzolla","src":"https:\/\/example.com\/fonts\/piazzolla_italic_400.ttf","fontStyle":"italic","fontWeight":"400"}]}',
			),
		);
	}
}
