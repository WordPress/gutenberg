<?php
/**
 * Tests for Font Family class
 *
 * @package    Gutenberg
 * @subpackage Fonts Library
 * 
 */

 /**
 * @coversDefaultClass WP_Font_Family_Utils
 */
class WP_Font_Family_Utils_Test extends WP_UnitTestCase {

	/**
     * @covers ::has_font_mime_type
     */
	public function test_has_font_mime_type() {
		$this->assertFalse(
			WP_Font_Family_Utils::has_font_mime_type( '/temp/not-a-font.ttf.exe' )
		);
		$this->assertFalse(
			WP_Font_Family_Utils::has_font_mime_type( '/temp/not-a-font.otf.php' )
		);
		$this->assertTrue(
			WP_Font_Family_Utils::has_font_mime_type( '/temp/piazzolla_400_italic.ttf' )
		);
		$this->assertTrue(
			WP_Font_Family_Utils::has_font_mime_type( '/temp/piazzolla_400_italic.otf' )
		);
		$this->assertTrue(
			WP_Font_Family_Utils::has_font_mime_type( '/temp/piazzolla_400_italic.woff' )
		);
		$this->assertTrue(
			WP_Font_Family_Utils::has_font_mime_type( '/temp/piazzolla_400_italic.woff2' )
		);
	}

	/**
     * @covers ::get_filename_from_font_face
     */
	public function test_get_filename_from_font_face() {
		$font_face = array(
			'fontFamily' => 'Piazzolla',
			'fontStyle'  => 'italic',
			'fontWeight' => '400',
			'src'        => array(
				'http://example.com/fonts/piazzolla1.ttf',
				'http://example.com/fonts/piazzolla2.ttf',
				'http://example.com/fonts/piazzolla3.ttf',
			),
		);

		$this->assertSame(
			WP_Font_Family_Utils::get_filename_from_font_face( $font_face, $font_face['src'][0] ),
			'piazzolla_italic_400.ttf'
		);

		$this->assertSame(
			WP_Font_Family_Utils::get_filename_from_font_face( $font_face, $font_face['src'][1], 2 ),
			'piazzolla_italic_400_2.ttf'
		);

		$this->assertSame(
			WP_Font_Family_Utils::get_filename_from_font_face( $font_face, $font_face['src'][2], 3 ),
			'piazzolla_italic_400_3.ttf'
		);
	}

	/**
     * @covers ::merge_fonts_data
     */
	public function test_merge_fonts_data() {
		$font1 = array(
			'slug'       => 'Piazzolla',
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
		);

		$font2 = array(
			'slug'       => 'Piazzolla',
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
					'fontStyle'  => 'normal',
					'fontWeight' => '400',
					'src'        => 'http://example.com/fonts/piazzolla_400_normal.ttf',
				),
				array(
					'fontFamily' => 'Piazzolla',
					'fontStyle'  => 'italic',
					'fontWeight' => '700',
					'src'        => 'http://example.com/fonts/piazzolla_700_italic.ttf',
				),
			),
		);

		$font3 = array(
			'slug'       => 'encode-sans',
			'name'       => 'Encode Sans',
			'fontFamily' => 'Encode Sans',
		);

		// Fonts with same slug should be merged
		$merged_font = WP_Font_Family_Utils::merge_fonts_data( $font1, $font2 );
		$this->assertNotWPError( $merged_font );

		// Total of font faces without duplicates
		$this->assertCount( 4, $merged_font['fontFace'] );

		// Missing keys should be added to the merged result
		$this->assertSame(
			$merged_font['name'],
			'Piazzolla'
		);

		// Fonts with different slugs should not be merged
		$merged_font = WP_Font_Family_Utils::merge_fonts_data( $font1, $font3 );
		$this->assertWPError( $merged_font );
	}

}
