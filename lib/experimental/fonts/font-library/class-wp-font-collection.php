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

if ( class_exists( 'WP_Font_Collection' ) ) {
	return;
}

/**
 * Font Collection class.
 *
 * @since 6.5.0
 */
class WP_Font_Collection {

	/**
	 * Font collection configuration.
	 *
	 * @since 6.5.0
	 *
	 * @var array
	 */
	private $config;

	/**
	 * WP_Font_Collection constructor.
	 *
	 * @since 6.5.0
	 *
	 * @param array $config Font collection config options.
	 *                      See {@see wp_register_font_collection()} for the supported fields.
	 * @throws Exception If the required parameters are missing.
	 */
	public function __construct( $config ) {
		if ( empty( $config ) || ! is_array( $config ) ) {
			throw new Exception( 'Font Collection config options is required as a non-empty array.' );
		}

		if ( empty( $config['id'] ) || ! is_string( $config['id'] ) ) {
			throw new Exception( 'Font Collection config ID is required as a non-empty string.' );
		}

		if ( empty( $config['name'] ) || ! is_string( $config['name'] ) ) {
			throw new Exception( 'Font Collection config name is required as a non-empty string.' );
		}

		if ( empty( $config['src'] ) || ! is_string( $config['src'] ) ) {
			throw new Exception( 'Font Collection config "src" option is required as a non-empty string.' );
		}

		$this->config = $config;
	}

	/**
	 * Gets the font collection config.
	 *
	 * @since 6.5.0
	 *
	 * @return array An array containing the font collection config.
	 */
	public function get_config() {
		return $this->config;
	}

	/**
	 * Gets the font collection data.
	 *
	 * @since 6.5.0
	 *
	 * @return array|WP_Error An array containing the list of font families in theme.json format on success,
	 *                        else an instance of WP_Error on failure.
	 */
	public function get_data() {
		// If the src is a URL, fetch the data from the URL.
		if ( str_contains( $this->config['src'], 'http' ) && str_contains( $this->config['src'], '://' ) ) {
			if ( ! wp_http_validate_url( $this->config['src'] ) ) {
				return new WP_Error( 'font_collection_read_error', __( 'Invalid URL for Font Collection data.', 'gutenberg' ) );
			}

			$response = wp_remote_get( $this->config['src'] );
			if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
				return new WP_Error( 'font_collection_read_error', __( 'Error fetching the Font Collection data from a URL.', 'gutenberg' ) );
			}

			$data = json_decode( wp_remote_retrieve_body( $response ), true );
			if ( empty( $data ) ) {
				return new WP_Error( 'font_collection_read_error', __( 'Error decoding the Font Collection data from the REST response JSON.', 'gutenberg' ) );
			}
			// If the src is a file path, read the data from the file.
		} else {
			if ( ! file_exists( $this->config['src'] ) ) {
				return new WP_Error( 'font_collection_read_error', __( 'Font Collection data JSON file does not exist.', 'gutenberg' ) );
			}
			$data = wp_json_file_decode( $this->config['src'], array( 'associative' => true ) );
			if ( empty( $data ) ) {
				return new WP_Error( 'font_collection_read_error', __( 'Error reading the Font Collection data JSON file contents.', 'gutenberg' ) );
			}
		}

		$collection_data         = $this->get_config();
		$collection_data['data'] = $data;
		unset( $collection_data['src'] );
		return $collection_data;
	}
}
