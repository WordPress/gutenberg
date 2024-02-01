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
		 * Font collection data schema.
		 *
		 * @since 6.5.0
		 *
		 * @var array
		 */
		public const SCHEMA = array(
			'slug'          => 'sanitize_title',
			'name'          => 'sanitize_text_field',
			'description'   => 'sanitize_text_field',
			'font_families' => array(
				array(
					'font_family_settings' => array(
						'name'       => 'sanitize_text_field',
						'slug'       => 'sanitize_text_field',
						'fontFamily' => 'sanitize_text_field',
						'fontFace'   => array(
							array(
								'fontFamily'            => 'sanitize_text_field',
								'fontStyle'             => 'sanitize_text_field',
								'fontWeight'            => 'sanitize_text_field',
								'fontDisplay'           => 'sanitize_text_field',
								'src'                   => 'sanitize_text_field',
								'fontStretch'           => 'sanitize_text_field',
								'ascentOverride'        => 'sanitize_text_field',
								'descentOverride'       => 'sanitize_text_field',
								'fontVariant'           => 'sanitize_text_field',
								'fontFeatureSettings'   => 'sanitize_text_field',
								'fontVariationSettings' => 'sanitize_text_field',
								'lineGapOverride'       => 'sanitize_text_field',
								'sizeAdjust'            => 'sanitize_text_field',
								'unicodeRange'          => 'sanitize_text_field',
							),
						),
					),
					'categories'           => array(
						'sanitize_text_field',
					),
				),
			),
			'categories'    => array(
				array(
					'slug' => 'sanitize_title',
					'name' => 'sanitize_text_field',
				),
			),
		);

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

			$data = self::sanitize( $data );

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
		protected static function load_from_url( $url ) {
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

				$data = self::sanitize( $data );

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


		/**
		 * Sanitize the font collection data.
		 *
		 * It removes the keys not in the schema and applies the sanitizator to the values.
		 *
		 * @since 6.5.0
		 *
		 * @param array $tree The font collection data to sanitize.
		 * @param array $schema The schema to use for sanitization.
		 * @return array The sanitized font collection data.
		 */
		public static function sanitize( $tree, $schema = self::SCHEMA ) {
			if ( ! is_array( $tree ) ) {
				return $tree;
			}

			foreach ( $tree as $key => $value ) {
				// Remove keys not in the schema or with null/empty values.
				if ( ! array_key_exists( $key, $schema ) ) {
					unset( $tree[ $key ] );
					continue;
				}

				// Check if the value is an array and requires further processing.
				if ( is_array( $value ) && is_array( $schema[ $key ] ) ) {
					// Determine if it is an associative or indexed array.
					$schema_is_assoc = self::is_assoc( $value );

					if ( $schema_is_assoc ) {
						// If it is an associative or indexed array., process as a single object.
						$tree[ $key ] = self::sanitize( $value, $schema[ $key ] );

						if ( empty( $tree[ $key ] ) ) {
							unset( $tree[ $key ] );
						}
					} else {
						// If indexed, process each item in the array.
						foreach ( $value as $item_key => $item_value ) {
							if ( isset( $schema[ $key ][0] ) && is_array( $schema[ $key ][0] ) ) {
								$tree[ $key ][ $item_key ] = self::sanitize( $item_value, $schema[ $key ][0] );
							} else {
								$tree[ $key ][ $item_key ] = self::apply_sanitizator( $item_value, $schema[ $key ][0] );
							}
						}
					}
				} elseif ( is_array( $schema[ $key ] ) && ! is_array( $tree[ $key ] ) ) {
					unset( $tree[ $key ] );
				} else {
					$tree[ $key ] = self::apply_sanitizator( $tree[ $key ], $schema[ $key ] );
				}
			}

			return $tree;
		}

		/**
		 * Checks if the given array is associative.
		 *
		 * @since 6.5.0
		 * @param array $data The array to check.
		 * @return bool True if the array is associative, false otherwise.
		 */
		private static function is_assoc( $data ) {
			if ( array() === $data ) {
				return false;
			}
			return array_keys( $data ) !== range( 0, count( $data ) - 1 );
		}

		/**
		 * Apply the sanitizator to the value.
		 *
		 * @since 6.5.0
		 * @param mixed $value The value to sanitize.
		 * @param mixed $sanitizator The sanitizator to apply.
		 * @return mixed The sanitized value.
		 */
		private static function apply_sanitizator( $value, $sanitizator ) {
			if ( $sanitizator === null ) {
				return $value;

			}
			return call_user_func( $sanitizator, $value );
		}
	}
}
