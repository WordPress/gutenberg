<?php
/**
 * Webfonts API class.
 *
 * @package    WordPress
 * @subpackage WebFonts
 * @since      6.0.0
 */

if ( class_exists( 'WP_Webfonts' ) ) {
	return;
}

/**
 * Class WP_Webfonts
 *
 * @since 6.0.0
 */
class WP_Webfonts {

	/**
	 * An array of registered webfonts.
	 *
	 * @since 6.0.0
	 *
	 * @var array[]
	 */
	private $registered_webfonts = array();

	/**
	 * An array of enqueued webfonts.
	 *
	 * @var array[]
	 */
	private $enqueued_webfonts = array();

	/**
	 * An array of registered providers.
	 *
	 * @since 6.0.0
	 *
	 * @var array
	 */
	private $providers = array();

	/**
	 * Stylesheet handle.
	 *
	 * @since 6.0.0
	 *
	 * @var string
	 */
	private $stylesheet_handle = '';

	/**
	 * Init.
	 *
	 * @since 6.0.0
	 */
	public function init() {
		// Register default providers.
		$this->register_provider( 'local', 'WP_Webfonts_Provider_Local' );

		// Register callback to generate and enqueue styles.
		if ( did_action( 'wp_enqueue_scripts' ) ) {
			$this->stylesheet_handle = 'webfonts-footer';
			$hook                    = 'wp_print_footer_scripts';
		} else {
			$this->stylesheet_handle = 'webfonts';
			$hook                    = 'wp_enqueue_scripts';
		}
		add_action( $hook, array( $this, 'generate_and_enqueue_styles' ) );

		// Enqueue webfonts in the block editor.
		add_action( 'admin_init', array( $this, 'generate_and_enqueue_editor_styles' ) );
	}

	/**
	 * Get the list of registered fonts.
	 *
	 * @since 6.0.0
	 *
	 * @return array[]
	 */
	public function get_registered_webfonts() {
		return $this->registered_webfonts;
	}

	/**
	 * Get the list of enqueued fonts.
	 *
	 * @return array[]
	 */
	public function get_enqueued_webfonts() {
		return $this->enqueued_webfonts;
	}

	/**
	 * Get the list of all fonts.
	 *
	 * @return array[]
	 */
	public function get_all_webfonts() {
		return array_merge( $this->get_registered_webfonts(), $this->get_enqueued_webfonts() );
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
	 * Register a webfont.
	 *
	 * @since 6.0.0
	 *
	 * @param array $webfont Webfont to be registered.
	 * @return string|false The font family slug if successfully registered, else false.
	 */
	public function register_webfont( array $webfont ) {
		$webfont = $this->validate_webfont( $webfont );

		// If not valid, bail out.
		if ( ! $webfont ) {
			return false;
		}

		$slug = $this->get_font_slug( $webfont );

		// Initialize a new font-family collection.
		if ( ! isset( $this->registered_webfonts[ $slug ] ) ) {
			$this->registered_webfonts[ $slug ] = array();
		}

		$this->registered_webfonts[ $slug ][] = $webfont;
		return $slug;
	}

	/**
	 * Enqueue a font-family that has been already registered.
	 *
	 * @param string     $font_family_name The font family name to be enqueued.
	 * @param array|null $font_face The font face to selectively enqueue.
	 * @return bool True if successfully enqueued, else false.
	 */
	public function enqueue_webfont( $font_family_name, $font_face = null ) {
		$slug = $this->get_font_slug( $font_family_name );

		// The font family is already enqueued and there are none left to enqueue.
		if ( isset( $this->enqueued_webfonts[ $slug ] ) && ! isset( $this->registered_webfonts[ $slug ] ) ) {
			return true;
		}

		if ( ! isset( $this->registered_webfonts[ $slug ] ) ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: %s unique slug to identify the font family of the webfont */
					esc_html__( 'The "%s" font family is not registered.', 'gutenberg' ),
					esc_html( $slug )
				),
				'6.0.0'
			);

			return false;
		}

		// Enqueueing the font family completely.
		if ( ! $font_face ) {
			$font_family_to_enqueue           = $this->unregister_font_family( $font_family_name );
			$this->enqueued_webfonts[ $slug ] = $font_family_to_enqueue;

			return true;
		}

		// Enqueueing a single font face.

		$font_face            = _wp_array_keys_to_kebab_case( $font_face );
		$font_face_to_enqueue = $this->unregister_font_face( $font_face );

