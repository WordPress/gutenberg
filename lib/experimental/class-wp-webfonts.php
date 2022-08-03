<?php
/**
 * Webfonts API class.
 *
 * @package    WordPress
 * @subpackage WebFonts
 * @since      6.1.0
 */

if ( class_exists( 'WP_Webfonts' ) ) {
	return;
}

/**
 * Class WP_Webfonts
 *
 * @since 6.1.0
 *
 * @see WP_Dependencies
 */
class WP_Webfonts extends WP_Dependencies {

	/**
	 * An array of registered providers.
	 *
	 * @since 6.1.0
	 *
	 * @var array
	 */
	private $providers = array();

	/**
	 * The flipped $to_do array of web font handles.
	 *
	 * Used for a faster lookup of the web font handles.
	 *
	 * @since 6.1.0
	 *
	 * @var string[]
	 */
	private $to_do_keyed_handles;
	/**
	 * Constructor.
	 *
	 * @since 6.1.0
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
	 * Gets the list of all registered web fonts and variations.
	 *
	 * @since 6.1.0
	 *
	 * @return string[]
	 */
	public function get_registered() {
		return array_keys( $this->registered );
	}

	/**
	 * Gets the list of enqueued web fonts and variations.
	 *
	 * @since 6.1.0
	 *
	 * @return array[]
	 */
	public function get_enqueued() {
		return $this->queue;
	}

	/**
	 * Gets a list of all registered variations for the given font family.
	 *
	 * @since 6.1.0
	 *
	 * @param string $font_family_handle The font family for the variations.
	 * @return array An array of registered variations.
	 */
	public function get_variations( $font_family_handle ) {
		if ( ! isset( $this->registered[ $font_family_handle ] ) ) {
			return array();
		}

		return $this->registered[ $font_family_handle ]->deps;
	}

	/**
	 * Removes a font family and all registered variations.
	 *
	 * @since 6.1.0
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
	 * Removes a font variation.
	 *
	 * @since 6.1.0
	 *
	 * @param string $font_family_handle The font family for this variation.
	 * @param string $variation_handle   The variation's handle to remove.
	 */
	public function remove_variation( $font_family_handle, $variation_handle ) {
		$this->remove( $font_family_handle );

		if ( ! isset( $this->registered[ $font_family_handle ] ) ) {
			return;
		}

		// Remove the variation as a dependency.
		$this->registered[ $font_family_handle ]->deps = array_values(
			array_diff(
				$this->registered[ $font_family_handle ]->deps,
				array( $variation_handle )
			)
		);
	}

	/**
	 * Registers a variation to the given font family.
	 *
	 * @since 6.1.0
	 *
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param array  $variation          An array of variation properties to add.
	 * @param string $variation_handle   Optional. The variation's handle. When none is provided, the
	 *                                   handle will be dynamically generated.
	 *                                   Default empty string.
	 * @return string|bool Variation handle on success. Else false.
	 */
	public function add_variation( $font_family_handle, array $variation, $variation_handle = '' ) {
		// Register the font family when it does not yet exist.
		if ( ! isset( $this->registered[ $font_family_handle ] ) ) {
			if ( ! $this->add( $font_family_handle, false ) ) {
				return false;
			}
		}

		$variation = $this->validate_variation( $font_family_handle, $variation );

		// Variation validation failed.
		if ( ! $variation ) {
			return false;
		}

		if ( '' === $variation_handle ) {
			$variation_handle = static::get_variation_handle( $font_family_handle, $variation );
		}

		if ( $variation['src'] ) {
			$result = $this->add( $variation_handle, $variation['src'] );
		} else {
			$result = $this->add( $variation_handle );
		}

		// Bail out if the registration failed.
		if ( ! $result ) {
			return false;
		}

		$this->add_data( $variation_handle, 'font-properties', $variation );

		// Add the font variation as a dependency to the registered font family.
		$this->add_dependency( $font_family_handle, $variation_handle );

		$this->providers[ $variation['provider'] ]['fonts'][] = $variation_handle;

		return $variation_handle;
	}

