<?php
/**
 * Webfonts API class.
 *
 * @package Gutenberg
 */

/**
 * Class WP_Webfonts
 */
class WP_Webfonts {

	/**
	 * An array of registered webfonts.
	 *
	 * @static
	 * @access private
	 * @var array
	 */
	private static $webfonts = array();

	/**
	 * An array of registered providers.
	 *
	 * @static
	 * @access private
	 * @var array
	 */
	private static $providers = array();

	/**
	 * An array of fonts actually used in the front-end.
	 *
	 * @static
	 * @access private
	 * @var array
	 */
	private static $webfonts_used_in_front_end = array();

	/**
	 * The name of option that caches the webfonts used in the templates.
	 *
	 * @static
	 * @access private
	 * @var string
	 */
	private static $webfonts_used_in_templates_cache_option = 'gutenberg_webfonts_used_in_templates';

	/**
	 * The name of option that caches the webfonts used in global styles.
	 *
	 * @static
	 * @access private
	 * @var string
	 */
	private static $webfonts_used_in_global_styles_cache_option = 'gutenberg_webfonts_used_in_global_styles';

	/**
	 * Stylesheet handle.
	 *
	 * @var string
	 */
	private $stylesheet_handle = '';

	/**
	 * Init.
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

		add_action( 'init', array( $this, 'register_filter_for_current_template_webfonts_collector' ) );
		add_action( 'init', array( $this, 'collect_webfonts_used_in_global_styles' ) );
		add_action( 'switch_theme', array( $this, 'update_webfonts_used_in_global_styles_cache' ) );

		add_action( 'save_post_wp_template', array( $this, 'invalidate_webfonts_used_in_templates_cache' ) );
		add_action( 'save_post_wp_template_part', array( $this, 'invalidate_webfonts_used_in_templates_cache' ) );
		add_action( 'save_post_wp_global_styles', array( $this, 'update_webfonts_used_in_global_styles_cache' ) );

		add_action( $hook, array( $this, 'generate_and_enqueue_styles' ) );

		// Enqueue webfonts in the block editor.
		add_action( 'admin_init', array( $this, 'generate_and_enqueue_editor_styles' ) );
	}

	/**
	 * Invalidate webfonts used in templates cache.
	 * We need to do that because there's no indication on which templates uses which template parts,
	 * so we're throwing everything away and lazily reconstructing the cache whenever a template gets loaded.
	 *
	 * @return void
	 */
	public function invalidate_webfonts_used_in_templates_cache() {
		delete_option( self::$webfonts_used_in_templates_cache_option );
	}

	/**
	 * Hook into every possible template so we can collect the webfonts used in the template
	 * that has been loaded in the front-end.
	 */
	public function register_filter_for_current_template_webfonts_collector() {
		$template_type_slugs = array_keys( get_default_block_template_types() );

		foreach ( $template_type_slugs as $template_type_slug ) {
			add_filter(
				str_replace( '-', '', $template_type_slug ) . '_template',
				array( $this, 'collect_webfonts_used_in_template' ),
				10,
				2
			);
		}
	}

	/**
	 * Grab the webfonts used in the template and include them
	 * in the set of all the webfonts used in the front-end.
	 *
	 * @param string $template_path The current template path.
	 * @param string $template_slug The current template slug.
	 *
	 * @return void
	 */
	public function collect_webfonts_used_in_template( $template_path, $template_slug ) {
		global $_wp_current_template_content;

		$webfonts_used_in_templates = get_option( self::$webfonts_used_in_templates_cache_option, array() );

		if ( ! isset( $webfonts_used_in_templates[ $template_slug ] ) ) {
			$webfonts_used_in_templates[ $template_slug ] = $this->get_fonts_from_template( $_wp_current_template_content );

			update_option( self::$webfonts_used_in_templates_cache_option, $webfonts_used_in_templates );
		}

		$webfonts_used_in_template        = $webfonts_used_in_templates[ $template_slug ];
		self::$webfonts_used_in_front_end = array_merge( self::$webfonts_used_in_front_end, $webfonts_used_in_template );
	}

	/**
	 * Get webfonts used in the template.
	 *
	 * @param string $template_content The template content.
	 *
	 * @return array
	 */
	private function get_fonts_from_template( $template_content ) {
		$webfonts_used_in_template = array();

		$template_blocks = parse_blocks( $template_content );
		$template_blocks = _flatten_blocks( $template_blocks );

		foreach ( $template_blocks as $block ) {
			if ( 'core/template-part' === $block['blockName'] ) {
				$template_part          = get_block_template( get_stylesheet() . '//' . $block['attrs']['slug'], 'wp_template_part' );
				$fonts_in_template_part = $this->get_fonts_from_template( $template_part->content );

				$webfonts_used_in_template = array_merge(
					$webfonts_used_in_template,
					$fonts_in_template_part
				);
			}

			if ( isset( $block['attrs']['fontFamily'] ) ) {
				$used_webfonts[ $block['attrs']['fontFamily'] ] = 1;
			}
		}

		return $webfonts_used_in_template;
	}

	/**
	 * Update webfonts used in global styles cache.
	 */
	public function update_webfonts_used_in_global_styles_cache() {
		$webfonts_used_in_global_styles = $this->get_webfonts_used_in_global_styles();
		update_option( self::$webfonts_used_in_global_styles_cache_option, $webfonts_used_in_global_styles );

		return $webfonts_used_in_global_styles;
	}

