<?php
/**
 * Fonts Library class.
 *
 * This file contains the Fonts Library class definition.
 *
 * @package    Gutenberg
 * @subpackage Fonts Library
 * @since      X.X.X
 */

if ( class_exists( 'WP_Fonts_Library' ) ) {
	return;
}

class WP_Fonts_Library {

	const ALLOWED_FONT_MIME_TYPES = array(
		'otf'   => 'font/otf',
		'ttf'   => 'font/ttf',
		'woff'  => 'font/woff',
		'woff2' => 'font/woff2',
	);

	/**
	 * Returns the absolute path to the fonts directory.
	 *
	 * @return string Path to the fonts directory.
	 */
	public static function get_fonts_directory() {
		return path_join( WP_CONTENT_DIR, 'fonts' );
	}

	/**
	 * Returns the relative path to the fonts directory.
	 *
	 * @return string Relative path to the fonts directory.
	 */
	public static function get_relative_fonts_path() {
		return content_url( '/fonts/' );
	}

	/**
	 * Define WP_FONTS_DIR constant to make it available to the rest of the code.
	 */
	public static function define_fonts_directory() {
		define( 'WP_FONTS_DIR', self::get_fonts_directory() );
	}

	/**
	 * Create fonts directory if it doesn't exist.
	 */
	public static function create_fonts_directory() {
		wp_mkdir_p( self::get_fonts_directory() );
	}

}
