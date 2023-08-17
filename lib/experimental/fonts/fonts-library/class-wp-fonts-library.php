<?php
/**
 * Fonts Library class.
 *
 * This file contains the Fonts Library class definition.
 *
 * @package    WordPress
 * @subpackage Fonts Library
 * @since      6.4.0
 */

if ( class_exists( 'WP_Fonts_Library' ) ) {
	return;
}

/**
 * Fonts Library class.
 *
 * @since 6.4.0
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
	 * @since 6.4.0
	 *
	 * @return string Path of the upload directory for fonts.
	 */
	public static function get_fonts_dir() {
		return wp_upload_dir()['basedir'] . '/fonts';
	}

	/**
	 * Sets the upload directory for fonts.
	 *
	 * @since 6.4.0
	 *
	 * @param array $defaults {
	 *     Default upload directory.
	 *
	 *     @type string $path    Path to the directory.
	 *     @type string $url     URL for the directory.
	 *     @type string $subdir  Sub-directory of the directory.
	 *     @type string $basedir Base directory.
	 *     @type string $baseurl Base URL.
	 * }
	 * @return array Modified upload directory.
	 */
	public static function set_upload_dir( $defaults ) {
		$defaults['subdir'] = '/fonts';
		$defaults['path']   = $defaults['basedir'] . $defaults['subdir'];
		$defaults['url']    = $defaults['baseurl'] . $defaults['subdir'];

		return $defaults;
	}
}
