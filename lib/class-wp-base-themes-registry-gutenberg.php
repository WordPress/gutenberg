<?php
/**
 * Base Themes Registry.
 *
 * Provides a registry for base themes that can be used with style variations.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Class for managing registered base themes.
 *
 * Base themes define a complete theme.json configuration that can replace
 * the current theme's theme.json when a style variation specifies one.
 * This allows style variations to completely override the theme foundation.
 *
 */
class WP_Base_Themes_Registry_Gutenberg {

	/**
	 * Singleton instance.
	 *
	 * @var WP_Base_Themes_Registry_Gutenberg|null
	 */
	private static $instance = null;

	/**
	 * Registered base themes.
	 *
	 * @var array
	 */
	private $registered_base_themes = array();

	/**
	 * Gets the singleton instance.
	 *
		 *
	 * @return WP_Base_Themes_Registry_Gutenberg
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
	 * Registers a base theme.
	 *
		 *
	 * @param string $id   Unique identifier for the base theme (e.g., 'plugin//base-name').
	 * @param array  $args {
	 *     Arguments for the base theme.
	 *
	 *     @type string $title Human-readable title for the base theme.
	 *     @type array  $data  The full theme.json-compatible data.
	 * }
	 * @return bool True on success, false on failure.
	 */
	public function register( $id, $args ) {
		if ( empty( $id ) || ! is_string( $id ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Base theme ID must be a non-empty string.', 'gutenberg' ),
				'Gutenberg'
			);
			return false;
		}

		if ( $this->is_registered( $id ) ) {
			_doing_it_wrong(
				__METHOD__,
				/* translators: %s: base theme ID */
				sprintf( __( 'Base theme "%s" is already registered.', 'gutenberg' ), $id ),
				'Gutenberg'
			);
			return false;
		}

		$defaults = array(
			'title' => '',
			'data'  => array(),
		);

		$base_theme = wp_parse_args( $args, $defaults );

		// Ensure data has a version.
		if ( ! isset( $base_theme['data']['version'] ) ) {
			$base_theme['data']['version'] = WP_Theme_JSON_Gutenberg::LATEST_SCHEMA;
		}

		$this->registered_base_themes[ $id ] = $base_theme;

		return true;
	}

	/**
	 * Unregisters a base theme.
	 *
		 *
	 * @param string $id The base theme ID to unregister.
	 * @return bool True on success, false if the base theme was not registered.
	 */
	public function unregister( $id ) {
		if ( ! $this->is_registered( $id ) ) {
			_doing_it_wrong(
				__METHOD__,
				/* translators: %s: base theme ID */
				sprintf( __( 'Base theme "%s" is not registered.', 'gutenberg' ), $id ),
				'Gutenberg'
			);
			return false;
		}

		unset( $this->registered_base_themes[ $id ] );
		return true;
	}

	/**
	 * Gets a registered base theme by ID.
	 *
		 *
	 * @param string $id The base theme ID.
	 * @return array|null The base theme data, or null if not registered.
	 */
	public function get_registered( $id ) {
		if ( ! $this->is_registered( $id ) ) {
			return null;
		}
		return $this->registered_base_themes[ $id ];
	}

	/**
	 * Gets all registered base themes.
	 *
		 *
	 * @return array All registered base themes.
	 */
	public function get_all_registered() {
		return $this->registered_base_themes;
	}

	/**
	 * Checks if a base theme is registered.
	 *
		 *
	 * @param string $id The base theme ID.
	 * @return bool True if registered, false otherwise.
	 */
	public function is_registered( $id ) {
		return isset( $this->registered_base_themes[ $id ] );
	}
}
