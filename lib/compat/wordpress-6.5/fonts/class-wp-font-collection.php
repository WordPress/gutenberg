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
	#[AllowDynamicProperties]
	final class WP_Font_Collection {
		/**
		 * The unique slug for the font collection.
		 *
		 * @since 6.5.0
		 *
		 * @var string
		 */
		public $slug;

		/**
		 * Font collection configuration.
		 *
		 * @since 6.5.0
		 *
		 * @var array
		 */
		private $data;

		/**
		 * Font collection JSON file path or url.
		 *
		 * @since 6.5.0
		 *
		 * @var string
		 */
		private $src;

		/**
		 * Default font collection configuration.
		 *
		 * @since 6.5.0
		 *
		 * @var array
		 */
		private $default_config;

		/**
		 * WP_Font_Collection constructor.
		 *
		 * @since 6.5.0
		 *
		 * @param string        $slug Font collection slug.
		 * @param array|string  $data_or_file {
		 *     Optional. Font collection associative array of configuration options, or a file path or url
		 *     to a JSON file containing the font collection configuration.
		 *
		 *     @type string $name           Name of the font collection.
		 *     @type string $description    Description of the font collection.
		 *     @type array  $font_families  Array of font family definitions that are in the collection.
		 *     @type array  $categories     Array of categories for the fonts that are in the collection.
		 * }
		 */
		public function __construct( $slug, $data_or_file ) {
			$this->slug           = sanitize_title( $slug );
			$this->default_config = array(
				'name'          => __( 'Unnamed Font Collection', 'gutenberg' ),
				'description'   => '',
				'font_families' => array(),
				'categories'    => array(),
			);

			if ( is_array( $data_or_file ) ) {
				// If the $data is an array, validate and set it now.
				$this->validate_config( $data_or_file );
				$this->data = wp_parse_args( $data_or_file, $this->default_config );
			} else {
				// If the $data is a file path or url, we'll lazy load the config when accessed.
				$this->src = $data_or_file;
			}

			if ( $this->slug !== $slug ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Font collection slug. */
					sprintf( __( 'Font collection slug "%s" is not valid. Slugs must use only alphanumeric characters, dashes, and underscores.', 'gutenberg' ), $slug ),
					'6.5.0'
				);
			}
		}

		/**
		 * Retrieves the font collection data.
		 *
		 * @since 6.5.0
		 *
		 * @return array|WP_Error An array containing the font collection data, or a WP_Error on failure.
		 */
		public function get_data() {
			// If we have a JSON config, load it if needed.
			if ( $this->src && empty( $this->data ) ) {
				$data = $this->load_from_json( $this->src );
				if ( is_wp_error( $data ) ) {
					return $data;
				}

				$this->data = wp_parse_args( $data, $this->default_config );
			}

			// Validate data from schema.

			// Sanitize from schema.

			return $this->data;
		}

		/**
		 * Loads the font collection data from a JSON file path or url.
		 *
		 * @since 6.5.0
		 *
		 * @param string $file_or_url File path or url to a JSON file containing the font collection data.
		 * @return array|WP_Error An array containing the font collection data on success,
		 *                        else an instance of WP_Error on failure.
		 */
		private function load_from_json( $file_or_url ) {
			$url  = wp_http_validate_url( $file_or_url );
			$file = file_exists( $file_or_url ) ? wp_normalize_path( realpath( $file_or_url ) ) : false;

			if ( ! $url && ! $file ) {
				// translators: %s: File path or url to font collection JSON file.
				$message = sprintf( __( 'Font collection JSON file "%s" is invalid or does not exist.', 'gutenberg' ), $file_or_url );
				_doing_it_wrong( __METHOD__, $message, '6.5.0' );
				return new WP_Error( 'font_collection_json_missing', $message );
			}

			return $url ? $this->load_from_url( $url ) : $this->load_from_file( $file );
		}

		/**
		 * Loads the font collection data from a JSON file path.
		 *
		 * @since 6.5.0
		 *
		 * @param string $file File path to a JSON file containing the font collection data.
		 * @return array|WP_Error An array containing the font collection data on success,
		 *                        else an instance of WP_Error on failure.
		 */
		private function load_from_file( $file ) {
			$data = wp_json_file_decode( $file, array( 'associative' => true ) );
			if ( empty( $data ) ) {
				return new WP_Error( 'font_collection_decode_error', __( 'Error decoding the font collection JSON file contents.', 'gutenberg' ) );
			}

			$this->validate_config( $data );

			return $data;
		}

		/**
		 * Loads the font collection data from a JSON file url.
		 *
		 * @since 6.5.0
		 *
		 * @param string $url Url to a JSON file containing the font collection data.
		 * @return array|WP_Error An array containing the font collection data on success,
		 *                        else an instance of WP_Error on failure.
		 */
		private function load_from_url( $url ) {
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

				if ( ! $this->validate_config( $data ) ) {
					set_site_transient( $transient_key, $data, DAY_IN_SECONDS );
				}
			}

			return $data;
		}

		private function validate_config( $data ) {
			if ( empty( $data['font_families'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Font collection slug. */
					sprintf( __( 'Font collection "%s" does not contain any font families.', 'gutenberg' ), $this->slug ),
					'6.5.0'
				);
				return false;
			}

			return true;
		}
	}
}
