<?php
/**
 * Font Collection class.
 *
 * This file contains the Font Collection class definition.
 *
 * @package    WordPress
 * @subpackage Font Library
 * @since      6.4.0
 */

if ( class_exists( 'WP_Font_Collection' ) ) {
	return;
}

/**
 * Font Collection class.
 *
 * @since 6.4.0
 */
class WP_Font_Collection {

	/**
	 * Font collection configuration.
	 *
	 * @since 6.4.0
	 *
	 * @var array
	 */
	private $config;

	/**
	 * WP_Font_Collection constructor.
	 *
	 * @since 6.4.0
	 *
	 * @param string $id     Font collection id.
	 * @param array  $config Font collection config options.
	 * @throws WP_Error When passed an invalid argument.
	 */
	public function __construct( $id, $config ) {

		if ( empty( $id ) && is_string( $id ) ) {
			return new WP_Error(
				'font_collection_id_required',
				__( 'Font Collection ID is required as a non-empty string.', 'gutenberg' )
			);
		}

		if ( empty( $config ) ) {
			return new WP_Error(
				'font_collection_config_required',
				__( 'Font Collection config options is required as a non-empty array.', 'gutenberg' )
			);
		}

		if ( empty( $config['data_json_file'] ) && is_string( $config['data_json_file'] ) ) {
			return new WP_Error(
				'font_collection_data_json_file_required',
				__( 'Font Collection config "data_json_file" option is required as a non-empty string.', 'gutenberg' )
			);
		}

		$config['id'] = $id;
		$this->config = $config;
	}

	/**
	 * Gets the font collection config.
	 *
	 * @since 6.4.0
	 *
	 * @return array An array containing the font collection config.
	 */
	public function get_config() {
		return $this->config;
	}

	/**
	 * Gets the font collection data.
	 *
	 * @since 6.4.0
	 *
	 * @return array|WP_Error An array containing the list of font families in theme.json format on success,
	 *                        else an instance of WP_Error on failure.
	 */
	public function get_data() {
		if ( ! file_exists( $this->config['data_json_file'] ) ) {
			return new WP_Error( 'font_collection_file_error', __( 'Font Collection data JSON file does not exist.', 'gutenberg' ) );
		}

		$data = file_get_contents( $this->config['data_json_file'] );
		if ( empty( $data ) ) {
			return new WP_Error( 'font_collection_read_error', __( 'Error reading the Font Collection data JSON file contents.', 'gutenberg' ) );
		}

		$collection_data         = $this->get_config();
		$collection_data['data'] = $data;
		unset( $collection_data['data_json_file'] );
		return $collection_data;
	}
}
