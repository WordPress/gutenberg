<?php
/**
 * Font Collection class.
 *
 * This file contains the Font Collection class definition.
 *
 * @package    WordPress
 * @subpackage Font Library
 * @since      6.5.0
 */

if ( ! class_exists( 'WP_Font_Collection' ) ) {

	/**
	 * Font Collection class.
	 *
	 * @since 6.5.0
	 */
	class WP_Font_Collection {
		/**
		 * The unique slug for the font collection.
		 *
		 * @since 6.5.0
		 *
		 * @var string
		 */
		public $slug;

		/**
		 * The name of the font collection.
		 *
		 * @since 6.5.0
		 *
		 * @var string
		 */
		public $name;

		/**
		 * Description of the font collection.
		 *
		 * @since 6.5.0
		 *
		 * @var string
		 */
		public $description;

		/**
		 * Array of font families in the collection.
		 *
		 * @since 6.5.0
		 *
		 * @var array
		 */
		public $font_families;

		/**
		 * Categories associated with the font collection.
		 *
		 * @since 6.5.0
		 *
		 * @var array
		 */
		public $categories;

		/**
		 * Font collection json cache.
		 *
		 * @since 6.5.0
		 *
		 * @var array
		 */
		private static $collection_json_cache = array();

		/**
		 * WP_Font_Collection constructor.
		 *
		 * @since 6.5.0
		 *
		 * @param string $slug Font collection slug.
		 * @param array  $args {
		 *     Optional. Font collection associative array of configuration options.
		 *
		 *     @type string $name           Name of the font collection.
		 *     @type string $description    Description of the font collection.
		 *     @type array  $font_families  Array of font family definitions that are in the collection.
		 *     @type array  $categories     Array of categories for the fonts that are in the collection.
		 * }
		 */
		public function __construct( $slug, $args = array() ) {
			$this->slug          = sanitize_title( $slug );
			$this->name          = isset( $args['name'] ) ? $args['name'] : __( 'Unnamed Font Collection', 'gutenberg' );
			$this->description   = isset( $args['description'] ) ? $args['description'] : '';
			$this->font_families = isset( $args['font_families'] ) ? $args['font_families'] : array();
			$this->categories    = isset( $args['categories'] ) ? $args['categories'] : array();

			if ( $this->slug !== $slug ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Font collection slug. */
					sprintf( __( 'Font collection slug "%s" is not valid. Slugs must use only alphanumeric characters, dashes, and underscores.', 'gutenberg' ), $slug ),
					'6.5.0'
				);
			}

			if ( empty( $args['font_families'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Font collection slug. */
					sprintf( __( 'Font collection "%s" does not contain any font families.', 'gutenberg' ), $slug ),
					'6.5.0'
				);
			}

			return true;
		}

		/**
		 * Loads the font collection data from a json file path or url.
		 *
		 * @since 6.5.0
		 *
		 * @param string $file_or_url File path or url to a json file containing the font collection data.
		 * @return array|WP_Error An array containing the font collection data on success,
		 *                        else an instance of WP_Error on failure.
		 */
		public static function load_from_json( $file_or_url ) {
			$url  = wp_http_validate_url( $file_or_url );
			$file = file_exists( $file_or_url ) ? wp_normalize_path( realpath( $file_or_url ) ) : false;

			if ( ! $url && ! $file ) {
				// translators: %s: File path or url to font collection json file.
				$message = sprintf( __( 'Font collection JSON file "%s" is invalid or does not exist.', 'gutenberg' ), $file_or_url );
				_doing_it_wrong( __METHOD__, $message, '6.5.0' );
				return new WP_Error( 'font_collection_json_missing', $message );
			}

			return $url ? self::load_from_url( $url ) : self::load_from_file( $file );
		}

		/**
		 * Loads the font collection data from a json file path.
		 *
		 * @since 6.5.0
		 *
		 * @param string $file File path to a json file containing the font collection data.
		 * @return array|WP_Error An array containing the font collection data on success,
		 *                        else an instance of WP_Error on failure.
		 */
		private static function load_from_file( $file ) {
			if ( array_key_exists( $file, static::$collection_json_cache ) ) {
				return static::$collection_json_cache[ $file ];
			}

			$data = wp_json_file_decode( $file, array( 'associative' => true ) );
			if ( empty( $data ) ) {
				return new WP_Error( 'font_collection_decode_error', __( 'Error decoding the font collection JSON file contents.', 'gutenberg' ) );
			}

			if ( empty( $data['slug'] ) ) {
				// translators: %s: Font collection JSON URL.
				$message = sprintf( __( 'Font collection JSON file "%s" requires a slug.', 'gutenberg' ), $file );
				_doing_it_wrong( __METHOD__, $message, '6.5.0' );
				return new WP_Error( 'font_collection_invalid_json', $message );
			}

			static::$collection_json_cache[ $file ] = $data;

			return $data;
		}

		/**
		 * Loads the font collection data from a json file url.
		 *
		 * @since 6.5.0
		 *
		 * @param string $url Url to a json file containing the font collection data.
		 * @return array|WP_Error An array containing the font collection data on success,
		 *                        else an instance of WP_Error on failure.
		 */
		private static function load_from_url( $url ) {
			if ( array_key_exists( $url, static::$collection_json_cache ) ) {
				return static::$collection_json_cache[ $url ];
			}

			// Limit key to 167 characters to avoid failure in the case of a long url.
			$transient_key = substr( 'wp_font_collection_url_' . $url, 0, 167 );
			$data          = get_site_transient( $transient_key );

			if ( false === $data ) {
				$response = wp_safe_remote_get( $url );
				if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
					// translators: %s: Font collection url.
					return new WP_Error( 'font_collection_request_error', sprintf( __( 'Error fetching the font collection data from "%s".', 'gutenberg' ), $url ) );
				}

				$data = json_decode( wp_remote_retrieve_body( $response ), true );
				if ( empty( $data ) ) {
					return new WP_Error( 'font_collection_decode_error', __( 'Error decoding the font collection data from the REST response JSON.', 'gutenberg' ) );
				}

				if ( empty( $data['slug'] ) ) {
					// translators: %s: Font collection JSON URL.
					$message = sprintf( __( 'Font collection JSON file "%s" requires a slug.', 'gutenberg' ), $url );
					_doing_it_wrong( __METHOD__, $message, '6.5.0' );
					return new WP_Error( 'font_collection_invalid_json', $message );
				}

				set_site_transient( $transient_key, $data, DAY_IN_SECONDS );
			}

			static::$collection_json_cache[ $url ] = $data;

			return $data;
		}
	}
}
