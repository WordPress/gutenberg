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
	 * @param string $id Font collection id.
	 * @param array  $config Font collection config options.
	 * @throws Exception If the required parameters are missing.
	 */
	public function __construct( $id, $config ) {

		if ( empty( $id ) ) {
			throw new Exception( 'Font Collection is missing the id.' );
		}

		if ( empty( $config ) ) {
			throw new Exception( 'Font Collection is missing the config.' );
		}

		if ( empty( $config['data_json_file'] ) ) {
			throw new Exception( 'Font Collection is missing the data_json_file.' );
		}

		$config['id'] = $id;
		$this->config = $config;
	}

	/**
	 * Gets the font collection config.
	 *
	 * @since 6.4.0
	 *
	 * @return array An array contaning the font collection config.
	 */
	public function get_config() {
		return $this->config;
	}

	/**
	 * Gets the font collection data.
	 *
	 * @since 6.4.0
	 *
	 * @return array An array contaning the list of font families in theme.json format
	 */
	public function get_data() {
		if ( ! empty( $this->config['data_json_file'] ) ) {
			if ( file_exists( $this->config['data_json_file'] ) ) {
				$data                    = file_get_contents( $this->config['data_json_file'] );
				$collection_data         = $this->get_config();
				$collection_data['data'] = $data;
				unset( $collection_data['data_json_file'] );
				return $collection_data;
			}
		}
		return new WP_Error( 'font_collection_error', 'Font Collection data is missing the data_json_file.' );
	}

}
