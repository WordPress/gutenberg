<?php
/**
 * Webfonts API class: backwards-compatibility (BC) layer for all
 * deprecated publicly exposed methods and functionality.
 *
 * This class/file will NOT be backported to Core. Rather for sites
 * using the previous API, it exists to prevent breakages, giving
 * developers time to upgrade their code.
 *
 * @package    Gutenberg
 * @subpackage Fonts API's BC Layer
 * @since      X.X.X
 */

if ( class_exists( 'WP_Webfonts' ) ) {
	return;
}

/**
 * Class WP_Webfonts
 *
 * @deprecated GB 15.1 Use WP_Fonts instead.
 */
class WP_Webfonts {
	/**
	 * Instance of WP_Fonts.
	 *
	 * @var WP_Fonts
	 */
	private $wp_fonts;

	/**
	 * Instantiate an instance of WP_Webfonts.
	 *
	 * @param null|WP_Fonts $wp_fonts Optional. Instance of WP_Fonts.
	 *                                Default uses wp_fonts().
	 */
	public function __construct( $wp_fonts = null ) {
		$this->wp_fonts = ! empty( $wp_fonts ) ? $wp_fonts : wp_fonts();
	}

	/**
	 * Gets the font slug.
	 *
	 * @since X.X.X
	 * @deprecated Use WP_Fonts_Utils::convert_font_family_into_handle() or WP_Fonts_Utils::get_font_family_from_variation().
	 *
	 * @param array|string $to_convert The value to convert into a slug. Expected as the web font's array
	 *                                 or a font-family as a string.
	 * @return string|false The font slug on success, or false if the font-family cannot be determined.
	 */
	public static function get_font_slug( $to_convert ) {
		$message = is_array( $to_convert )
			? 'Use WP_Fonts_Utils::get_font_family_from_variation() to get the font family from an array and then WP_Fonts_Utils::convert_font_family_into_handle() to convert the font-family name into a handle'
			: 'Use WP_Fonts_Utils::convert_font_family_into_handle() to convert the font-family name into a handle';
		_deprecated_function( __METHOD__, 'GB 14.9.1', $message );

		if ( empty( $to_convert ) ) {
			return false;
		}

		$font_family_name = is_array( $to_convert )
			? WP_Fonts_Utils::get_font_family_from_variation( $to_convert )
			: $to_convert;

		$slug = false;
		if ( ! empty( $font_family_name ) ) {
			$slug = WP_Fonts_Utils::convert_font_family_into_handle( $font_family_name );
		}

		return $slug;
	}

	/**
	 * Initializes the API.
	 *
	 * @since 6.0.0
	 * @deprecated GB 14.9.1 Use wp_fonts().
	 */
	public static function init() {
		_deprecated_function( __METHOD__, 'GB 14.9.1', 'wp_fonts()' );
	}

	/**
	 * Get the list of all registered font family handles.
	 *
	 * @since X.X.X
	 * @deprecated GB 15.8.0 Use wp_fonts()->get_registered_font_families().
	 *
	 * @return string[]
	 */
	public function get_registered_font_families() {
		_deprecated_function( __METHOD__, 'GB 15.8.0', 'wp_fonts()->get_registered_font_families()' );

		return $this->wp_fonts->get_registered_font_families();
	}

	/**
	 * Gets the list of registered fonts.
	 *
	 * @since 6.0.0
	 * @deprecated 14.9.1 Use wp_fonts()->get_registered().
	 *
	 * @return array[]
	 */
	public function get_registered_webfonts() {
		_deprecated_function( __METHOD__, '14.9.1', 'wp_fonts()->get_registered()' );

		return $this->_get_registered_webfonts();
	}

	/**
	 * Gets the list of enqueued fonts.
	 *
	 * @since 6.0.0
	 * @deprecated GB 14.9.1 Use wp_fonts()->get_enqueued().
	 *
	 * @return array[]
	 */
	public function get_enqueued_webfonts() {
		_deprecated_function( __METHOD__, 'GB 14.9.1', 'wp_fonts()->get_enqueued()' );

		return $this->wp_fonts->queue;
	}

