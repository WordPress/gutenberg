<?php

class WP_Webfonts extends WP_Dependencies {

	/**
	 * An array of registered providers.
	 *
	 * @since X.X.X
	 *
	 * @var array
	 */
	private $providers = array();

	/**
	 * Constructor.
	 *
	 * @since X.X.X
	 */
	public function __construct() {
		/**
		 * Fires when the WP_Webfonts instance is initialized.
		 *
		 * @since X.X.X
		 *
		 * @param WP_Webfonts $wp_webfonts WP_Webfonts instance (passed by reference).
		 */
		do_action_ref_array( 'wp_default_webfonts', array( &$this ) );
	}

	/**
	 * Get the list of all registered font families and their variations.
	 *
	 * @since X.X.X
	 *
	 * @return strings[]
	 */
	public function get_registered() {
		return array_keys( $this->registered );
	}

	/**
	 * Get the list of enqueued font families and their variations.
	 *
	 * @since X.X.X
	 *
	 * @return array[]
	 */
	public function get_enqueued() {
		return $this->queue;
	}

	/**
	 * Removes a font family and all registered variations.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family_handle The font family to remove.
	 */
	public function remove_font_family( $font_family_handle ) {
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
	 * Registers a variation to the given font family.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param array  $variation          An array of variation properties to add.
	 * @param string $variation_handle   Optional. The variation's handle. When none is provided, the
	 *                                   handle will be dynamically generated.
	 *                                   Default empty string.
	 * @return string|null Variation handle on success. Else null.
	 */
	public function add_variation( $font_family_handle, array $variation, $variation_handle = '' ) {
		if ( ! WP_Webfonts_Utils::is_defined( $font_family_handle ) ) {
			trigger_error( 'Font family handle must be a non-empty string.' );
			return null;
		}

		if ( '' !== $variation_handle && ! WP_Webfonts_Utils::is_defined( $variation_handle ) ) {
			trigger_error( 'Variant handle must be a non-empty string.' );
			return null;
		}

		// Register the font family when it does not yet exist.
		if ( ! isset( $this->registered[ $font_family_handle ] ) ) {
			if ( ! $this->add( $font_family_handle, false ) ) {
				return null;
			}
		}

		$variation = $this->validate_variation( $font_family_handle, $variation );

		// Variation validation failed.
		if ( ! $variation ) {
			return null;
		}

		if ( '' === $variation_handle ) {
			$variation_handle = WP_Webfonts_Utils::convert_variation_into_handle( $font_family_handle, $variation );
			if ( is_null( $variation_handle ) ) {
				return null;
			}
		}

		// Bail out if the variant is already registered.
		if ( $this->is_variation_registered( $font_family_handle, $variation_handle ) ) {
			return $variation_handle;
		}

		if ( array_key_exists( 'src', $variation ) ) {
			$result = $this->add( $variation_handle, $variation['src'] );
		} else {
			$result = $this->add( $variation_handle, false );
		}

		// Bail out if the registration failed.
		if ( ! $result ) {
			return null;
		}

		$this->add_data( $variation_handle, 'font-properties', $variation );

		// Add the font variation as a dependency to the registered font family.
		$this->add_dependency( $font_family_handle, $variation_handle );

		$this->providers[ $variation['provider'] ]['fonts'][] = $variation_handle;

		return $variation_handle;
	}

	/**
	 * Checks if the variation is registered.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param string $variant_handle      Variation's handle.
	 * @return bool
	 */
	private function is_variation_registered( $font_family_handle, $variant_handle ) {
		if ( ! isset( $this->registered[ $font_family_handle ] ) ) {
			return array();
		}

		return in_array( $variant_handle, $this->registered[ $font_family_handle ]->deps );
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
	 * Adds a variation as a dependency to the given font family.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param string $variation_handle   The variation's handle.
	 */
	private function add_dependency( $font_family_handle, $variation_handle ) {
		$this->registered[ $font_family_handle ]->deps[] = $variation_handle;
	}

	/**
	 * Validates and sanitizes a variation.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param array  $variation          An array of variation properties to add.
	 * @return false|array Validated variation on success. Else, false.
	 */
	private function validate_variation( $font_family_handle, $variation ) {
		$defaults = array(
			'provider'     => 'local',
			'font-style'   => 'normal',
			'font-weight'  => '400',
			'font-display' => 'fallback',
		);

		$defaults = apply_filters( 'wp_webfont_variation_defaults', $defaults );

		$defaults['font-family'] = $font_family_handle;
		$variation               = wp_parse_args( $variation, $defaults );

		// Local fonts need a "src".
		if ( 'local' === $variation['provider'] ) {
			// Make sure that local fonts have 'src' defined.
			if ( empty( $variation['src'] ) || ( ! is_string( $variation['src'] ) && ! is_array( $variation['src'] ) ) ) {
				trigger_error( 'Webfont src must be a non-empty string or an array of strings.' );
				return false;
			}
		} elseif ( ! class_exists( $variation['provider'] ) ) {
			trigger_error( 'The provider class specified does not exist.' );
			return false;
		}

		// Validate the 'src' property.
		if ( ! empty( $variation['src'] ) ) {
			foreach ( (array) $variation['src'] as $src ) {
				if ( empty( $src ) || ! is_string( $src ) ) {
					trigger_error( 'Each webfont src must be a non-empty string.' );
					return false;
				}
			}
		}

		// Check the font-weight.
		if ( ! is_string( $variation['font-weight'] ) && ! is_int( $variation['font-weight'] ) ) {
			trigger_error( 'Webfont font-weight must be a properly formatted string or integer.' );
			return false;
		}

		// Check the font-display.
		if ( ! in_array( $webfont['font-display'], array( 'auto', 'block', 'fallback', 'swap', 'optional' ), true ) ) {
			$webfont['font-display'] = 'fallback';
		}

		$valid_props = array(
			'ascent-override',
			'descent-override',
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

	/**
	 * Generate styles for webfonts.
	 *
	 * @since 6.0.0
	 *
	 * @param array[] $webfonts_by_provider Webfonts organized by provider.
	 * @return string $styles Generated styles.
	 */
	public function do_item( $handle, $group = false ) {
		if ( ! parent::do_item( $handle ) ) {
			return false;
		}

		$styles    = '';
		$providers = $this->get_providers();

		$obj = $this->registered[ $handle ];

		/*
		 * Loop through each of the providers to get the CSS for their respective webfonts
		 * to incrementally generate the collective styles for all of them.
		 */
		foreach ( $providers as $provider_id => $provider ) {
			// Bail out if the provider class does not exist.
			if ( ! class_exists( $provider['class'] ) ) {
				/* translators: %s is the provider name. */
				trigger_error( sprintf( __( 'Webfont provider "%s" is not registered.', 'gutenberg' ), $provider_id ) );
				continue;
			}

			$fonts = $this->get_enqueued_fonts_for_provider( $provider_id );

			// If there are no registered webfonts for this provider, skip it.
			if ( empty( $fonts ) ) {
				continue;
			}

			$provider_fonts = array();

			foreach ( $fonts as $font_handle ) {
				$provider_fonts[ $font_handle ] = $this->get_data( $font_handle, 'font-properties' );
			}

			/*
			 * Process the webfonts by first passing them to the provider via `set_webfonts()`
			 * and then getting the CSS from the provider.
			 */
			$provider = new $provider['class']();
			$provider->set_webfonts( $provider_fonts );
			$styles .= $provider->get_css();
		}

		return $styles;
	}

	/**
	 * Register a provider.
	 *
	 * @since 6.0.0
	 *
	 * @param string $provider The provider name.
	 * @param string $class    The provider class name.
	 * @return bool True if successfully registered, else false.
	 */
	public function register_provider( $provider, $class ) {
		if ( empty( $provider ) || empty( $class ) || ! class_exists( $class ) ) {
			return false;
		}

		$this->providers[ $provider ] = array(
			'class' => $class,
			'fonts' => array(),
		);
		return true;
	}

	/**
	 * Get the list of providers.
	 *
	 * @since 6.0.0
	 *
	 * @return WP_Webfonts_Provider[] All registered providers, each keyed by their unique ID.
	 */
	public function get_providers() {
		return $this->providers;
	}

	/**
	 * Retrieves a list of enqueued web font variations for a provider.
	 *
	 * @return array[] Webfonts organized by providers.
	 */
	private function get_enqueued_fonts_for_provider( $provider ) {
		$providers = $this->get_providers();

		if ( empty( $providers[ $provider ] ) ) {
			return array();
		}

		return array_intersect(
			$providers[ $provider ]['fonts'],
			$this->get_enqueued()
		);
	}

}
