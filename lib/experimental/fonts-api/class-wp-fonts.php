<?php
/**
 * WP Fonts API class.
 *
 * @package    WordPress
 * @subpackage Fonts API
 * @since      X.X.X
 */

if ( class_exists( 'WP_Fonts' ) ) {
	return;
}

/**
 * Class WP_Web_Fonts
 *
 * @since X.X.X
 */
class WP_Fonts extends WP_Dependencies {

	/**
	 * Registered "origin", indicating the font is registered in the API.
	 *
	 * @since X.X.X
	 *
	 * @var string
	 */
	const REGISTERED_ORIGIN = 'gutenberg_wp_fonts_api';

	/**
	 * An array of registered providers.
	 *
	 * @since X.X.X
	 *
	 * @var array
	 */
	private $providers = array();

	/**
	 * The flipped $to_do array of font handles.
	 *
	 * Used for a faster lookup of the font handles.
	 *
	 * @since X.X.X
	 *
	 * @var string[]
	 */
	private $to_do_keyed_handles;

	/**
	 * Provider instance store, keyed by provider ID.
	 *
	 * @since X.X.X
	 *
	 * @var array
	 */
	private $provider_instances = array();

	/**
	 * Variation property defaults.
	 *
	 * @since X.X.X
	 *
	 * @var array
	 */
	private $variation_property_defaults = array(
		'provider'     => 'local',
		'font-family'  => '',
		'font-style'   => 'normal',
		'font-weight'  => '400',
		'font-display' => 'fallback',
	);

	/**
	 * Constructor.
	 *
	 * @since X.X.X
	 */
	public function __construct() {
		/**
		 * Filters the font variation's property defaults.
		 *
		 * @since X.X.X
		 *
		 * @param array $defaults {
		 *     An array of required font properties and defaults.
		 *
		 *     @type string $provider     The provider ID. Default 'local'.
		 *     @type string $font-family  The font-family property. Default empty string.
		 *     @type string $font-style   The font-style property. Default 'normal'.
		 *     @type string $font-weight  The font-weight property. Default '400'.
		 *     @type string $font-display The font-display property. Default 'fallback'.
		 * }
		 */
		$this->variation_property_defaults = apply_filters( 'wp_font_variation_defaults', $this->variation_property_defaults );

		/**
		 * Fires when the WP_Fonts instance is initialized.
		 *
		 * @since X.X.X
		 *
		 * @param WP_Fonts $wp_fonts WP_Fonts instance (passed by reference).
		 */
		do_action_ref_array( 'wp_default_fonts', array( &$this ) );
	}

	/**
	 * Get the list of registered providers.
	 *
	 * @since X.X.X
	 *
	 * @return array $providers {
	 *     An associative array of registered providers, keyed by their unique ID.
	 *
	 *     @type string $provider_id => array {
	 *         An associate array of provider's class name and fonts.
	 *
	 *         @type string $class   Fully qualified name of the provider's class.
	 *         @type string[] $fonts An array of enqueued font handles for this provider.
	 *     }
	 * }
	 */
	public function get_providers() {
		return $this->providers;
	}

	/**
	 * Register a provider.
	 *
	 * @since X.X.X
	 *
	 * @param string $provider_id The provider's unique ID.
	 * @param string $class       The provider class name.
	 * @return bool True if successfully registered, else false.
	 */
	public function register_provider( $provider_id, $class ) {
		if ( empty( $provider_id ) || empty( $class ) || ! class_exists( $class ) ) {
			return false;
		}

		$this->providers[ $provider_id ] = array(
			'class' => $class,
			'fonts' => array(),
		);
		return true;
	}

	/**
	 * Get the list of all registered font family handles.
	 *
	 * @since X.X.X
	 *
	 * @return string[]
	 */
	public function get_registered_font_families() {
		$font_families = array();
		foreach ( $this->registered as $handle => $obj ) {
			if ( $obj->extra['is_font_family'] ) {
				$font_families[] = $handle;
			}
		}
		return $font_families;
	}

