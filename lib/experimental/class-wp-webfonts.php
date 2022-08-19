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
	 * The flipped $to_do array of web font handles.
	 *
	 * Used for a faster lookup of the web font handles.
	 *
	 * @since X.X.X
	 *
	 * @var string[]
	 */
	private $to_do_keyed_handles;

	/**
	 * Array of provider instances, keyed by provider ID.
	 *
	 * @since X.X.X
	 *
	 * @var array
	 */
	private $provider_instances = array();
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
	 * Get the list of registered providers.
	 *
	 * @since X.X.X
	 *
	 * @return WP_Webfonts_Provider[] All registered providers, each keyed by their unique ID.
	 */
	public function get_providers() {
		return $this->providers;
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
	 * Removes a variation.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family_handle The font family for this variation.
	 * @param string $variation_handle   The variation's handle to remove.
	 */
	public function remove_variation( $font_family_handle, $variation_handle ) {
		if ( isset( $this->registered[ $variation_handle ] ) ) {
			$this->remove( $variation_handle );
		}

		if ( ! $this->is_variation_registered( $font_family_handle, $variation_handle ) ) {
			return;
		}

		// Remove the variation as a dependency from its font family.
		$this->registered[ $font_family_handle ]->deps = array_values(
			array_diff(
				$this->registered[ $font_family_handle ]->deps,
				array( $variation_handle )
			)
		);
	}

	/**
	 * Checks if the variation is registered.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param string $variation_handle   Variation's handle.
	 * @return bool True when registered to the given font family. Else false.
	 */
	private function is_variation_registered( $font_family_handle, $variation_handle ) {
		if ( ! isset( $this->registered[ $font_family_handle ] ) ) {
			return false;
		}

		return in_array( $variation_handle, $this->registered[ $font_family_handle ]->deps, true );
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
			'font-family'  => $font_family_handle,
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
		} elseif ( ! isset( $this->providers[ $variation['provider'] ] ) ) {
			trigger_error( sprintf( 'The provider "%s" is not registered', $variation['provider'] ) );
			return false;
		} elseif ( ! class_exists( $this->providers[ $variation['provider'] ]['class'] ) ) {
			trigger_error( sprintf( 'The provider class "%s" does not exist', $variation['provider'] ) );
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
	 * Processes the items and dependencies.
	 *
	 * Processes the items passed to it or the queue, and their dependencies.
	 *
	 * @since X.X.X
	 *
	 * @param string|string[]|false $handles Optional. Items to be processed: queue (false),
	 *                                       single item (string), or multiple items (array of strings).
	 *                                       Default false.
	 * @param int|false             $group   Optional. Group level: level (int), no group (false).
	 *
	 * @return array|string[] Array of web font handles that have been processed.
	 *                        An empty array if none were processed.
	 */
	public function do_items( $handles = false, $group = false ) {
		$handles = $this->prep_handles_for_printing( $handles );
		if ( empty( $handles ) ) {
			return $this->done;
		}

		$this->all_deps( $handles );
		if ( empty( $this->to_do ) ) {
			return $this->done;
		}

		$this->to_do_keyed_handles = array_flip( $this->to_do );

		foreach ( $this->get_providers() as $provider_id => $provider ) {
			// Alert and skip if the provider class does not exist.
			if ( ! class_exists( $provider['class'] ) ) {
				/* translators: %s is the provider name. */
				trigger_error(
					sprintf(
						'Class "%s" not found for "%s" web font provider',
						$provider['class'],
						$provider_id
					)
				);
				continue;
			}

			$this->do_item( $provider_id, $group );
		}

		return $this->done;
	}

	/**
	 * Prepares the given handles for printing.
	 *
	 * @since X.X.X
	 *
	 * @param string|string[]|bool $handles Handles to prepare.
	 * @return array Array of handles.
	 */
	private function prep_handles_for_printing( $handles = false ) {
		if ( false !== $handles ) {
			$handles = $this->validate_handles( $handles );
			// Bail out when invalid.
			if ( null === $handles ) {
				return array();
			}
		}

		// Use the enqueued queue.
		if ( empty( $handles ) ) {
			if ( empty( $this->queue ) ) {
				trigger_error( 'No web fonts are enqueued for printing' );

				return array();
			}
			$handles = $this->queue;
		}

		return $handles;
	}

	/**
	 * Validates handle(s) to ensure each is a non-empty string.
	 *
	 * @since X.X.X
	 *
	 * @param mixed $handles Handle or handles to be validated.
	 * @return string[]|null Array of handles on success. Else null.
	 */
	private function validate_handles( $handles ) {
		// Validate each element is a non-empty string handle.
		$handles = array_filter(
			(array) $handles,
			static function( $handle ) {
				return is_string( $handle ) && ! empty( $handle );
			}
		);

		if ( empty( $handles ) ) {
			trigger_error( 'Handles must be a non-empty string or array of non-empty strings' );
			return null;
		}

		return $handles;
	}

	/**
	 * Invokes each provider to process and print its styles.
	 *
	 * @since X.X.X
	 *
	 * @see WP_Dependencies::do_item()
	 *
	 * @param string    $provider_id The font family to process.
	 * @param int|false $group       Not used.
	 * @return bool
	 */
	public function do_item( $provider_id, $group = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Bail out if the provider is not registered.
		if ( ! isset( $this->providers[ $provider_id ] ) ) {
			return false;
		}

		$font_handles = $this->get_enqueued_fonts_for_provider( $provider_id );
		if ( empty( $font_handles ) ) {
			return false;
		}

		$properties_by_font = $this->get_font_properties_for_provider( $font_handles );
		if ( empty( $properties_by_font ) ) {
			return false;
		}

		// Invoke provider to print its styles.
		if ( isset( $this->provider_instances[ $provider_id ] ) ) {
			$provider = $this->provider_instances[ $provider_id ];
		} else {
			$provider = new $this->providers[ $provider_id ]['class']();
			// Store the instance.
			$this->provider_instances[ $provider_id ] = $provider;
		}
		$provider->set_webfonts( $properties_by_font );
		$provider->print_styles();

		// Clean up.
		$this->update_queues_for_printed_fonts( $font_handles );

		return true;
	}

	/**
	 * Retrieves a list of enqueued web font variations for a provider.
	 *
	 * @since X.X.X
	 *
	 * @param string $provider_id Provider's unique ID.
	 * @return array[] Webfonts organized by providers.
	 */
	private function get_enqueued_fonts_for_provider( $provider_id ) {
		$providers = $this->get_providers();

		if ( empty( $providers[ $provider_id ] ) ) {
			return array();
		}

		return array_intersect(
			$providers[ $provider_id ]['fonts'],
			$this->to_do
		);
	}

	/**
	 * Gets a list of font properties for each of the given font handles.
	 *
	 * @since X.X.X
	 *
	 * @param array $font_handles Font handles to get properties.
	 * @return array A list of fonts with each font's properties.
	 */
	private function get_font_properties_for_provider( array $font_handles ) {
		$font_properties = array();

		foreach ( $font_handles as $font_handle ) {
			$properties = $this->get_data( $font_handle, 'font-properties' );
			if ( ! $properties ) {
				continue;
			}
			$font_properties[ $font_handle ] = $properties;
		}

		return $font_properties;
	}

	/**
	 * Update queues for the given printed fonts.
	 *
	 * @since X.X.X
	 *
	 * @param array $font_handles Font handles to get properties.
	 */
	private function update_queues_for_printed_fonts( array $font_handles ) {
		foreach ( $font_handles as $font_handle ) {
			$this->done[] = $font_handle;
			unset(
				$this->to_do[ $this->to_do_keyed_handles[ $font_handle ] ],
				$this->to_do_keyed_handles[ $font_handle ]
			);
		}
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
}
