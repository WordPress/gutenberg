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
	 * The unique slug for the font collection.
	 *
	 * @since 6.5.0
	 *
	 * @var string
	 */
	private $slug;

	/**
	 * The name of the font collection.
	 *
	 * @since 6.5.0
	 *
	 * @var string
	 */
	private $name;

	/**
	 * Description of the font collection.
	 *
	 * @since 6.5.0
	 *
	 * @var string
	 */
	private $description;

	/**
	 * Source of the font collection.
	 *
	 * @since 6.5.0
	 *
	 * @var string
	 */
	private $src;

	/**
	 * Array of font families in the collection.
	 *
	 * @since 6.5.0
	 *
	 * @var array
	 */
	private $font_families;

	/**
	 * Categories associated with the font collection.
	 *
	 * @since 6.5.0
	 *
	 * @var array
	 */
	private $categories;


	/**
	 * WP_Font_Collection constructor.
	 *
	 * @since 6.5.0
	 *
	 * @param array $config Font collection config options.
	 *  See {@see wp_register_font_collection()} for the supported fields.
	 * @throws Exception If the required parameters are missing.
	 */
	public function __construct( $config ) {
		if ( empty( $config ) || ! is_array( $config ) ) {
			throw new Exception( 'Font Collection config options are required as a non-empty array.' );
		}

		$this->validate_config( $config );

		$this->slug          = $config['slug'];
		$this->name          = $config['name'];
		$this->description   = $config['description'] ?? '';
		$this->src           = $config['src'] ?? '';
		$this->font_families = $config['font_families'] ?? array();
		$this->categories    = $config['categories'] ?? array();
	}

	/**
	 * Validates the config array.
	 *
	 * Ensures that required keys are present and valid.
	 *
	 * @param array $config Configuration array.
	 * @throws Exception If required keys are missing.
	 */
	private function validate_config( $config ) {
		$required_keys = array( 'slug', 'name' );
		foreach ( $required_keys as $key ) {
			if ( empty( $config[ $key ] ) ) {
				throw new Exception( "Font Collection config {$key} is required as a non-empty string." );
			}
		}

		if ( empty( $config['src'] ) && empty( $config['font_families'] ) ) {
			throw new Exception( 'Font Collection config "src" option OR "font_families" option are required.' );
		}
	}

	/**
	 * Gets the font collection config.
	 *
	 * @since 6.5.0
	 *
	 * @return array {
	 *     An array of font collection config.
	 *
	 *     @type string $slug        The font collection's unique slug.
	 *     @type string $name        The font collection's name.
	 *     @type string $description The font collection's description.
	 * }
	 */
	public function get_config() {
		return array(
			'slug'        => $this->slug,
			'name'        => $this->name,
			'description' => $this->description,
		);
	}

	/**
	 * Gets the font collection content.
	 *
	 * Load the font collection data from the src if it is not already loaded.
	 *
	 * @since 6.5.0
	 *
	 * @return array|WP_Error {
	 *     An array of font collection contents.
	 *
	 *     @type array $font_families      The font collection's font families.
	 *     @type string $categories        The font collection's categories.
	 * }
	 *
	 * A WP_Error object if there was an error loading the font collection data.
	 */
	public function get_content() {
		// If the font families are not loaded, and the src is not empty, load the data from the src.
		if ( empty( $this->font_families ) && ! empty( $this->src ) ) {
			$data = $this->load_contents_from_src();
			if ( is_wp_error( $data ) ) {
				return $data;
			}
		}

		return array(
			'font_families' => $this->font_families,
			'categories'    => $this->categories,
		);
	}

	/**
	 * Loads the font collection data from the src.
	 *
	 * @since 6.5.0
	 *
	 * @return array|WP_Error An array containing the list of font families in font-collection.json format on success,
	 *                        else an instance of WP_Error on failure.
	 */
	private function load_contents_from_src() {
		// If the src is a URL, fetch the data from the URL.
		if ( str_contains( $this->src, 'http' ) && str_contains( $this->src, '://' ) ) {
			if ( ! wp_http_validate_url( $this->src ) ) {
				return new WP_Error( 'font_collection_read_error', __( 'Invalid URL for Font Collection data.', 'gutenberg' ) );
			}

			$response = wp_remote_get( $this->src );
			if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
				return new WP_Error( 'font_collection_read_error', __( 'Error fetching the Font Collection data from a URL.', 'gutenberg' ) );
			}

			$data = json_decode( wp_remote_retrieve_body( $response ), true );
			if ( empty( $data ) ) {
				return new WP_Error( 'font_collection_read_error', __( 'Error decoding the Font Collection data from the REST response JSON.', 'gutenberg' ) );
			}
			// If the src is a file path, read the data from the file.
		} else {
			if ( ! file_exists( $this->src ) ) {
				return new WP_Error( 'font_collection_read_error', __( 'Font Collection data JSON file does not exist.', 'gutenberg' ) );
			}
			$data = wp_json_file_decode( $this->src, array( 'associative' => true ) );
			if ( empty( $data ) ) {
				return new WP_Error( 'font_collection_read_error', __( 'Error reading the Font Collection data JSON file contents.', 'gutenberg' ) );
			}
		}

		if ( empty( $data['font_families'] ) ) {
			return new WP_Error( 'font_collection_contents_error', __( 'Font Collection data JSON file does not contain font families.', 'gutenberg' ) );
		}

		$this->font_families = $data['font_families'];
		$this->categories    = $data['categories'] ?? array();

		return $data;
	}
}
