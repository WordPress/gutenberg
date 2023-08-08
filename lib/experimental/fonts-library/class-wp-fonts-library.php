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

/**
 * Fonts Library class.
 */
class WP_Fonts_Library {

	const ALLOWED_FONT_MIME_TYPES = array(
		'otf'   => 'font/otf',
		'ttf'   => 'font/ttf',
		'woff'  => 'font/woff',
		'woff2' => 'font/woff2',
	);

	/**
	 * Gets the upload directory for fonts.
	 *
	 * @return string Path of the upload directory for fonts.
	 */
	public static function get_fonts_dir() {
		return wp_upload_dir()['basedir'] . '/fonts';
	}

	/**
	 * Sets the upload directory for fonts.
	 *
	 * @param array $defaults Default upload directory.
	 * @return array Modified upload directory.
	 */
	public static function set_upload_dir( $defaults ) {
		$defaults['subdir'] = '/fonts';
		$defaults['path']   = $defaults['basedir'] . $defaults['subdir'];
		$defaults['url']    = $defaults['baseurl'] . $defaults['subdir'];
		return $defaults;
	}

	/**
	 * Registers the fonts library post type.
	 */
	public static function register_post_type() {
		$args = array(
			'public'       => true,
			'label'        => 'Font Library',
			'show_in_rest' => true,
		);
		register_post_type( 'wp_font_family', $args );
	}

}