		if ( ! $font_face_to_enqueue ) {
			trigger_error(
				sprintf(
					/* translators: %1$s: font family, %2$s: font weight, %3$s: font style */
					esc_html__( 'The "%1$s:%2$s:%3$s" font face is not registered.', 'gutenberg' ),
					esc_html( $font_face['font-family'] ),
					esc_html( $font_face['font-weight'] ),
					esc_html( $font_face['font-style'] )
				)
			);

			return false;
		}

		if ( ! isset( $this->enqueued_webfonts[ $slug ] ) ) {
			$this->enqueued_webfonts[ $slug ] = array();
		}

		$this->enqueued_webfonts[ $slug ][] = $font_face_to_enqueue;

		return true;
	}

	/**
	 * Checks if a font family is registered.
	 *
	 * @param string $font_family_name The font family name to check in the registry.
	 * @return bool True if found, else false.
	 */
	public function is_font_family_registered( $font_family_name ) {
		$slug = $this->get_font_slug( $font_family_name );

		return isset( $this->registered_webfonts[ $slug ] );
	}

	/**
	 * Get the font slug.
	 *
	 * @since 6.0.0
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
	 * Unregisters a font family.
	 *
	 * @param string $font_family_name The font family, by name, to unregister.
	 * @return array[]|false The font face objects of the family if unregistered, false otherwise.
	 */
	private function unregister_font_family( $font_family_name ) {
		$slug = $this->get_font_slug( $font_family_name );

		if ( ! isset( $this->registered_webfonts[ $slug ] ) ) {
			return false;
		}

		$font_family = $this->registered_webfonts[ $slug ];
		unset( $this->registered_webfonts[ $slug ] );

		return $font_family;
	}

	/**
	 * Unregisters a font face.
	 *
	 * @param array $font_face_to_unregister The font face object, to unregister.
	 * @return array|false The font face object if unregistered, false otherwise.
	 */
	private function unregister_font_face( $font_face_to_unregister ) {
		$font_family_slug = $this->get_font_slug( $font_face_to_unregister );

		$font_family = $this->registered_webfonts[ $font_family_slug ];
		$index       = _gutenberg_find_webfont( $font_family, $font_face_to_unregister );

		// Font face not found.
		if ( false === $index ) {
			return false;
		}

		$font_face = $this->registered_webfonts[ $font_family_slug ][ $index ];
		unset( $this->registered_webfonts[ $font_family_slug ][ $index ] );

		// No font faces left, let's remove the font family entry.
		if ( 0 === count( $this->registered_webfonts[ $font_family_slug ] ) ) {
			unset( $this->registered_webfonts[ $font_family_slug ] );
		}

		return $font_face;
	}

	/**
	 * Validate a webfont.
	 *
	 * @since 6.0.0
	 *
	 * @param array $webfont The webfont arguments.
	 *
	 * @return array|false The validated webfont arguments, or false if the webfont is invalid.
	 */
	public function validate_webfont( $webfont ) {
		$webfont = wp_parse_args(
			$webfont,
			array(
				'provider'     => 'local',
				'font-family'  => '',
				'font-style'   => 'normal',
				'font-weight'  => '400',
				'font-display' => 'fallback',
			)
		);

		// Check the font-family.
		if ( empty( $webfont['font-family'] ) || ! is_string( $webfont['font-family'] ) ) {
			trigger_error( __( 'Webfont font family must be a non-empty string.', 'gutenberg' ) );
			return false;
		}

		// Local fonts need a "src".
		if ( 'local' === $webfont['provider'] ) {
			// Make sure that local fonts have 'src' defined.
			if ( empty( $webfont['src'] ) || ( ! is_string( $webfont['src'] ) && ! is_array( $webfont['src'] ) ) ) {
				trigger_error( __( 'Webfont src must be a non-empty string or an array of strings.', 'gutenberg' ) );
				return false;
			}
		}

		// Validate the 'src' property.
		if ( ! empty( $webfont['src'] ) ) {
			foreach ( (array) $webfont['src'] as $src ) {
				if ( empty( $src ) || ! is_string( $src ) ) {
					trigger_error( __( 'Each webfont src must be a non-empty string.', 'gutenberg' ) );
					return false;
				}
			}
		}

		// Check the font-weight.
		if ( ! is_string( $webfont['font-weight'] ) && ! is_int( $webfont['font-weight'] ) ) {
			trigger_error( __( 'Webfont font weight must be a properly formatted string or integer.', 'gutenberg' ) );
			return false;
		}

		// Check the font-display.
		if ( ! in_array( $webfont['font-display'], array( 'auto', 'block', 'fallback', 'swap' ), true ) ) {
			$webfont['font-display'] = 'fallback';
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

		foreach ( $webfont as $prop => $value ) {
			if ( ! in_array( $prop, $valid_props, true ) ) {
				unset( $webfont[ $prop ] );
			}
		}

		return $webfont;
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
		if ( empty( $provider ) || empty( $class ) ) {
			return false;
		}
		$this->providers[ $provider ] = $class;
		return true;
	}

	/**
	 * Generate and enqueue webfonts styles.
	 *
	 * @since 6.0.0
	 */
	public function generate_and_enqueue_styles() {
		// Generate the styles.
		$webfonts = $this->get_webfonts_by_provider( $this->get_enqueued_webfonts() );
		$styles   = $this->generate_styles( $webfonts );

		// Bail out if there are no styles to enqueue.
		if ( '' === $styles ) {
			return;
		}

		// Enqueue the stylesheet.
		wp_register_style( $this->stylesheet_handle, '' );
		wp_enqueue_style( $this->stylesheet_handle );

		// Add the styles to the stylesheet.
		wp_add_inline_style( $this->stylesheet_handle, $styles );
	}

	/**
	 * Generate and enqueue editor styles.
	 *
	 * @since 6.0.0
	 */
	public function generate_and_enqueue_editor_styles() {
		// Generate the styles.
		$webfonts = $this->get_webfonts_by_provider( $this->get_all_webfonts() );
		$styles   = $this->generate_styles( $webfonts );

		// Bail out if there are no styles to enqueue.
		if ( '' === $styles ) {
			return;
		}

		wp_enqueue_style( 'wp-block-library' );
		wp_add_inline_style( 'wp-block-library', $styles );
	}

	/**
	 * Generate styles for webfonts.
	 *
	 * @since 6.0.0
	 *
	 * @param array[] $webfonts_by_provider Webfonts organized by provider.
	 * @return string $styles Generated styles.
	 */
	private function generate_styles( array $webfonts_by_provider ) {
		$styles    = '';
		$providers = $this->get_providers();

		/*
		 * Loop through each of the providers to get the CSS for their respective webfonts
		 * to incrementally generate the collective styles for all of them.
		 */
		foreach ( $providers as $provider_id => $provider_class ) {

			// Bail out if the provider class does not exist.
			if ( ! class_exists( $provider_class ) ) {
				trigger_error(
					sprintf(
						/* translators: %s is the provider name. */
						esc_html__( 'Webfont provider "%s" is not registered.', 'gutenberg' ),
						esc_html( $provider_id )
					)
				);

				continue;
			}

			$provider_webfonts = isset( $webfonts_by_provider[ $provider_id ] )
				? $webfonts_by_provider[ $provider_id ]
				: array();

			// If there are no registered webfonts for this provider, skip it.
			if ( empty( $provider_webfonts ) ) {
				continue;
			}

			/*
			 * Process the webfonts by first passing them to the provider via `set_webfonts()`
			 * and then getting the CSS from the provider.
			 */
			$provider = new $provider_class();
			$provider->set_webfonts( $provider_webfonts );
			$styles .= $provider->get_css();
		}

		return $styles;
	}


	/**
	 * Reorganizes webfonts grouped by font-family into grouped by provider.
	 *
	 * @param array[] $font_families Font families and each of their webfonts.
	 * @return array[] Webfonts organized by providers.
	 */
	private function get_webfonts_by_provider( array $font_families ) {
		$providers            = $this->get_providers();
		$webfonts_by_provider = array();

		foreach ( $font_families as $webfonts ) {
			foreach ( $webfonts as $webfont ) {
				$provider = $webfont['provider'];

				// Skip if the provider is not registered.
				if ( ! isset( $providers[ $provider ] ) ) {
					trigger_error(
						sprintf(
							/* translators: %s is the provider name. */
							esc_html__( 'Webfont provider "%s" is not registered.', 'gutenberg' ),
							esc_html( $provider )
						)
					);
					continue;
				}

				// Initialize a new provider collection.
				if ( ! isset( $webfonts_by_provider[ $provider ] ) ) {
					$webfonts_by_provider[ $provider ] = array();
				}
				$webfonts_by_provider[ $provider ][] = $webfont;
			}
		}

		return $webfonts_by_provider;
	}
}