	/**
	 * Grab the webfonts used in global styles and include them
	 * in the set of all the webfonts used in the front-end.
	 */
	public function collect_webfonts_used_in_global_styles() {
		$webfonts_used_in_global_styles = get_option( self::$webfonts_used_in_global_styles_cache_option );

		if ( ! $webfonts_used_in_global_styles ) {
			$webfonts_used_in_global_styles = $this->update_webfonts_used_in_global_styles_cache();
		}

		self::$webfonts_used_in_front_end = array_merge( self::$webfonts_used_in_front_end, $webfonts_used_in_global_styles );
	}

	/**
	 * Get globally used webfonts.
	 *
	 * @return array
	 */
	private function get_webfonts_used_in_global_styles() {
		$global_styles                  = gutenberg_get_global_styles();
		$webfonts_used_in_global_styles = array();

		if ( isset( $global_styles['blocks'] ) ) {
			// Register used fonts from blocks.
			foreach ( $global_styles['blocks'] as $setting ) {
				$font_family_slug = $this->get_font_family_from_setting( $setting );

				if ( $font_family_slug ) {
					$webfonts_used_in_global_styles[ $font_family_slug ] = 1;
				}
			}
		}

		if ( isset( $global_styles['elements'] ) ) {
			// Register used fonts from elements.
			foreach ( $global_styles['elements'] as $setting ) {
				$font_family_slug = $this->get_font_family_from_setting( $setting );

				if ( $font_family_slug ) {
					$webfonts_used_in_global_styles[ $font_family_slug ] = 1;
				}
			}
		}

		// Get global font.
		$font_family_slug = $this->get_font_family_from_setting( $global_styles );

		if ( $font_family_slug ) {
			$webfonts_used_in_global_styles[ $font_family_slug ] = 1;
		}

		return $webfonts_used_in_global_styles;
	}

	/**
	 * Get font family from global setting.
	 *
	 * @param mixed $setting The global setting.
	 * @return string|false
	 */
	private function get_font_family_from_setting( $setting ) {
		if ( isset( $setting['typography'] ) && isset( $setting['typography']['fontFamily'] ) ) {
			$font_family = $setting['typography']['fontFamily'];

			preg_match( '/var\(--wp--(?:preset|custom)--font-family--([^\\\]+)\)/', $font_family, $matches );

			if ( isset( $matches[1] ) ) {
				return _wp_to_kebab_case( $matches[1] );
			}

			preg_match( '/var:(?:preset|custom)\|font-family\|(.+)/', $font_family, $matches );

			if ( isset( $matches[1] ) ) {
				return _wp_to_kebab_case( $matches[1] );
			}
		}

		return false;
	}

	/**
	 * Get the list of fonts.
	 *
	 * @return array
	 */
	public function get_fonts() {
		return self::$webfonts;
	}

	/**
	 * Get the list of providers.
	 *
	 * @return array
	 */
	public function get_providers() {
		return self::$providers;
	}

	/**
	 * Register a webfont.
	 *
	 * @param array $font The font arguments.
	 */
	public function register_font( $font ) {
		$font = $this->validate_font( $font );
		if ( $font ) {
			$id                    = $this->get_font_id( $font );
			self::$webfonts[ $id ] = $font;
		}
	}

	/**
	 * Get the font ID.
	 *
	 * @param array $font The font arguments.
	 * @return string
	 */
	public function get_font_id( $font ) {
		return sanitize_title( "{$font['font-family']}-{$font['font-weight']}-{$font['font-style']}-{$font['provider']}" );
	}

	/**
	 * Validate a font.
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
	 * @param string $provider The provider name.
	 * @param string $class    The provider class name.
	 *
	 * @return bool Whether the provider was registered successfully.
	 */
	public function register_provider( $provider, $class ) {
		if ( empty( $provider ) || empty( $class ) ) {
			return false;
		}
		self::$providers[ $provider ] = $class;
		return true;
	}

	/**
	 * Filter out webfonts that are not being used by the front-end.
	 *
	 * @return void
	 */
	private function filter_out_webfonts_unused_in_front_end() {
		$all_registered_fonts = $this->get_fonts();
		$picked_webfonts      = array();

		self::$webfonts_used_in_front_end = apply_filters( 'gutenberg_webfonts_used_in_front_end', self::$webfonts_used_in_front_end );

		foreach ( $all_registered_fonts as $id => $webfont ) {
			$font_name = _wp_to_kebab_case( $webfont['font-family'] );

			if ( isset( self::$webfonts_used_in_front_end[ $font_name ] ) ) {
				$picked_webfonts[ $id ] = $webfont;
			}
		}

		self::$webfonts = $picked_webfonts;
	}

	/**
	 * Generate and enqueue webfonts styles.
	 */
	public function generate_and_enqueue_styles() {
		$this->filter_out_webfonts_unused_in_front_end();

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

		// Group webfonts by provider.
		$webfonts_by_provider = array();
		$registered_webfonts  = $this->get_fonts();
		foreach ( $registered_webfonts as $id => $webfont ) {
			$provider = $webfont['provider'];
			if ( ! isset( $providers[ $provider ] ) ) {
				/* translators: %s is the provider name. */
				error_log( sprintf( __( 'Webfont provider "%s" is not registered.', 'gutenberg' ), $provider ) );
				continue;
			}
			$webfonts_by_provider[ $provider ]        = isset( $webfonts_by_provider[ $provider ] ) ? $webfonts_by_provider[ $provider ] : array();
			$webfonts_by_provider[ $provider ][ $id ] = $webfont;
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
