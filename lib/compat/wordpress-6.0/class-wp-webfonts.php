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
	 * The name of the theme mod that stores the template webfonts cache.
	 *
	 * @static
	 * @access private
	 * @var string
	 */
	private static $template_webfonts_cache_theme_mod = 'template_webfonts';

	/**
	 * The name of the meta attribute that stores the post's webfonts cache.
	 *
	 * @static
	 * @access private
	 * @var string
	 */
	private static $webfonts_cache_meta_attribute = '_webfonts';

	/**
	 * An array of registered webfonts.
	 *
	 * @access private
	 * @var array
	 */
	private $registered_webfonts = array();

	/**
	 * An array of enqueued webfonts.
	 *
	 * @access private
	 * @var array
	 */
	private $enqueued_webfonts = array();

	/**
	 * An array of registered providers.
	 *
	 * @access private
	 * @var array
	 */
	private $providers = array();

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
		add_action( $hook, array( $this, 'generate_and_enqueue_styles' ) );

		add_action( 'init', array( $this, 'register_filter_for_current_template_webfonts_enqueuing' ) );
		add_action( 'wp_loaded', array( $this, 'enqueue_webfonts_used_in_global_styles' ) );

		add_action( 'save_post_wp_template', array( $this, 'invalidate_template_webfonts_cache' ) );
		add_action( 'save_post_wp_template_part', array( $this, 'invalidate_template_webfonts_cache' ) );
		add_action( 'save_post_wp_global_styles', array( $this, 'invalidate_global_styles_webfonts_cache' ) );

		// Enqueue webfonts in the block editor.
		add_action( 'admin_init', array( $this, 'generate_and_enqueue_editor_styles' ) );
	}

	/**
	 * Invalidate global styles webfonts cache.
	 */
	public function invalidate_global_styles_webfonts_cache() {
		$global_styles_post_id = WP_Theme_JSON_Resolver_Gutenberg::get_user_global_styles_post_id();

		delete_post_meta( $global_styles_post_id, self::$webfonts_cache_meta_attribute );
	}

	/**
	 * Enqueue the webfonts used in global styles by scanning the settings.
	 */
	public function enqueue_webfonts_used_in_global_styles() {
		$global_styles_post_id = WP_Theme_JSON_Resolver_Gutenberg::get_user_global_styles_post_id();

		$webfonts_used_in_global_styles = get_post_meta( $global_styles_post_id, self::$webfonts_cache_meta_attribute, true );

		if ( ! $webfonts_used_in_global_styles ) {
			$webfonts_used_in_global_styles = $this->collect_webfonts_used_in_global_styles();

			if ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) {
				update_post_meta( $global_styles_post_id, self::$webfonts_cache_meta_attribute, $webfonts_used_in_global_styles );
			}
		}

		$font_slugs = array_keys( $webfonts_used_in_global_styles );

		foreach ( $font_slugs as $font_slug ) {
			$this->enqueue_fonts_by_theme_json_slug( $font_slug );
		}
	}

	/**
	 * Collect globally used webfonts.
	 *
	 * @return array
	 */
	private function collect_webfonts_used_in_global_styles() {
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

			preg_match( '/var\(--wp--(?:preset|custom)--font-family--(?P<slug>.+)\)/', $font_family, $matches );

			if ( isset( $matches['slug'] ) ) {
				return _wp_to_kebab_case( $matches['slug'] );
			}

			preg_match( '/var:(?:preset|custom)\|font-family\|(?P<slug>.+)/', $font_family, $matches );

			if ( isset( $matches['slug'] ) ) {
				return _wp_to_kebab_case( $matches['slug'] );
			}
		}

		return false;
	}

	/**
	 * Invalidate template webfonts cache.
	 */
	public function invalidate_template_webfonts_cache() {
		remove_theme_mod( self::$template_webfonts_cache_theme_mod );
	}

	/**
	 * Hook into every possible template so we can enqueue the webfonts used in the template
	 * that has been loaded in the front-end.
	 */
	public function register_filter_for_current_template_webfonts_enqueuing() {
		$template_type_slugs = array_keys( get_default_block_template_types() );

		foreach ( $template_type_slugs as $template_type_slug ) {
			add_filter(
				str_replace( '-', '', $template_type_slug ) . '_template',
				array( $this, 'enqueue_webfonts_used_in_template' ),
				10,
				2
			);
		}
	}

	/**
	 * Enqueue the webfonts used in the template by scanning the blocks.
	 *
	 * @param string $template_path The current template path.
	 * @param string $template_slug The current template slug.
	 *
	 * @return void
	 */
	public function enqueue_webfonts_used_in_template( $template_path, $template_slug ) {
		global $_wp_current_template_content;

		$webfonts_used_in_templates = get_theme_mod( self::$template_webfonts_cache_theme_mod, array() );

		if ( ! isset( $webfonts_used_in_templates[ $template_slug ] ) ) {
			$webfonts_used_in_templates[ $template_slug ] = $this->collect_fonts_from_template( $_wp_current_template_content );

			if ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) {
				set_theme_mod( self::$template_webfonts_cache_theme_mod, $webfonts_used_in_templates );
			}
		}

		$font_slugs = array_keys( $webfonts_used_in_templates[ $template_slug ] );

		foreach ( $font_slugs as $font_slug ) {
			$this->enqueue_fonts_by_theme_json_slug( $font_slug );
		}
	}

	/**
	 * When picking a font family in the editor, it is saved
	 * as a block attribute called `fontFamily.slug`.
	 *
	 * A font family could have several @font-face declarations,
	 * and we are registering each @font-face individually.
	 * Those declarations are put together in the theme.json file.
	 *
	 * But this class does not have any information the font slugs
	 * since the process of adding the fonts to the editor is done elsewhere.
	 *
	 * So, to enqueue a registered webfont that was picked in the editor,
	 * we must reach it by the slug first. This is what this function does.
	 *
	 * @param string $font_slug The slug of the font-family to enqueue.
	 */
	private function enqueue_fonts_by_theme_json_slug( $font_slug ) {
		// Get settings from theme.json.
		$theme_settings = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_settings();

		// Bail out early if there are no settings for webfonts.
		if ( empty( $theme_settings['typography'] ) || empty( $theme_settings['typography']['fontFamilies'] ) ) {
			return;
		}

		foreach ( $theme_settings['typography']['fontFamilies'] as $font_families ) {
			foreach ( $font_families as $font_family ) {
				if ( $font_slug !== $font_family['slug'] || ! isset( $font_family['fontFace'] ) ) {
					continue;
				}

				foreach ( $font_family['fontFace'] as $webfont ) {
					if ( ! isset( $webfont['id'] ) ) {
						continue;
					}

					$id = $webfont['id'];

					if ( isset( $this->registered_webfonts[ $id ] ) && ! isset( $this->enqueued_webfonts[ $id ] ) ) {
						$this->enqueue_font( $id );
					}
				}
			}
		}
	}

	/**
	 * Collect webfonts used in the template.
	 *
	 * @param string $template_content The template content.
	 *
	 * @return array
	 */
	private function collect_fonts_from_template( $template_content ) {
		$webfonts_used_in_template = array();

		$template_blocks = parse_blocks( $template_content );
		$template_blocks = _flatten_blocks( $template_blocks );

		foreach ( $template_blocks as $block ) {
			if ( 'core/template-part' === $block['blockName'] ) {
				$template_part          = get_block_template( get_stylesheet() . '//' . $block['attrs']['slug'], 'wp_template_part' );
				$fonts_in_template_part = $this->collect_fonts_from_template( $template_part->content );

				$webfonts_used_in_template = array_merge(
					$webfonts_used_in_template,
					$fonts_in_template_part
				);
			}

			if ( isset( $block['attrs']['fontFamily'] ) ) {
				$webfonts_used_in_template[ $block['attrs']['fontFamily'] ] = 1;
			}
		}

		return $webfonts_used_in_template;
	}

	/**
	 * Get the list of registered fonts.
	 *
	 * @return array
	 */
	public function get_registered_fonts() {
		return $this->registered_webfonts;
	}

	/**
	 * Get the list of enqueued fonts.
	 *
	 * @return array
	 */
	public function get_enqueued_fonts() {
		return $this->enqueued_webfonts;
	}

	/**
	 * Get the list of providers.
	 *
	 * @return array
	 */
	public function get_providers() {
		return $this->providers;
	}

	/**
	 * Register a webfont.
	 *
	 * @param string $id The unique identifier for the webfont.
	 * @param array  $font The font arguments.
	 */
	public function register_font( $id, $font ) {
		if ( ! $id ) {
			trigger_error( __( 'An ID is necessary when registering a webfont.', 'gutenberg' ) );
			return false;
		}

		if ( isset( $this->registered_webfonts[ $id ] ) ) {
			return;
		}

		$font['id'] = $id;
		$font       = $this->validate_font( $font );

		if ( $font ) {
			$this->registered_webfonts[ $id ] = $font;
		}
	}

	/**
	 * Enqueue a webfont.
	 *
	 * @param string     $id The unique identifier for the webfont.
	 * @param array|null $font The font arguments.
	 */
	public function enqueue_font( $id, $font = null ) {
		if ( ! $id ) {
			trigger_error( __( 'An ID is necessary when enqueueing a webfont.', 'gutenberg' ) );
			return false;
		}

		if ( isset( $this->enqueued_webfonts[ $id ] ) ) {
			return;
		}

		if ( $font ) {
			$font['id'] = $id;
			$font       = $this->validate_font( $font );

			$this->enqueued_webfonts[ $id ] = $font;

			if ( isset( $this->registered_webfonts[ $id ] ) ) {
				unset( $this->registered_webfonts[ $id ] );
			}
		} elseif ( isset( $this->registered_webfonts[ $id ] ) ) {
			$this->enqueued_webfonts[ $id ] = $this->registered_webfonts[ $id ];

			unset( $this->registered_webfonts[ $id ] );
		} else {
			trigger_error( __( 'The given webfont ID is not registered, therefore the webfont cannot be enqueued.', 'gutenberg' ) );
		}
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
			'id',
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
		$this->providers[ $provider ] = $class;
		return true;
	}

	/**
	 * Generate and enqueue webfonts styles.
	 */
	public function generate_and_enqueue_styles() {
		// Generate the styles.
		$styles = $this->generate_styles( $this->get_enqueued_fonts() );

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
	 * Returns a list of registered and enqueued webfonts.
	 * We need this so all webfonts show up in the editor,
	 * regardless of their state.
	 */
	public function get_all_webfonts() {
		return array_merge( $this->get_registered_fonts(), $this->get_enqueued_fonts() );
	}

	/**
	 * Generate and enqueue editor styles.
	 */
	public function generate_and_enqueue_editor_styles() {
		// Generate the styles.
		$styles = $this->generate_styles( $this->get_all_webfonts() );

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
	 * @param array $webfonts The fonts that are going to the output.
	 *
	 * @return string $styles Generated styles.
	 */
	public function generate_styles( $webfonts ) {
		$styles    = '';
		$providers = $this->get_providers();

		// Group webfonts by provider.
		$webfonts_by_provider = array();
		foreach ( $webfonts as $id => $webfont ) {
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
