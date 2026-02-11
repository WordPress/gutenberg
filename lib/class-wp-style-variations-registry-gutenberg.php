<?php
/**
 * Style Variations Registry.
 *
 * Provides a registry for style variations that can be associated with templates.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Class for managing registered style variations.
 *
 * Style variations define a set of global styles (settings and/or styles)
 * that can be associated with specific templates. When a template has an
 * associated style variation, that variation's styles are used instead of
 * the global user styles.
 *
 */
class WP_Style_Variations_Registry_Gutenberg {

	/**
	 * Singleton instance.
	 *
	 * @var WP_Style_Variations_Registry_Gutenberg|null
	 */
	private static $instance = null;

	/**
	 * Registered style variations.
	 *
	 * @var array
	 */
	private $registered_variations = array();

	/**
	 * Gets the singleton instance.
	 *
		 *
	 * @return WP_Style_Variations_Registry_Gutenberg
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Private constructor to prevent direct instantiation.
	 */
	private function __construct() {}

	/**
	 * Registers a style variation.
	 *
		 *
	 * @param string $id   Unique identifier for the variation (e.g., 'theme//variation-name').
	 * @param array  $args {
	 *     Arguments for the style variation.
	 *
	 *     @type string $title      Human-readable title for the variation.
	 *     @type array  $data       The theme.json-compatible data (settings, styles).
	 *     @type string $base_theme Optional. ID of a registered base theme to use instead of current theme's theme.json.
	 *     @type string $source     Optional. Source of the variation ('theme', 'plugin', 'custom'). Default 'custom'.
	 * }
	 * @return bool True on success, false on failure.
	 */
	public function register( $id, $args ) {
		if ( empty( $id ) || ! is_string( $id ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Style variation ID must be a non-empty string.', 'gutenberg' ),
				'Gutenberg'
			);
			return false;
		}

		if ( $this->is_registered( $id ) ) {
			_doing_it_wrong(
				__METHOD__,
				/* translators: %s: style variation ID */
				sprintf( __( 'Style variation "%s" is already registered.', 'gutenberg' ), $id ),
				'Gutenberg'
			);
			return false;
		}

		$defaults = array(
			'title'      => '',
			'data'       => array(),
			'base_theme' => null,
			'source'     => 'custom',
		);

		$variation = wp_parse_args( $args, $defaults );

		// Ensure data has a version.
		if ( ! isset( $variation['data']['version'] ) ) {
			$variation['data']['version'] = WP_Theme_JSON_Gutenberg::LATEST_SCHEMA;
		}

		$this->registered_variations[ $id ] = $variation;

		return true;
	}

	/**
	 * Unregisters a style variation.
	 *
		 *
	 * @param string $id The variation ID to unregister.
	 * @return bool True on success, false if the variation was not registered.
	 */
	public function unregister( $id ) {
		if ( ! $this->is_registered( $id ) ) {
			_doing_it_wrong(
				__METHOD__,
				/* translators: %s: style variation ID */
				sprintf( __( 'Style variation "%s" is not registered.', 'gutenberg' ), $id ),
				'Gutenberg'
			);
			return false;
		}

		unset( $this->registered_variations[ $id ] );
		return true;
	}

	/**
	 * Gets a registered style variation by ID.
	 *
		 *
	 * @param string $id The variation ID.
	 * @return array|null The variation data, or null if not registered.
	 */
	public function get_registered( $id ) {
		if ( ! $this->is_registered( $id ) ) {
			return null;
		}
		return $this->registered_variations[ $id ];
	}

	/**
	 * Gets all registered style variations.
	 *
		 *
	 * @return array All registered variations.
	 */
	public function get_all_registered() {
		return $this->registered_variations;
	}

	/**
	 * Checks if a style variation is registered.
	 *
		 *
	 * @param string $id The variation ID.
	 * @return bool True if registered, false otherwise.
	 */
	public function is_registered( $id ) {
		return isset( $this->registered_variations[ $id ] );
	}
}
