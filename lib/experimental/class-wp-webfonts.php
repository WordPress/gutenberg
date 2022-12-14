<?php
/**
 * Webfonts API class: backwards-compatibility (BC) layer for all
 * deprecated publicly exposed methods and functionality.
 *
 * This class/file will NOT be backported to Core. Rather for sites
 * using the previous API, it exists to prevent breakages, giving
 * developers time to upgrade their code.
 *
 * @since      X.X.X
 * @subpackage WebFonts
 * @package    WordPress
 */

if ( class_exists( 'WP_Webfonts' ) ) {
	return;
}

/**
 * Class WP_Webfonts
 *
 * BACKPORT NOTE: Do not backport this file to Core.
 * This class exists to give extenders guidance and time to upgrade their code
 * to use the new Web Fonts API.
 */
class WP_Webfonts extends WP_Dependencies {

	/**
	 * Gets the font slug.
	 *
	 * @since X.X.X
	 * @deprecated Use WP_Webfonts_Utils::convert_font_family_into_handle() or WP_Webfonts_Utils::get_font_family_from_variation().
	 *
	 * @param array|string $to_convert The value to convert into a slug. Expected as the web font's array
	 *                                 or a font-family as a string.
	 * @return string|false The font slug on success, or false if the font-family cannot be determined.
	 */
	public static function get_font_slug( $to_convert ) {
		$message = is_array( $to_convert )
			? 'Use WP_Webfonts_Utils::get_font_family_from_variation() to get the font family from an array and then WP_Webfonts_Utils::convert_font_family_into_handle() to convert the font-family name into a handle'
			: 'Use WP_Webfonts_Utils::convert_font_family_into_handle() to convert the font-family name into a handle';
		_deprecated_function( __METHOD__, 'X.X.X', $message );

		return static::_get_font_slug( $to_convert );
	}

	/**
	 * Initializes the API.
	 *
	 * @since 6.0.0
	 * @deprecated X.X.X Use wp_webfonts().
	 */
	public static function init() {
		_deprecated_function( __METHOD__, 'X.X.X', 'wp_webfonts()' );
	}

	/**
	 * Gets the list of registered fonts.
	 *
	 * @since 6.0.0
	 * @deprecated X.X.X Use wp_webfonts()->get_registered().
	 *
	 * @return array[]
	 */
	public function get_registered_webfonts() {
		_deprecated_function( __METHOD__, 'X.X.X', 'wp_webfonts()->get_registered()' );

		return $this->_get_registered_webfonts();
	}

	/**
	 * Gets the list of enqueued fonts.
	 *
	 * @since 6.0.0
	 * @deprecated X.X.X Use wp_webfonts()->get_enqueued().
	 *
	 * @return array[]
	 */
	public function get_enqueued_webfonts() {
		_deprecated_function( __METHOD__, 'X.X.X', 'wp_webfonts()->get_enqueued()' );

		return $this->queue;
	}

	/**
	 * Gets the list of all fonts.
	 *
	 * @since 6.0.0
	 * @deprecated X.X.X Use wp_webfonts()->get_registered().
	 *
	 * @return array[]
	 */
	public function get_all_webfonts() {
		_deprecated_function( __METHOD__, 'X.X.X', 'wp_webfonts()->get_registered()' );

		return $this->_get_registered_webfonts();
	}

	/**
	 * Registers a webfont.
	 *
	 * @since 6.0.0
	 * @deprecated X.X.X Use wp_register_webfont_variation().
	 *
	 * @param array  $webfont            Web font to register.
	 * @param string $font_family_handle Optional. Font family handle for the given variation.
	 *                                   Default empty string.
	 * @param string $variation_handle   Optional. Handle for the variation to register.
	 * @return string|false The font family slug if successfully registered, else false.
	 */
	public function register_webfont( array $webfont, $font_family_handle = '', $variation_handle = '' ) {
		_deprecated_function( __METHOD__, 'X.X.X', 'wp_register_webfont_variation()' );

		// When font family's handle is not passed, attempt to get it from the variation.
		if ( ! WP_Webfonts_Utils::is_defined( $font_family_handle ) ) {
			$font_family = WP_Webfonts_Utils::get_font_family_from_variation( $webfont );
			if ( $font_family ) {
				$font_family_handle = WP_Webfonts_Utils::convert_font_family_into_handle( $font_family );
			}
		}

		if ( empty( $font_family_handle ) ) {
			return false;
		}

		return $this->add_variation( $font_family_handle, $webfont, $variation_handle )
			? $font_family_handle
			: false;
	}