	/**
	 * Get the list of all registered font families and their variations.
	 *
	 * @since X.X.X
	 *
	 * @return string[]
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
	 * Registers a font family.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family Font family name to register.
	 * @return string|null Font family handle when registration successes. Null on failure.
	 */
	public function add_font_family( $font_family ) {
		$font_family_handle = WP_Fonts_Utils::convert_font_family_into_handle( $font_family );
		if ( ! $font_family_handle ) {
			return null;
		}

		if ( isset( $this->registered[ $font_family_handle ] ) ) {
			return $font_family_handle;
		}

		$registered = $this->add( $font_family_handle, false );
		if ( ! $registered ) {
			return null;
		}

		$this->add_data( $font_family_handle, 'font-properties', array( 'font-family' => $font_family ) );
		$this->add_data( $font_family_handle, 'is_font_family', true );

		return $font_family_handle;
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
	 * Add a variation to an existing family or register family if none exists.
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
		if ( ! WP_Fonts_Utils::is_defined( $font_family_handle ) ) {
			trigger_error( 'Font family handle must be a non-empty string.' );
			return null;
		}

		// When there is a variation handle, check it.
		if ( '' !== $variation_handle && ! WP_Fonts_Utils::is_defined( $variation_handle ) ) {
			trigger_error( 'Variant handle must be a non-empty string.' );
			return null;
		}

		// Register the font family when it does not yet exist.
		if ( ! isset( $this->registered[ $font_family_handle ] ) ) {
			if ( ! $this->add_font_family( $font_family_handle ) ) {
				return null;
			}
		}

		$variation = $this->validate_variation( $variation );

		// Variation validation failed.
		if ( ! $variation ) {
			return null;
		}

		// When there's no variation handle, attempt to create one.
		if ( '' === $variation_handle ) {
			$variation_handle = WP_Fonts_Utils::convert_variation_into_handle( $font_family_handle, $variation );
			if ( is_null( $variation_handle ) ) {
				return null;
			}
		}

		// Bail out if the variant is already registered.
		if ( $this->is_variation_registered( $font_family_handle, $variation_handle ) ) {
			return $variation_handle;
		}

		$variation_src = array_key_exists( 'src', $variation ) ? $variation['src'] : false;
		$result        = $this->add( $variation_handle, $variation_src );

		// Bail out if the registration failed.
		if ( ! $result ) {
			return null;
		}

		$this->add_data( $variation_handle, 'font-properties', $variation );
		$this->add_data( $variation_handle, 'is_font_family', false );

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
	 * @param array $variation  Variation properties to add.
	 * @return false|array Validated variation on success. Else, false.
	 */
	private function validate_variation( $variation ) {
		$variation = wp_parse_args( $variation, $this->variation_property_defaults );

		// Check the font-family.
		if ( empty( $variation['font-family'] ) || ! is_string( $variation['font-family'] ) ) {
			trigger_error( 'Webfont font-family must be a non-empty string.' );
			return false;
		}

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
					trigger_error( 'Each font src must be a non-empty string.' );
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
		if ( ! in_array( $variation['font-display'], array( 'auto', 'block', 'fallback', 'swap', 'optional' ), true ) ) {
			$variation['font-display'] = 'fallback';
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
	 * @param string|string[]|bool $handles Optional. Items to be processed: queue (false),
	 *                                      single item (string), or multiple items (array of strings).
	 *                                      Default false.
	 * @param int|false            $group   Optional. Group level: level (int), no group (false).
	 *
	 * @return array|string[] Array of font handles that have been processed.
	 *                        An empty array if none were processed.
	 */
	public function do_items( $handles = false, $group = false ) {
		$handles = $this->prepare_handles_for_printing( $handles );

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
						'Class "%s" not found for "%s" font provider',
						$provider['class'],
						$provider_id
					)
				);
				continue;
			}

			$this->do_item( $provider_id, $group );
		}

		$this->process_font_families_after_printing( $handles );

