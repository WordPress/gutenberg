<?php
/**
 * Test case for wp_print_font_faces().
 *
 * @package    WordPress
 * @subpackage Fonts
 */

require_once __DIR__ . '/base.php';

/**
 * Test wp_print_font_faces().
 *
 * @package WordPress
 * @subpackage Fonts
 *
 * @since X.X.X
 * @group fonts
 * @group fontface
 * @covers wp_print_font_faces
 */
class Tests_Fonts_WPPrintFontFaces extends WP_Font_Face_TestCase {
	const FONTS_THEME = 'fonts-block-theme';

	public static function set_up_before_class() {
		self::$requires_switch_theme_fixtures = true;

		parent::set_up_before_class();
	}

	public function test_should_not_print_when_no_fonts() {
		switch_theme( 'block-theme' );

		$this->expectOutputString( '' );
		wp_print_font_faces();
	}

	/**
	 * @dataProvider data_should_print_given_fonts
	 *
	 * @param array  $fonts    Fonts to process.
	 * @param string $expected Expected CSS.
	 */
	public function test_should_print_given_fonts( array $fonts, $expected ) {
		$expected_output = $this->get_expected_styles_output( $expected );

		$this->expectOutputString( $expected_output );
		wp_print_font_faces( $fonts );
	}

	public function test_should_print_fonts_in_merged_data() {
		switch_theme( static::FONTS_THEME );

		$expected        = $this->get_expected_fonts_for_fonts_block_theme( 'font_face_styles' );
		$expected_output = $this->get_expected_styles_output( $expected );

		$this->expectOutputString( $expected_output );
		wp_print_font_faces();
	}

	private function get_expected_styles_output( $styles ) {
		$style_element = "<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n";
		return sprintf( $style_element, $styles );
	}
}
