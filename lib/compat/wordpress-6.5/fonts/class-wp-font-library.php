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
		 * Font collections storage.
		 *
		 * Holds registered font collections.
		 *
		 * @since 6.5.0
		 *
		 * @var WP_Font_Collection[]
		 */
		private static $collections = array();

		/**
		 * Gets the expected mime types for font files based on PHP version.
		 *
		 * Provides the correct mime-type values for font files, which can vary between PHP versions.
		 *
		 * @since 6.5.0
		 *
		 * @param int $php_version_id The PHP version ID for which to provide mime types. Defaults to the current PHP version.
		 * @return array Associative array of mime types keyed by file extension.
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
		 * Registers a new font collection.
		 *
		 * @since 6.5.0
		 *
		 * @param string $slug Font collection slug.
		 * @param array  $args Font collection config options.
		 *                     See {@see wp_register_font_collection()} for the supported fields.
		 * @return WP_Font_Collection|WP_Error A font collection if registration was successful, or WP_Error object on failure.
		 */
		public static function register_font_collection( $slug, $args = array() ) {
			$new_collection = new WP_Font_Collection( $slug, $args );

			if ( self::is_collection_registered( $new_collection->slug ) ) {
				$error_message = sprintf(
				/* translators: %s: Font collection slug. */
					__( 'Font collection with slug: "%s" is already registered.', 'gutenberg' ),
					$new_collection->slug
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
		 * Registers a new font collection from a JSON file.
		 *
		 * @since 6.5.0
		 *
		 * @param string $file_or_url Path or URL to the JSON file containing the font collection data.
		 * @return WP_Font_Collection|WP_Error WP_Font_Collection object if successful, or WP_Error object on failure.
		 */
		public static function register_font_collection_from_json( $file_or_url ) {
			$args = WP_Font_Collection::load_from_json( $file_or_url );
			if ( is_wp_error( $args ) ) {
				return $args;
			}

			return self::register_font_collection( $args['slug'], $args );
		}

		/**
		 * Unregisters a previously registered font collection.
		 *
		 * @since 6.5.0
		 *
		 * @param string $slug The slug of the font collection to unregister.
		 * @return bool True on successful unregistration, false otherwise.
		 */
		public static function unregister_font_collection( $slug ) {
			if ( ! self::is_collection_registered( $slug ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Font collection slug. */
					sprintf( __( 'Font collection "%s" not found.', 'gutenberg' ), $slug ),
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
		 * @param string $slug The slug of the font collection to check.
		 * @return bool True if registered, false otherwise.
		 */
		private static function is_collection_registered( $slug ) {
			return array_key_exists( $slug, self::$collections );
		}

		/**
		 * Retrieves all registered font collections.
		 *
		 * @since 6.5.0
		 *
		 * @return WP_Font_Collection[] Array of WP_Font_Collection objects.
		 */
		public static function get_font_collections() {
			return self::$collections;
		}

		/**
		 * Retrieves a specific font collection.
		 *
		 * Returns a font collection object based on its slug, if registered.
		 *
		 * @since 6.5.0
		 *
		 * @param string $slug The slug of the font collection to retrieve.
		 * @return WP_Font_Collection|WP_Error WP_Font_Collection object if found, or WP_Error object on failure.
		 */
		public static function get_font_collection( $slug ) {
			if ( array_key_exists( $slug, self::$collections ) ) {
				return self::$collections[ $slug ];
			}

			return new WP_Error( 'font_collection_not_found', 'Font collection not found.' );
		}

		/**
		 * Sets allowed mime types for font uploads.
		 *
		 * @since 6.5.0
		 *
		 * @param array $mime_types Current array of allowed mime types.
		 * @return array Updated array of allowed mime types including font mime types.
		 */
		public static function set_allowed_mime_types( $mime_types ) {
			return array_merge( $mime_types, self::get_expected_font_mime_types_per_php_version() );
		}
	}
}
