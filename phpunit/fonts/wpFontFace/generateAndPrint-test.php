<?php
/**
 * Test case for WP_Font_Face::generate_and_print().
 *
 * @package    WordPress
 * @subpackage Fonts
 */

require_once __DIR__ . '/../wp-font-face-tests-dataset.php';

/*
 * This code is only needed if the Font API is enabled.
 * @todo remove this code when Font Library is merged into Gutenberg.
 */
if ( ! class_exists( 'WP_Font_Face' ) ) {
	require_once __DIR__ . '/../../../lib/experimental/fonts/class-wp-font-face.php';
	require_once __DIR__ . '/../../../lib/experimental/fonts/class-wp-font-face-resolver.php';
	require_once __DIR__ . '/../../../lib/experimental/fonts/fonts.php';
}

/**
 * Test WP_Font_Face::generate_and_print().
 *
 * @package WordPress
 * @subpackage Fonts
 *
 * @since X.X.X
 * @group fonts
 * @group fontface
 * @covers WP_Font_Face::generate_and_print
 */
class Tests_Fonts_WPFontFace_GenerateAndPrint extends WP_UnitTestCase {
	use WP_Font_Face_Tests_Datasets;

	public function test_should_not_generate_and_print_when_no_fonts() {
		$font_face = new WP_Font_Face();
		$fonts     = array();

		$this->expectOutputString( '' );
		$font_face->generate_and_print( $fonts );
	}

	/**
	 * @dataProvider data_should_print_given_fonts
	 *
	 * @param array  $fonts Prepared fonts.
	 * @param string $expected Expected CSS.
	 */
	public function test_should_generate_and_print_given_fonts( array $fonts, $expected ) {
		$font_face       = new WP_Font_Face();
		$style_element   = "<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n";
		$expected_output = sprintf( $style_element, $expected );

		$this->expectOutputString( $expected_output );
		$font_face->generate_and_print( $fonts );
	}
}
