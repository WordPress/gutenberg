<?php
/**
 * Test case for wp_print_font_faces().
 *
 * @package    WordPress
 * @subpackage Fonts
 */

/**
 * This code is only needed if the Font API is enabled.
 * It should be removed after Font Manager is merged into Gutenberg.
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
 * @covers wp_print_font_faces
 */
class Tests_Fonts_WPPrintFontFaces extends WP_UnitTestCase {

}
