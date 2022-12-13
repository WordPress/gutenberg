<?php
/**
 * Webfonts API class: deprecated publicly exposed methods and functionality.
 *
 * @package    WordPress
 * @subpackage WebFonts
 * @since      X.X.X
 */

if ( class_exists( 'WP_Webfonts' ) ) {
	return;
}

/**
 * Class WP_Webfonts
 *
 * DO NOT BACKPORT THIS TO WORDPRESS CORE!
 * This class exists to give extenders guidance and time to upgrade their code
 * to use the new Web Fonts API.
 */
class WP_Webfonts extends WP_Dependencies {

	/**
	 * Gets the font slug.
	 *
	 * BACKPORT NOTE: Do not backport this method.
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
			? 'Use WP_Webfonts_Utils::convert_font_family_into_handle() to get the font family from an array and then WP_Webfonts_Utils::convert_font_family_into_handle() to convert the font-family name into a handle'
			: 'Use WP_Webfonts_Utils::convert_font_family_into_handle() to convert the font-family name into a handle';
		_deprecated_function( __METHOD__, 'X.X.X', $message );

		$font_family_name = $to_convert;
		if ( is_array( $to_convert ) ) {
			if ( isset( $to_convert['font-family'] ) ) {
				$font_family_name = $to_convert['font-family'];
			} elseif ( isset( $to_convert['fontFamily'] ) ) {
				$font_family_name = $to_convert['fontFamily'];
			} else {
				_doing_it_wrong( __METHOD__, __( 'Could not find the font family name within the variation.', 'gutenberg' ), 'X.X.X' );
				return false;
			}
		}

		return WP_Webfonts_Utils::convert_font_family_into_handle( $font_family_name );
	}

	/**
	 * Initializes the API.
	 *
	 * BACKPORT NOTE: Do not backport this method.
	 *
	 * @since 6.0.0
	 * @deprecated 6.1.0 Use wp_webfonts().
	 */
	public static function init() {
		_deprecated_function( __METHOD__, '6.1.0', 'wp_webfonts()' );
	}

	/**
	 * Gets the list of registered fonts.
	 *
	 * BACKPORT NOTE: Do not backport this method.
	 *
	 * @since 6.0.0
	 * @deprecated 6.1.0 Use wp_webfonts()->get_registered().
	 *
	 * @return array[]
	 */
	public function get_registered_webfonts() {
		_deprecated_function( __METHOD__, '6.1.0', 'wp_webfonts()->get_registered()' );

		return $this->registered;
	}

	/**
	 * Gets the list of enqueued fonts.
	 *
	 * BACKPORT NOTE: Do not backport this method.
	 *
	 * @since 6.0.0
	 * @deprecated 6.1.0 Use wp_webfonts()->get_enqueued().
	 *
	 * @return array[]
	 */
	public function get_enqueued_webfonts() {
		_deprecated_function( __METHOD__, '6.1.0', 'wp_webfonts()->get_enqueued()' );

		return $this->queue;
	}

	/**
	 * Gets the list of all fonts.
	 *
	 * BACKPORT NOTE: Do not backport this method.
	 *
	 * @since 6.0.0
	 * @deprecated 6.1.0 Use wp_webfonts()->get_registered().
	 *
	 * @return array[]
	 */
	public function get_all_webfonts() {
		_deprecated_function( __METHOD__, '6.1.0', 'wp_webfonts()->get_registered()' );

		return $this->get_registered();
	}

	/**
	 * Registers a webfont.
	 *
	 * BACKPORT NOTE: Do not backport this method.
	 *
	 * @since 6.0.0
	 * @deprecated 6.1.0 Use wp_register_webfont().
	 *
	 * @param array  $webfont            Web font to register.
	 * @param string $font_family_handle Optional. Font family handle for the given variation.
	 *                                   Default empty string.
	 * @param string $variation_handle   Optional. Handle for the variation to register.
	 * @return string|false The font family slug if successfully registered, else false.
	 */
	public function register_webfont( array $webfont, $font_family_handle = '', $variation_handle = '' ) {
		_deprecated_function( __METHOD__, '6.1.0', 'wp_register_webfont()' );

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
	 * BACKPORT NOTE: Do not backport this method.
	 *
	 * @since 6.0.0
	 * @deprecated 6.1.0 Use wp_webfonts()->enqueue() or wp_enqueue_webfont().
	 *
	 * @param string $font_family_name The font family name to be enqueued.
	 * @return bool True if successfully enqueued, else false.
	 */
	public function enqueue_webfont( $font_family_name ) {
		_deprecated_function( __METHOD__, '6.1.0', 'wp_webfonts()->enqueue() or wp_enqueue_webfont()' );

		$slug = static::get_font_slug( $font_family_name );

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
	 * @param array $webfonts
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
	 * BACKPORT NOTE: Do not backport this function.
	 *
	 * @access private
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
}
