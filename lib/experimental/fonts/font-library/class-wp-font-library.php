<?php
/**
 * Font Library class.
 *
 * This file contains the Font Library class definition.
 *
 * @package    WordPress
 * @subpackage Font Library
 * @since      6.4.0
 */

if ( class_exists( 'WP_Font_Library' ) ) {
	return;
}

/**
 * Font Library class.
 *
 * @since 6.4.0
 */
class WP_Font_Library {

	/*
	* As of PHP 8.1.12, which includes libmagic/file update to version 5.42,
	* the expected mime type for WOFF files is 'font/woff'.
	*
	* See https://github.com/php/php-src/issues/8805.
	*/
	const ALLOWED_FONT_MIME_TYPES = array(
		'otf'   => 'font/otf',
		'ttf'   => PHP_VERSION_ID >= 80112 ? 'font/ttf' : 'application/x-font-ttf',
		'woff'  => PHP_VERSION_ID >= 80112 ? 'font/woff' : 'application/font-woff',
		'woff2' => PHP_VERSION_ID >= 80112 ? 'font/woff2' : 'application/font-woff2',
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

	public static function set_allowed_mime_types( $mime_types ) {
		return array_merge( $mime_types, self::ALLOWED_FONT_MIME_TYPES );
	}
}
