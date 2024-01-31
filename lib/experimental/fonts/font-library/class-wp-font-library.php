<?php
/**
 * Font Library class.
 *
 * This file contains the Font Library class definition.
 *
 * @package    WordPress
 * @subpackage Font Library
 * @since      6.5.0
 */

if ( ! class_exists( 'WP_Font_Library' ) ) {

	/**
	 * Font Library class.
	 *
	 * @since 6.5.0
	 */
	class WP_Font_Library {

		/**
		 * Provide the expected mime-type value for font files per-PHP release. Due to differences in the values returned these values differ between PHP versions.
		 *
		 * This is necessary until a collection of valid mime-types per-file extension can be provided to 'upload_mimes' filter.
		 *
		 * @since 6.5.0
		 *
		 * @param array $php_version_id The version of PHP to provide mime types for. The default is the current PHP version.
		 *
		 * @return Array A collection of mime types keyed by file extension.
		 */
		public static function get_expected_font_mime_types_per_php_version( $php_version_id = PHP_VERSION_ID ) {

			$php_7_ttf_mime_type = $php_version_id >= 70300 ? 'application/font-sfnt' : 'application/x-font-ttf';

			return array(
				'otf'   => 'application/vnd.ms-opentype',
				'ttf'   => $php_version_id >= 70400 ? 'font/sfnt' : $php_7_ttf_mime_type,
				'woff'  => $php_version_id >= 80100 ? 'font/woff' : 'application/font-woff',
				'woff2' => $php_version_id >= 80100 ? 'font/woff2' : 'application/font-woff2',
			);
		}

		/**
		 * Font collections.
		 *
		 * @since 6.5.0
		 *
		 * @var array
		 */
		private static $collections = array();

		/**
		 * Register a new font collection.
		 *
		 * @since 6.5.0
		 *
		 * @param array $config Font collection config options.
		 *                      See {@see wp_register_font_collection()} for the supported fields.
		 * @return WP_Font_Collection|WP_Error A font collection is it was registered successfully and a WP_Error otherwise.
		 */
		public static function register_font_collection( $config ) {
			if ( ! WP_Font_Collection::is_config_valid( $config ) ) {
				$error_message = __( 'Font collection config is invalid.', 'gutenberg' );
				return new WP_Error( 'font_collection_registration_error', $error_message );
			}

			$new_collection = new WP_Font_Collection( $config );

			if ( self::is_collection_registered( $new_collection->slug ) ) {
				$error_message = sprintf(
					/* translators: %s: Font collection slug. */
					__( 'Font collection with slug: "%s" is already registered.', 'gutenberg' ),
					$config['slug']
				);
				_doing_it_wrong(
					__METHOD__,
					$error_message,
					'6.5.0'
				);
				return new WP_Error( 'font_collection_registration_error', $error_message );
			}
			self::$collections[ $new_collection->slug ] = $new_collection;
			return $new_collection;
		}

		/**
		 * Unregisters a previously registered font collection.
		 *
		 * @since 6.5.0
		 *
		 * @param string $collection_slug Font collection slug.
		 * @return bool True if the font collection was unregistered successfully and false otherwise.
		 */
		public static function unregister_font_collection( $slug ) {
			if ( ! self::is_collection_registered( $slug ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Font collection slug. */
					sprintf( __( 'Font collection "%s" not found.', 'default' ), $slug ),
					'6.5.0'
				);
				return false;
			}
			unset( self::$collections[ $slug ] );
			return true;
		}

		/**
		 * Checks if a font collection is registered.
		 *
		 * @since 6.5.0
		 *
		 * @param string $slug Font collection slug.
		 * @return bool True if the font collection is registered and false otherwise.
		 */
		private static function is_collection_registered( $slug ) {
			return array_key_exists( $slug, self::$collections );
		}

		/**
		 * Gets all the font collections available.
		 *
		 * @since 6.5.0
		 *
		 * @return array List of font collections.
		 */
		public static function get_font_collections() {
			return self::$collections;
		}

		/**
		 * Gets a font collection.
		 *
		 * @since 6.5.0
		 *
		 * @param string $slug Font collection slug.
		 * @return array List of font collections.
		 */
		public static function get_font_collection( $slug ) {
			if ( array_key_exists( $slug, self::$collections ) ) {
				return self::$collections[ $slug ];
			}
			return new WP_Error( 'font_collection_not_found', 'Font collection not found.' );
		}



		/**
		 * Sets the allowed mime types for fonts.
		 *
		 * @since 6.5.0
		 *
		 * @param array $mime_types List of allowed mime types.
		 * @return array Modified upload directory.
		 */
		public static function set_allowed_mime_types( $mime_types ) {
			return array_merge( $mime_types, self::get_expected_font_mime_types_per_php_version() );
		}
	}
}
