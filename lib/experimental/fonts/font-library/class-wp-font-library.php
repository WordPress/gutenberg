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

	const ALLOWED_FONT_MIME_TYPES = array(
		'otf'   => 'font/otf',
		'ttf'   => 'font/ttf',
		'woff'  => 'font/woff',
		'woff2' => 'font/woff2',
	);

	/**
	 * Font collections.
	 *
	 * @since 6.4.0
	 *
	 * @var array
	 */
	public static $collections = array();

	/**
	 * Register filter to extend the library with font collections.
	 *
	 * @since 6.4.0
	 */
	public static function register_filters() {
		add_filter(
			'wp_register_font_collection',
			array( 'WP_Font_Library', 'register_font_collection' ),
			10,
			2
		);
	}

	/**
	 * Register a new font collection.
	 *
	 * @since 6.4.0
	 *
	 * @param string $id Font collection id.
	 * @param array  $config Font collection config options.
	 * @return WP_Font_Collection|WP_Error A font collection is it was registered succesfully and a WP_Error otherwise.
	 */
	public static function register_font_collection( $id, $config ) {
		if ( array_key_exists( $id, self::$collections ) ) {
			return new WP_Error( 'font_collection_registration_error', 'Font collection already registered.' );
		}

		try {
			$new_collection           = new WP_Font_Collection( $id, $config );
			self::$collections[ $id ] = $new_collection;
			return $new_collection;
		} catch ( Exception $e ) {
			return new WP_Error( 'font_collection_error', $e->getMessage() );
		}
	}

	/**
	 * Gets all the font collections available.
	 *
	 * @since 6.4.0
	 *
	 * @return array List of font collections.
	 */
	public static function get_font_collections() {
		return self::$collections;
	}

	/**
	 * Gets a font collection.
	 *
	 * @since 6.4.0
	 *
	 * @param string $id Font collection id.
	 * @return array List of font collections.
	 */
	public static function get_font_collection( $id ) {
		if ( array_key_exists( $id, self::$collections ) ) {
			return self::$collections[ $id ];
		}
		return new WP_Error( 'font_collection_not_found', 'Font collection not found.' );
	}

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
