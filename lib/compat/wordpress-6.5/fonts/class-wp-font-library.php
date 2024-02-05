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
		 * @param string $slug         Font collection slug.
		 * @param array  $data_or_file Font collection data array or a path/URL to a JSON file
		 *                             containing the font collection.
		 *                             See {@see wp_register_font_collection()} for the supported fields.
		 * @return WP_Font_Collection|WP_Error A font collection if it was registered successfully,
		 *                                     or WP_Error object on failure.
		 */
		public static function register_font_collection( $slug, $data_or_file ) {
			$new_collection = new WP_Font_Collection( $slug, $data_or_file );

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
		 * Unregisters a previously registered font collection.
		 *
		 * @since 6.5.0
		 *
		 * @param string $slug Font collection slug.
		 * @return bool True if the font collection was unregistered successfully and false otherwise.
		 */
		public static function unregister_font_collection( $slug ) {
			if ( ! self::is_collection_registered( $slug ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Font collection slug. */
					sprintf( __( 'Font collection "%s" not found.' ), $slug ),
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
		 * @return WP_Font_Collection|WP_Error Font collection object,
		 *                                     or WP_Error object if the font collection doesn't exist.
		 */
		public static function get_font_collection( $slug ) {
			if ( array_key_exists( $slug, self::$collections ) ) {
				return self::$collections[ $slug ];
			}
			return new WP_Error( 'font_collection_not_found', 'Font collection not found.' );
		}
	}
}
