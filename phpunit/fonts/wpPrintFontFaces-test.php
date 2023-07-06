<?php
/**
 * Test case for wp_print_font_faces().
 *
 * @package    WordPress
 * @subpackage Fonts
 */

require_once __DIR__ . '/wp-font-face-tests-dataset.php';

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
class Tests_Fonts_WPPrintFontFaces extends WP_UnitTestCase {
	use WP_Font_Face_Tests_Datasets;

	/**
	 * @dataProvider data_should_print_given_fonts
	 *
	 * @param array  $fonts    Fonts to process.
	 * @param string $expected Expected CSS.
	 */
	public function test_should_print_given_fonts( array $fonts, $expected ) {
		$style_element   = "<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n";
		$expected_output = sprintf( $style_element, $expected );

		$this->expectOutputString( $expected_output );
		wp_print_font_faces( $fonts );
	}
}