		return $this->done;
	}

	/**
	 * Prepares the given handles for printing.
	 *
	 * @since X.X.X
	 *
	 * @param string|string[]|bool $handles Optional. Handles to prepare.
	 *                                      Default false.
	 * @return array Array of handles.
	 */
	private function prepare_handles_for_printing( $handles = false ) {
		if ( false !== $handles ) {
			$handles = $this->validate_handles( $handles );
			// Bail out when invalid.
			if ( empty( $handles ) ) {
				return array();
			}
		}

		// Use the enqueued queue.
		if ( empty( $handles ) ) {
			if ( empty( $this->queue ) ) {
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
	 * @param string|string[] $handles Handles to prepare.
	 * @return string[]|null Array of handles on success. Else null.
	 */
	private function validate_handles( $handles ) {
		// Validate each element is a non-empty string handle.
		$handles = array_filter( (array) $handles, array( WP_Fonts_Utils::class, 'is_defined' ) );

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
	 * @param string    $provider_id The provider to process.
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
		$provider = $this->get_provider_instance( $provider_id );
		$provider->set_fonts( $properties_by_font );
		$provider->print_styles();

		// Clean up.
		$this->update_queues_for_printed_fonts( $font_handles );

		return true;
	}

	/**
	 * Retrieves a list of enqueued font variations for a provider.
	 *
	 * @since X.X.X
	 *
	 * @param string $provider_id The provider to process.
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
	 * Gets the instance of the provider from the WP_Webfonts::$provider_instance store.
	 *
	 * @since X.X.X
	 *
	 * @param string $provider_id The provider to get.
	 * @return object Instance of the provider.
	 */
	private function get_provider_instance( $provider_id ) {
		if ( ! isset( $this->provider_instances[ $provider_id ] ) ) {
			$this->provider_instances[ $provider_id ] = new $this->providers[ $provider_id ]['class']();
		}
		return $this->provider_instances[ $provider_id ];
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
			$this->set_as_done( $font_handle );
			$this->remove_from_to_do_queues( $font_handle );
		}
	}

	/**
	 * Processes the font families after printing the variations.
	 *
	 * For each queued font family:
	 *
	 * a. if any of their variations were printed, the font family is added to the `done` list.
	 * b. removes each from the to_do queues.
	 *
	 * @since X.X.X
	 *
	 * @param array $handles Handles to process.
	 */
	private function process_font_families_after_printing( array $handles ) {
		foreach ( $handles as $handle ) {
			if (
				! $this->get_data( $handle, 'is_font_family' ) ||
				! isset( $this->to_do_keyed_handles[ $handle ] )
			) {
				continue;
			}
			$font_family = $this->registered[ $handle ];

			// Add the font family to `done` list if any of its variations were printed.
			if ( ! empty( $font_family->deps ) ) {
				$processed = array_intersect( $font_family->deps, $this->done );
				if ( ! empty( $processed ) ) {
					$this->set_as_done( $handle );
				}
			}

			$this->remove_from_to_do_queues( $handle );
		}
	}

	/**
	 * Removes the handle from the `to_do` and `to_do_keyed_handles` lists.
	 *
	 * @since X.X.X
	 *
	 * @param string $handle Handle to remove.
	 */
	private function remove_from_to_do_queues( $handle ) {
		unset(
			$this->to_do[ $this->to_do_keyed_handles[ $handle ] ],
			$this->to_do_keyed_handles[ $handle ]
		);
	}

	/**
	 * Sets the given handle to done by adding it to the `done` list.
	 *
	 * @since X.X.X
	 *
	 * @param string $handle Handle to set as done.
	 */
	private function set_as_done( $handle ) {
		if ( ! is_array( $this->done ) ) {
			$this->done = array();
		}
		$this->done[] = $handle;
	}

	/**
	 * Converts the font family and its variations into theme.json structural format.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family_handle Font family to convert.
	 * @return array Webfonts in theme.json structural format.
	 */
	public function to_theme_json( $font_family_handle ) {
		if ( ! isset( $this->registered[ $font_family_handle ] ) ) {
			return array();
		}

		$font_family_name  = $this->registered[ $font_family_handle ]->extra['font-properties']['font-family'];
		$theme_json_format = array(
			'fontFamily' => str_contains( $font_family_name, ' ' ) ? "'{$font_family_name}'" : $font_family_name,
			'name'       => $font_family_name,
			'slug'       => $font_family_handle,
			'fontFace'   => array(),
		);

		foreach ( $this->registered[ $font_family_handle ]->deps as $variation_handle ) {
			if ( ! isset( $this->registered[ $variation_handle ] ) ) {
				continue;
			}

			$variation_obj        = $this->registered[ $variation_handle ];
			$variation_properties = array( 'origin' => static::REGISTERED_ORIGIN );
			foreach ( $variation_obj->extra['font-properties'] as $property_name => $property_value ) {
				$property_in_camelcase                          = lcfirst( str_replace( '-', '', ucwords( $property_name, '-' ) ) );
				$variation_properties[ $property_in_camelcase ] = $property_value;
			}
			$theme_json_format['fontFace'][ $variation_obj->handle ] = $variation_properties;
		}

		return $theme_json_format;
	}
}
