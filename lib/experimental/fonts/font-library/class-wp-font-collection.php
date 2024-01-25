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
	 * @param string $slug  The font collection's unique slug.
	 * @param array $config Font collection config options. {
	 *      @type string $name        The font collection's name.
	 *      @type string $description The font collection's description.
	 *      @type string $src         The font collection's source.
	 *      @type array  $font_families An array of font families in the font collection.
	 *      @type array  $categories The font collection's categories.
	 *  }
	 */
	public function __construct( $slug, $config ) {
		$this->is_config_valid( $slug, $config );

		$this->slug          = isset( $slug ) ? $slug : '';
		$this->name          = isset( $config['name'] ) ? $config['name'] : '';
		$this->description   = isset( $config['description'] ) ? $config['description'] : '';
		$this->src           = isset( $config['src'] ) ? $config['src'] : '';
		$this->font_families = isset( $config['font_families'] ) ? $config['font_families'] : array();
		$this->categories    = isset( $config['categories'] ) ? $config['categories'] : array();
	}

	/**
	 * Checks if the font collection config is valid.
	 *
	 * @since 6.5.0
	 *
	 * @param string $slug Font collection slug.
	 * @param array $config Font collection config options. {
	 *      @type string $name        The font collection's name.
	 *      @type string $description The font collection's description.
	 *      @type string $src         The font collection's source.
	 *      @type array  $font_families An array of font families in the font collection.
	 *      @type array  $categories The font collection's categories.
	 *  }
	 * @return bool True if the font collection config is valid and false otherwise.
	 */
	public static function is_config_valid( $slug, $config ) {
		if ( empty( $slug ) || ! is_string( $slug ) ) {
			/* translators: %s: Font collection slug */
			_doing_it_wrong( __METHOD__, sprintf( __( 'Font Collection "%s" is required as a non-empty string.', 'gutenberg' ), 'slug' ), '6.5.0' );
			return false;
		}

		if ( empty( $config ) || ! is_array( $config ) ) {
			_doing_it_wrong( __METHOD__, __( 'Font Collection config options are required as a non-empty array.', 'gutenberg' ), '6.5.0' );
			return false;
		}

		if ( empty( $config['name'] ) || ! is_string( $config['name'] ) ) {
			/* translators: %s: Font collection name config property */
			_doing_it_wrong( __METHOD__, sprintf( __( 'Font Collection "%s" is required as a non-empty string.', 'gutenberg' ), 'name' ), '6.5.0' );
			return false;
		}

		if (
			( isset( $config['src'] ) && isset( $config['font_families'] ) ) ||
			( ! isset( $config['src'] ) && ! isset( $config['font_families'] ) )
		) {
			/* translators: %1$s: Font collection src config property, %2$s: Font collection font_families config property */
			_doing_it_wrong( __METHOD__, sprintf( __( 'Font Collection config "%1$s" option OR "%2$s" option are required.', 'gutenberg' ), 'src', 'font_families' ), '6.5.0' );
			return false;
		}

		if ( isset( $config['src'] ) && ! is_string( $config['src'] ) ) {
			/* translators: %s: Font collection src config property */
			_doing_it_wrong( __METHOD__, sprintf( __( 'Font Collection config "%s" option is required as a non-empty string.', 'gutenberg' ), 'src' ), '6.5.0' );
			return false;
		}

		if ( isset( $config['font_families'] ) && ( empty( $config['font_families'] ) || ! is_array( $config['font_families'] ) ) ) {
			/* translators: %s: Font collection font_families config property */
			_doing_it_wrong( __METHOD__, sprintf( __( 'Font Collection config "%s" option is required as a non-empty array.', 'gutenberg' ), 'font_families' ), '6.5.0' );
			return false;
		}

		if ( isset( $config['categories'] ) && ( empty( $config['categories'] ) || ! is_array( $config['categories'] ) ) ) {
			/* translators: %s: Font collection categories config property */
			_doing_it_wrong( __METHOD__, sprintf( __( 'Font Collection config "%s" option is required as a non-empty array.', 'gutenberg' ), 'categories' ), '6.5.0' );
			return false;
		}

		return true;
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
		if ( preg_match( '#^https?://#', $this->src ) ) {
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