	/**
	 * Gets the list of all fonts.
	 *
	 * @since 6.0.0
	 * @deprecated GB 14.9.1 Use wp_fonts()->get_registered().
	 *
	 * @return array[]
	 */
	public function get_all_webfonts() {
		_deprecated_function( __METHOD__, 'GB 14.9.1', 'wp_fonts()->get_registered()' );

		return $this->_get_registered_webfonts();
	}

	/**
	 * Registers a webfont.
	 *
	 * @since 6.0.0
	 * @deprecated GB 14.9.1 Use wp_register_fonts().
	 *
	 * @param array  $webfont             Web font to register.
	 * @param string $font_family_handle  Optional. Font family handle for the given variation.
	 *                                    Default empty string.
	 * @param string $variation_handle    Optional. Handle for the variation to register.
	 * @param bool   $silence_deprecation Optional. Silences the deprecation notice. For internal use.
	 * @return string|false The font family slug if successfully registered, else false.
	 */
	public function register_webfont( array $webfont, $font_family_handle = '', $variation_handle = '', $silence_deprecation = false ) {
		if ( ! $silence_deprecation ) {
			_deprecated_function( __METHOD__, 'GB 14.9.1', 'wp_register_fonts()' );
		}

		// Bail out if no variation passed as there's not to register.
		if ( empty( $webfont ) ) {
			return false;
		}

		// Restructure definition: keyed by font-family and array of variations.
		$font = array( $webfont );
		if ( WP_Fonts_Utils::is_defined( $font_family_handle ) ) {
			$font = array( $font_family_handle => $font );
		} else {
			$font               = Gutenberg_Fonts_API_BC_Layer::migrate_deprecated_structure( $font, true );
			$font_family_handle = array_key_first( $font );
		}

		if ( empty( $font ) || empty( $font_family_handle ) ) {
			return false;
		}

		// If the variation handle was passed, add it as variation key.
		if ( WP_Fonts_Utils::is_defined( $variation_handle ) ) {
			$font[ $font_family_handle ] = array( $variation_handle => $font[ $font_family_handle ][0] );
		}

		// Register with the Fonts API.
		$handle = wp_register_fonts( $font );
		if ( empty( $handle ) ) {
			return false;
		}
		return array_pop( $handle );
	}

	/**
	 * Enqueue a font-family that has been already registered.
	 *
	 * @since 6.0.0
	 * @deprecated GB 14.9.1 Use wp_enqueue_fonts().
	 *
	 * @param string $font_family_name The font family name to be enqueued.
	 * @return bool True if successfully enqueued, else false.
	 */
	public function enqueue_webfont( $font_family_name ) {
		_deprecated_function( __METHOD__, 'GB 14.9.1', 'wp_enqueue_fonts()' );

		wp_enqueue_fonts( array( $font_family_name ) );
		return true;
	}

	/**
	 * Gets the registered webfonts in the original web font property structure keyed by each handle.
	 *
	 * @return array[]
	 */
	private function _get_registered_webfonts() {
		$font_families = array();
		$registered    = array();

		// Find the registered font families.
		foreach ( $this->wp_fonts->registered as $handle => $obj ) {
			if ( ! $obj->extra['is_font_family'] ) {
				continue;
			}

			if ( ! isset( $registered[ $handle ] ) ) {
				$registered[ $handle ] = array();
			}

			$font_families[ $handle ] = $obj->deps;
		}

		// Build the return array structure.
		foreach ( $font_families as $font_family_handle => $variations ) {
			foreach ( $variations as $variation_handle ) {
				$variation_obj = $this->wp_fonts->registered[ $variation_handle ];

				$registered[ $font_family_handle ][ $variation_handle ] = $variation_obj->extra['font-properties'];
			}
		}

		return $registered;
	}
}
