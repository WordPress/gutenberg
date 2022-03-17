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
	 * @access private
	 * @var array
	 */
	private $webfonts = array();

	/**
	 * An array of registered providers.
	 *
	 * @since 6.0.0
	 *
	 * @access private
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
	 * Get the list of fonts.
	 *
	 * @since 6.0.0
	 *
	 * @return array
	 */
	public function get_fonts() {
		return $this->webfonts;
	}

	/**
	 * Get the list of providers.
	 *
	 * @since 6.0.0
	 *
	 * @return array
	 */
	public function get_providers() {
		return $this->providers;
	}

	/**
	 * Register a webfont.
	 *
	 * @since 6.0.0
	 *
	 * @param array $font The font arguments.
	 */
	public function register_font( $font ) {
		$font = $this->validate_font( $font );

		// If not valid, bail out.
		if ( ! $font ) {
			return false;
		}

		$slug = $this->get_font_slug( $font );

		// Initialize a new font-family collection.
		if ( ! isset( $this->webfonts[ $slug ] ) ) {
			$this->webfonts[ $slug ] = array();
		}

		$this->webfonts[ $slug ][] = $font;
	}

	/**
	 * Get the font slug.
	 *
	 * @since 6.0.0
	 *
	 * @param array|string $to_convert The value to convert into a slug. Expected as the web font's array or a font-family as a string.
	 */
	private function get_font_slug( $to_convert ) {
		if ( is_array( $to_convert ) ) {
			$to_convert = $to_convert['font-family'];
		}

		return sanitize_title( $to_convert );
	}

	/**
	 * Validate a font.
	 *
	 * @since 6.0.0
	 *
	 * @param array $font The font arguments.
	 *
	 * @return array|false The validated font arguments, or false if the font is invalid.
	 */
	public function validate_font( $font ) {
		$font = wp_parse_args(
			$font,
			array(
				'provider'     => 'local',
				'font-family'  => '',
				'font-style'   => 'normal',
				'font-weight'  => '400',
				'font-display' => 'fallback',
			)
		);

		// Check the font-family.
		if ( empty( $font['font-family'] ) || ! is_string( $font['font-family'] ) ) {
			trigger_error( __( 'Webfont font family must be a non-empty string.', 'gutenberg' ) );
			return false;
		}

		// Local fonts need a "src".
		if ( 'local' === $font['provider'] ) {
			// Make sure that local fonts have 'src' defined.
			if ( empty( $font['src'] ) || ( ! is_string( $font['src'] ) && ! is_array( $font['src'] ) ) ) {
				trigger_error( __( 'Webfont src must be a non-empty string or an array of strings.', 'gutenberg' ) );
				return false;
			}
		}

		// Validate the 'src' property.
		if ( ! empty( $font['src'] ) ) {
			foreach ( (array) $font['src'] as $src ) {
				if ( empty( $src ) || ! is_string( $src ) ) {
					trigger_error( __( 'Each webfont src must be a non-empty string.', 'gutenberg' ) );
					return false;
				}
			}
		}

		// Check the font-weight.
		if ( ! is_string( $font['font-weight'] ) && ! is_int( $font['font-weight'] ) ) {
			trigger_error( __( 'Webfont font weight must be a properly formatted string or integer.', 'gutenberg' ) );
			return false;
		}

		// Check the font-display.
		if ( ! in_array( $font['font-display'], array( 'auto', 'block', 'fallback', 'swap' ), true ) ) {
			$font['font-display'] = 'fallback';
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

		foreach ( $font as $prop => $value ) {
			if ( ! in_array( $prop, $valid_props, true ) ) {
				unset( $font[ $prop ] );
			}
		}

		return $font;
	}

	/**
	 * Register a provider.
	 *
	 * @since 6.0.0
	 *
	 * @param string $provider The provider name.
	 * @param string $class    The provider class name.
	 *
	 * @return bool Whether the provider was registered successfully.
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
		$styles = $this->generate_styles();

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
		$styles = $this->generate_styles();

		// Bail out if there are no styles to enqueue.
		if ( '' === $styles ) {
			return;
		}

		wp_add_inline_style( 'wp-block-library', $styles );
	}

	/**
	 * Generate styles for webfonts.
	 *
	 * @since 6.0.0
	 *
	 * @return string $styles Generated styles.
	 */
	public function generate_styles() {
		$styles    = '';
		$providers = $this->get_providers();

		$webfonts = array();

		// Grab only the font face declarations from $font_families.
		foreach ( $this->get_fonts() as $font_family ) {
			foreach ( $font_family as $font_face ) {
				$webfonts[] = $font_face;
			}
		}

		// Group webfonts by provider.
		$webfonts_by_provider = array();
		foreach ( $webfonts as $slug => $webfont ) {
			$provider = $webfont['provider'];
			if ( ! isset( $providers[ $provider ] ) ) {
				/* translators: %s is the provider name. */
				error_log( sprintf( __( 'Webfont provider "%s" is not registered.', 'gutenberg' ), $provider ) );
				continue;
			}
			$webfonts_by_provider[ $provider ]          = isset( $webfonts_by_provider[ $provider ] ) ? $webfonts_by_provider[ $provider ] : array();
			$webfonts_by_provider[ $provider ][ $slug ] = $webfont;
		}

		/*
		 * Loop through each of the providers to get the CSS for their respective webfonts
		 * to incrementally generate the collective styles for all of them.
		 */
		foreach ( $providers as $provider_id => $provider_class ) {

			// Bail out if the provider class does not exist.
			if ( ! class_exists( $provider_class ) ) {
				/* translators: %s is the provider name. */
				error_log( sprintf( __( 'Webfont provider "%s" is not registered.', 'gutenberg' ), $provider_id ) );
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
}
