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
		 * Font collection data.
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
		 * WP_Font_Collection constructor.
		 *
		 * @since 6.5.0
		 *
		 * @param string        $slug Font collection slug.
		 * @param array|string  $data_or_file {
		 *     Font collection data array or a file path or url to a JSON file containing the font collection.
		 *
		 *     @type string $name           Name of the font collection.
		 *     @type string $description    Description of the font collection.
		 *     @type array  $font_families  Array of font family definitions that are in the collection.
		 *     @type array  $categories     Array of categories for the fonts that are in the collection.
		 * }
		 */
		public function __construct( $slug, $data_or_file ) {
			$this->slug = sanitize_title( $slug );

			// Data or json are lazy loaded and validated in get_data().
			if ( is_array( $data_or_file ) ) {
				$this->data = $data_or_file;
			} else {
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
			// If we have a JSON config, load it and cache the data if it's valid.
			if ( $this->src && empty( $this->data ) ) {
				$data = $this->load_from_json( $this->src );
				if ( is_wp_error( $data ) ) {
					return $data;
				}

				$this->data = $data;
			}

			// Validate required properties are not empty.
			$data = $this->validate_data( $this->data );
			if ( is_wp_error( $data ) ) {
				return $data;
			}

			// Set defaults for optional properties.
			return wp_parse_args(
				$data,
				array(
					'description' => '',
					'categories'  => array(),
				)
			);
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
				$message = __( 'Font collection JSON file is invalid or does not exist.', 'gutenberg' );
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

				// Make sure the data is valid before caching it.
				$data = $this->validate_data( $data );
				if ( is_wp_error( $data ) ) {
					return $data;
				}

				set_site_transient( $transient_key, $data, DAY_IN_SECONDS );
			}

			return $data;
		}

		/**
		 * Validates the font collection configuration.
		 *
		 * @since 6.5.0
		 *
		 * @param array $data Font collection configuration.
		 * @return array|WP_Error Array of data if valid, otherwise a WP_Error instance.
		 */
		private function validate_data( $data ) {
			$required_properties = array( 'name', 'font_families' );
			foreach ( $required_properties as $property ) {
				if ( empty( $data[ $property ] ) ) {
					$message = sprintf(
					// translators: 1: Font collection slug, 2: Missing property name.
						__( 'Font collection "%1$s" has missing or empty property: "%2$s."', 'gutenberg' ),
						$this->slug,
						$property
					);
					_doing_it_wrong( __METHOD__, $message, '6.5.0' );
					return new WP_Error( 'font_collection_missing_property', $message );
				}
			}
			return $data;
		}
	}
}