	/**
	 * Enqueue a font-family that has been already registered.
	 *
	 * @since 6.0.0
	 * @deprecated X.X.X Use wp_webfonts()->enqueue() or wp_enqueue_webfont().
	 *
	 * @param string $font_family_name The font family name to be enqueued.
	 * @return bool True if successfully enqueued, else false.
	 */
	public function enqueue_webfont( $font_family_name ) {
		_deprecated_function( __METHOD__, 'X.X.X', 'wp_webfonts()->enqueue() or wp_enqueue_webfont()' );

		$slug = static::_get_font_slug( $font_family_name );

		if ( isset( $this->enqueued[ $slug ] ) ) {
			return true;
		}

		if ( ! isset( $this->registered[ $slug ] ) ) {
			/* translators: %s unique slug to identify the font family of the webfont */
			_doing_it_wrong( __METHOD__, sprintf( __( 'The "%s" font family is not registered.', 'gutenberg' ), $slug ), '6.0.0' );

			return false;
		}

		$this->enqueue( $slug );
		return true;
	}

	/**
	 * Migrates deprecated webfonts structure into new API data structure,
	 * i.e. variations grouped by their font-family.
	 *
	 * @param array $webfonts Array of webfonts to migrate.
	 * @return array
	 */
	public function migrate_deprecated_structure( array $webfonts ) {
		$message = 'A deprecated web fonts array structure passed to wp_register_webfonts(). ' .
			'Variations must be grouped and keyed by their font family.';
		trigger_error( $message, E_USER_DEPRECATED );

		$new_webfonts = array();
		foreach ( $webfonts as $webfont ) {
			$font_family = WP_Webfonts_Utils::get_font_family_from_variation( $webfont );
			if ( ! $font_family ) {
				continue;
			}

			if ( ! isset( $new_webfonts[ $font_family ] ) ) {
				$new_webfonts[ $font_family ] = array();
			}

			$new_webfonts[ $font_family ][] = $webfont;
		}

		return $new_webfonts;
	}

	/**
	 * Determines if the given webfonts array is the deprecated array structure.
	 *
	 * @param array $webfonts Array of webfonts to check.
	 * @return bool True when deprecated structure, else false.
	 */
	public function is_deprecated_structure( array $webfonts ) {
		// Checks the first key to determine if it's empty or non-string.
		foreach ( $webfonts as $font_family => $variations ) {
			return ! WP_Webfonts_Utils::is_defined( $font_family );
		}
	}

	/**
	 * Handle the deprecated web fonts structure.
	 *
	 * @param array  $webfont Web font for extracting font family.
	 * @param string $message Deprecation message to throw.
	 * @return string|null The font family slug if successfully registered. Else null.
	 */
	protected function extract_font_family_from_deprecated_webfonts_structure( array $webfont, $message ) {
		trigger_error( $message, E_USER_DEPRECATED );

		$font_family = WP_Webfonts_Utils::get_font_family_from_variation( $webfont );
		if ( ! $font_family ) {
			return null;
		}

		return WP_Webfonts_Utils::convert_font_family_into_handle( $font_family );
	}

	/**
	 * Gets the font slug.
	 *
	 * Helper function for reuse without the deprecation.
	 *
	 * @param array|string $to_convert The value to convert into a slug. Expected as the web font's array
	 *                                 or a font-family as a string.
	 * @return string|false The font slug on success, or false if the font-family cannot be determined.
	 */
	private static function _get_font_slug( $to_convert ) {
		$font_family_name = is_array( $to_convert ) ? WP_Webfonts_Utils::get_font_family_from_variation( $to_convert ) : $to_convert;
		return ! empty( $font_family_name )
			? WP_Webfonts_Utils::convert_font_family_into_handle( $font_family_name )
			: false;
	}

	/**
	 * Gets the registered webfonts in the original web font property structure keyed by each handle.
	 *
	 * @return array[]
	 */
	private function _get_registered_webfonts() {
		$registered = array();
		foreach ( $this->registered as $handle => $obj ) {
			// Skip the font-family.
			if ( $obj->extra['is_font_family'] ) {
				continue;
			}

			$registered[ $handle ] = $obj->extra['font-properties'];
		}

		return $registered;
	}

	/**
	 * Gets the enqueued webfonts in the original web font property structure keyed by each handle.
	 *
	 * @return array[]
	 */
	private function _get_enqueued_webfonts() {
		$enqueued = array();
		foreach ( $this->queue as $handle ) {
			// Skip if not registered.
			if ( ! isset( $this->registered[ $handle ] ) ) {
				continue;
			}

			// Skip if already found.
			if ( isset( $enqueued[ $handle ] ) ) {
				continue;
			}

			$obj = $this->registered[ $handle ];

			// If a variation, add it.
			if ( ! $obj->extra['is_font_family'] ) {
				$enqueued[ $handle ] = $obj->extra['font-properties'];
				continue;
			}

			// If font-family, add all of its variations.
			foreach ( $obj->deps as $variation_handle ) {
				$obj                           = $this->registered[ $variation_handle ];
				$enqueued[ $variation_handle ] = $obj->extra['font-properties'];
			}
		}

		return $enqueued;
	}
}
