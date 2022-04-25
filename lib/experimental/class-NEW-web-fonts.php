<?php

class WP_Web_Fonts extends WP_Dependencies {

	/**
	 * An array of registered providers.
	 *
	 * @since 6.0.0
	 *
	 * @var array
	 */
	private $providers = array();

	/**
	 * Get the list of providers.
	 *
	 * @since 6.0.0
	 *
	 * @return WP_Web_Fonts_Provider[] All registered providers, each keyed by their unique ID.
	 */
	public function get_providers() {
		return $this->providers;
	}

	public function __contstruct() {
		/**
		 * Fires when the WP_Web_Fonts instance is initialized.
		 *
		 * @since X.X.X
		 *
		 * @param WP_Web_Fonts $wp_web_fonts WP_Web_Fonts instance (passed by reference).
		 */
		do_action_ref_array( 'wp_default_web_fonts', array( &$this ) );
	}

	/**
	 * Removes a font family and all registered variations.
	 *
	 * @param mixed|string|string[] $font_family
	 */
	function remove_family( $font_family ) {
		$font_family_handle = sanitize_title( $font_family );

		if ( ! isset( $this->registered[ $font_family_handle ] ) ) {
			return;
		}

		$variations = $this->registered[ $font_family_handle ]->deps;

		foreach ( $variations as $variation ) {
			$this->remove( $variation );
		}

		$this->remove( $font_family_handle );
	}

	/**
	 * Removes a variation.
	 *
	 * @param $font_family
	 * @param $variation_handle
	 */
	function remove_variation( $font_family, $variation_handle ) {
		$font_family_handle = sanitize_title( $font_family );

		$this->remove( $variation_handle );

		if ( ! isset( $this->registered[ $font_family_handle ] ) ) {
			return;
		}

		// Remove the variation as a dependency.
		$this->registered[ $font_family_handle ]->deps = array_values( array_diff(
			$this->registered[ $font_family_handle ]->deps,
			array( $variation_handle )
		) );
	}

	/**
	 * Registers a variation for a font family.
	 *
	 * @param string $font_family
	 * @param string $variation_handle
	 * @param array  $variation
	 */
	public function add_variation( $font_family, $variation_handle, $variation ) {
		$font_family_handle = sanitize_title( $font_family );

		// Register the font family when it does not yet exist.
		if ( ! isset( $this->registered[ $font_family ] ) ) {
			$this->add( $font_family_handle, false );
		}

		$variation = $this->validate_variation( $font_family, $variation );

		if ( $variation['src'] ) {
			return $this->add( $variation_handle, $variation['src'] );
		} else {
			return $this->add( $variation_handle, false );
		}
	}

	/**
	 * Adds a variation as a dependency for the main font alias.
	 *
	 * @param $font_family_handle
	 * @param $variation_handle
	 */
	public function add_dependency( $font_family_handle, $variation_handle ) {
		$dependencies = $this->registered[ $font_family_handle ];
		$dependencies[] = $variation_handle;
		$this->registered[ $font_family_handle ] = $dependencies;
	}

	/**
	 * Validates and sanitizes a variation.
	 *
	 * @param $font_family
	 * @param $variation
	 * @return array|false|object
	 */
	function validate_variation( $font_family, $variation ) {
		$defaults = array(
			'provider'     => 'local',
			'font-style'   => 'normal',
			'font-weight'  => '400',
			'font-display' => 'fallback',
		);

		$defaults = apply_filters( 'wp_web_font_variation_defaults', $defaults );

		$defaults['font-family'] = $font_family;
		$variation = wp_parse_args( $variation, $defaults );

		// Local fonts need a "src".
		if ( 'local' === $variation['provider'] ) {
			// Make sure that local fonts have 'src' defined.
			if ( empty( $variation['src'] ) || ( ! is_string( $variation['src'] ) && ! is_array( $variation['src'] ) ) ) {
				trigger_error( __( 'Webfont src must be a non-empty string or an array of strings.', 'gutenberg' ) );
				return false;
			}
		}

		// Validate the 'src' property.
		if ( ! empty( $variation['src'] ) ) {
			foreach ( (array) $variation['src'] as $src ) {
				if ( empty( $src ) || ! is_string( $src ) ) {
					trigger_error( __( 'Each webfont src must be a non-empty string.', 'gutenberg' ) );
					return false;
				}
			}
		}

		// Check the font-weight.
		if ( ! is_string( $variation['font-weight'] ) && ! is_int( $variation['font-weight'] ) ) {
			trigger_error( __( 'Webfont font weight must be a properly formatted string or integer.', 'gutenberg' ) );
			return false;
		}

		// Check the font-display.
		if ( ! in_array( $variation['font-display'], array( 'auto', 'block', 'fallback', 'swap' ), true ) ) {
			$variation['font-display'] = 'fallback';
		}

		$valid_props = array(
			'ascend-override',
			'descend-override',
			'font-display',
			'font-family',
			'font-stretch',
			'font-style',
			'font-weight',
			'font-variant',
			'font-feature-settings',
			'font-variation-settings',
			'line-gap-override',
			'size-adjust',
			'src',
			'unicode-range',

			// Exceptions.
			'provider',
		);

		foreach ( $variation as $prop => $value ) {
			if ( ! in_array( $prop, $valid_props, true ) ) {
				unset( $variation[ $prop ] );
			}
		}

		return $variation;
	}
}
