<?php
/**
 * Test WP_Font_Family_Utils::merge_fonts_data().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Family_Utils::merge_fonts_data
 */
class Tests_Fonts_WpFontsFamilyUtils_MergeFontsData extends WP_UnitTestCase {

	/**
	 * @dataProvider data_should_fail_merge
	 *
	 * @param array $font1 First font data in theme.json format.
	 * @param array $font2 Second font data in theme.json format.
	 */
	public function test_should_fail_merge( $font1, $font2 ) {
		$actual = WP_Font_Family_Utils::merge_fonts_data( $font1, $font2 );

		$this->assertWPError( $actual, 'WP_Error should have been returned' );
		$this->assertSame(
			array( 'fonts_must_have_same_slug' => array( 'Fonts must have the same slug to be merged.' ) ),
			$actual->errors,
			'WP_Error should have "fonts_must_have_same_slug" error'
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_fail_merge() {
		return array(
			'different slugs' => array(
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


	/**
	 * @dataProvider data_should_merge
	 *
	 * @param array $font1           First font data in theme.json format.
	 * @param array $font2           Second font data in theme.json format.
	 * @param array $expected_result Expected result.
	 */
	public function test_should_merge( array $font1, array $font2, array $expected_result ) {
		$actual = WP_Font_Family_Utils::merge_fonts_data( $font1, $font2 );

		$this->assertSame( $expected_result, $actual );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_merge() {
		return array(
			'with different font faces' => array(
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

			'repeated font faces'       => array(
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
		);
	}
}