	/**
	 * Adds a variation as a dependency to the given font family.
	 *
	 * @since 6.1.0
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
	 * @since 6.1.0
	 *
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param array  $variation          An array of variation properties to add.
	 * @return array|false|object
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
				trigger_error( __( 'Webfont src must be a non-empty string or an array of strings.', 'gutenberg' ) );
				return false;
			}
		} elseif ( ! class_exists( $variation['provider'] ) ) {
			trigger_error( __( 'The provider class specified does not exist.', 'gutenberg' ) );
			return false;
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

	/**
	 * Processes the items and dependencies.
	 *
	 * Processes the items passed to it or the queue, and their dependencies.
	 *
	 * @since 6.1.0
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
		/*
		 * If nothing is passed, print the queue. If a string is passed,
		 * print that item. If an array is passed, print those items.
		 */
		$handles = false === $handles ? $this->queue : (array) $handles;
		$this->all_deps( $handles );

		$this->to_do_keyed_handles = array_flip( $this->to_do );

		foreach ( $this->get_providers() as $provider_id => $provider ) {
			// Bail out if the provider class does not exist.
			if ( ! class_exists( $provider['class'] ) ) {
				/* translators: %s is the provider name. */
				trigger_error( sprintf( __( 'Webfont provider "%s" is not registered.', 'gutenberg' ), $provider_id ) );
				continue;
			}

			$this->do_item( $provider_id, $group );
		}

		return $this->done;
	}

	/**
	 * Invokes each provider to process and print its styles.
	 *
	 * @since 6.1.0
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

		$fonts = $this->get_enqueued_fonts_for_provider( $provider_id );
		// If there are no web fonts for this provider, skip it.
		if ( empty( $fonts ) ) {
			return false;
		}

		$provider_fonts = array();

		foreach ( $fonts as $font_handle ) {
			$provider_fonts[ $font_handle ] = $this->get_data( $font_handle, 'font-properties' );
		}

		$provider = new $this->providers[ $provider_id ]['class']();
		$provider->set_webfonts( $provider_fonts );
		$provider->print_styles();

		foreach ( $fonts as $font_handle ) {
			$this->done[] = $font_handle;
			unset(
				$this->to_do[ $this->to_do_keyed_handles[ $font_handle ] ],
				$this->to_do_keyed_handles[ $font_handle ]
			);
		}

		return true;
	}

	/**
	 * Register a provider.
	 *
	 * @since 6.1.0
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
	 * @since 6.1.0
	 *
	 * @return WP_Webfonts_Provider[] All registered providers, each keyed by their unique ID.
	 */
	public function get_providers() {
		return $this->providers;
	}

	/**
	 * Retrieves a list of enqueued web font variations for a provider.
	 *
	 * @since 6.1.0
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
	 * Get the font slug.
	 *
	 * @since 6.1.0
	 *
	 * @param array|string $to_convert The value to convert into a slug. Expected as the web font's array
	 *                                 or a font-family as a string.
	 * @return string|false The font slug on success, or false if the font-family cannot be determined.
	 */
	public static function get_font_slug( $to_convert ) {
		if ( is_array( $to_convert ) ) {
			if ( isset( $to_convert['font-family'] ) ) {
				$to_convert = $to_convert['font-family'];
			} elseif ( isset( $to_convert['fontFamily'] ) ) {
				$to_convert = $to_convert['fontFamily'];
			} else {
				_doing_it_wrong( __METHOD__, __( 'Could not determine the font family name.', 'gutenberg' ), '6.0.0' );
				return false;
			}
		}

		return sanitize_title( $to_convert );
	}

	/**
	 * Gets a handle for the given variation.
	 *
	 * @since 6.1.0
	 *
	 * @param string $font_family The font family's handle for this variation.
	 * @param array  $variation   An array of variation properties.
	 * @return string The variation handle.
	 */
	public static function get_variation_handle( $font_family, array $variation ) {
		$handle = sprintf( '%s-%s', $font_family, implode( ' ', array( $variation['font-weight'], $variation['font-style'] ) ) );
		return sanitize_title( $handle );
	}
}
