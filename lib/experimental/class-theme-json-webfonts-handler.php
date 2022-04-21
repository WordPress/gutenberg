<?php
/**
 * Handler for theme.json webfonts.
 *
 * @since      6.0.0
 * @subpackage WebFonts
 * @package    WordPress
 */

if ( ! function_exists( '_wp_theme_json_webfonts_handler' ) ) {
	add_action( 'plugins_loaded', '_wp_theme_json_webfonts_handler' );
	/**
	 * Runs the theme.json webfonts handler to expose defined webfonts
	 * to the editor's typography pickers and generate '@font-face' style
	 * declarations.
	 *
	 * This is not a public API, but rather an internal handler.
	 * A future public Webfonts API will replace this code.
	 *
	 * This code design is intentional to encapsulate the inner-workings
	 * of this handler to ensure it is not accessible from outside of this
	 * function. Why? This is a stopgap implementation to provide the mechanisms
	 * for webfonts to be defined in a theme's `theme.json` file for style
	 * variations.
	 *
	 * @link  https://github.com/WordPress/gutenberg/issues/40472
	 *
	 * @since 6.0.0
	 */
	function _wp_theme_json_webfonts_handler() {
		// Webfonts to be processed.
		$registered_webfonts = array();

		/**
		 * Gets the webfonts from theme.json.
		 *
		 * @since 6.0.0
		 *
		 * @return array Array of defined webfonts.
		 */
		$fn_get_webfonts_from_theme_json = static function() {
			// Get settings from theme.json.
			$settings = WP_Theme_JSON_Resolver_6_0::get_merged_data()->get_settings();

			// If in the editor, add webfonts defined in variations.
			if ( is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
				$variations = WP_Theme_JSON_Resolver_6_0::get_style_variations();
				foreach ( $variations as $variation ) {
					// Skip if fontFamilies are not defined in the variation.
					if (
						empty( $variation['settings'] ) ||
						empty( $variation['settings']['typography'] ) ||
						empty( $variation['settings']['typography']['fontFamilies'] )
					) {
						continue;
					}

					$settings['typography']                          = empty( $settings['typography'] ) ? array() : $settings['typography'];
					$settings['typography']['fontFamilies']          = empty( $settings['typography']['fontFamilies'] ) ? array() : $settings['typography']['fontFamilies'];
					$settings['typography']['fontFamilies']['theme'] = empty( $settings['typography']['fontFamilies'] ) ? array() : $settings['typography']['fontFamilies']['theme'];
					$settings['typography']['fontFamilies']['theme'] = array_merge( $settings['typography']['fontFamilies']['theme'], $variation['settings']['typography']['fontFamilies']['theme'] );

					// Make sure there are no duplicates.
					$settings['typography']['fontFamilies'] = array_unique( $settings['typography']['fontFamilies'] );
				}
			}

			// Bail out early if there are no settings for webfonts.
			if ( empty( $settings['typography'] ) || empty( $settings['typography']['fontFamilies'] ) ) {
				return array();
			}

			$webfonts = array();

			// Look for fontFamilies.
			foreach ( $settings['typography']['fontFamilies'] as $font_families ) {
				foreach ( $font_families as $font_family ) {

					// Skip if fontFace is not defined.
					if ( empty( $font_family['fontFace'] ) ) {
						continue;
					}

					// Skip if fontFace is not an array of webfonts.
					if ( ! is_array( $font_family['fontFace'] ) ) {
						continue;
					}

					$webfonts = array_merge( $webfonts, $font_family['fontFace'] );
				}
			}

			return $webfonts;
		};

		/**
		 * Transforms each 'src' into an URI by replacing 'file:./'
		 * placeholder from theme.json.
		 *
		 * The absolute path to the webfont file(s) cannot be defined in
		 * theme.json. `file:./` is the placeholder which is replaced by
		 * the theme's URL path to the theme's root.
		 *
		 * @since 6.0.0
		 *
		 * @param array $src Webfont file(s) `src`.
		 * @return array Webfont's `src` in URI.
		 */
		$fn_transform_src_into_uri = static function( array $src ) {
			foreach ( $src as $key => $url ) {
				// Tweak the URL to be relative to the theme root.
				if ( ! str_starts_with( $url, 'file:./' ) ) {
					continue;
				}

				$src[ $key ] = get_theme_file_uri( str_replace( 'file:./', '', $url ) );
			}

			return $src;
		};

		/**
		 * Converts the font-face properties (i.e. keys) into kebab-case.
		 *
		 * @since 6.0.0
		 *
		 * @param array $font_face Font face to convert.
		 * @return array Font faces with each property in kebab-case format.
		 */
		$fn_convert_keys_to_kebab_case = static function( array $font_face ) {
			foreach ( $font_face as $property => $value ) {
				$kebab_case               = _wp_to_kebab_case( $property );
				$font_face[ $kebab_case ] = $value;
				if ( $kebab_case !== $property ) {
					unset( $font_face[ $property ] );
				}
			}

			return $font_face;
		};

		/**
		 * Validates a webfont.
		 *
		 * @since 6.0.0
		 *
		 * @param array $webfont The webfont arguments.
		 * @return array|false The validated webfont arguments, or false if the webfont is invalid.
		 */
		$fn_validate_webfont = static function( $webfont ) {
			$webfont = wp_parse_args(
				$webfont,
				array(
					'font-family'  => '',
					'font-style'   => 'normal',
					'font-weight'  => '400',
					'font-display' => 'fallback',
					'src'          => array(),
				)
			);

			// Check the font-family.
			if ( empty( $webfont['font-family'] ) || ! is_string( $webfont['font-family'] ) ) {
				trigger_error( __( 'Webfont font family must be a non-empty string.', 'gutenberg' ) );

				return false;
			}

			// Check that the `src` property is defined and a valid type.
			if ( empty( $webfont['src'] ) || ( ! is_string( $webfont['src'] ) && ! is_array( $webfont['src'] ) ) ) {
				trigger_error( __( 'Webfont src must be a non-empty string or an array of strings.', 'gutenberg' ) );

				return false;
			}

			// Validate the `src` property.
			foreach ( (array) $webfont['src'] as $src ) {
				if ( ! is_string( $src ) || '' === trim( $src ) ) {
					trigger_error( __( 'Each webfont src must be a non-empty string.', 'gutenberg' ) );

					return false;
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
			);

			foreach ( $webfont as $prop => $value ) {
				if ( ! in_array( $prop, $valid_props, true ) ) {
					unset( $webfont[ $prop ] );
				}
			}

			return $webfont;
		};

		/**
		 * Registers webfonts declared in theme.json.
		 *
		 * @since 6.0.0
		 *
		 * @uses $registered_webfonts To access and update the registered webfonts registry (passed by reference).
		 * @uses $fn_get_webfonts_from_theme_json To run the function that gets the webfonts from theme.json.
		 * @uses $fn_convert_keys_to_kebab_case To run the function that converts keys into kebab-case.
		 * @uses $fn_validate_webfont To run the function that validates each font-face (webfont) from theme.json.
		 */
		$fn_register_webfonts = static function() use ( &$registered_webfonts, $fn_get_webfonts_from_theme_json, $fn_convert_keys_to_kebab_case, $fn_validate_webfont, $fn_transform_src_into_uri ) {
			$registered_webfonts = array();

			foreach ( $fn_get_webfonts_from_theme_json() as $webfont ) {
				if ( ! is_array( $webfont ) ) {
					continue;
				}

				$webfont = $fn_convert_keys_to_kebab_case( $webfont );

				$webfont = $fn_validate_webfont( $webfont );

				$webfont['src'] = $fn_transform_src_into_uri( (array) $webfont['src'] );

				// Skip if not valid.
				if ( empty( $webfont ) ) {
					continue;
				}

				$registered_webfonts[] = $webfont;
			}
		};

		/**
		 * Orders 'src' items to optimize for browser support.
		 *
		 * @since 6.0.0
		 *
		 * @param array $webfont Webfont to process.
		 * @return array Ordered `src` items.
		 */
		$fn_order_src = static function( array $webfont ) {
			$src         = array();
			$src_ordered = array();

			foreach ( $webfont['src'] as $url ) {
				// Add data URIs first.
				if ( str_starts_with( trim( $url ), 'data:' ) ) {
					$src_ordered[] = array(
						'url'    => $url,
						'format' => 'data',
					);
					continue;
				}
				$format         = pathinfo( $url, PATHINFO_EXTENSION );
				$src[ $format ] = $url;
			}

			// Add woff2.
			if ( ! empty( $src['woff2'] ) ) {
				$src_ordered[] = array(
					'url'    => sanitize_url( $src['woff2'] ),
					'format' => 'woff2',
				);
			}

			// Add woff.
			if ( ! empty( $src['woff'] ) ) {
				$src_ordered[] = array(
					'url'    => sanitize_url( $src['woff'] ),
					'format' => 'woff',
				);
			}

			// Add ttf.
			if ( ! empty( $src['ttf'] ) ) {
				$src_ordered[] = array(
					'url'    => sanitize_url( $src['ttf'] ),
					'format' => 'truetype',
				);
			}

			// Add eot.
			if ( ! empty( $src['eot'] ) ) {
				$src_ordered[] = array(
					'url'    => sanitize_url( $src['eot'] ),
					'format' => 'embedded-opentype',
				);
			}

			// Add otf.
			if ( ! empty( $src['otf'] ) ) {
				$src_ordered[] = array(
					'url'    => sanitize_url( $src['otf'] ),
					'format' => 'opentype',
				);
			}
			$webfont['src'] = $src_ordered;

			return $webfont;
		};

		/**
		 * Compiles the 'src' into valid CSS.
		 *
		 * @since 6.0.0
		 *
		 * @param string $font_family Font family.
		 * @param array  $value       Value to process.
		 * @return string The CSS.
		 */
		$fn_compile_src = static function( $font_family, array $value ) {
			$src = "local($font_family)";

			foreach ( $value as $item ) {

				if (
					str_starts_with( $item['url'], site_url() ) ||
					str_starts_with( $item['url'], home_url() )
				) {
					$item['url'] = wp_make_link_relative( $item['url'] );
				}

				$src .= ( 'data' === $item['format'] )
					? ", url({$item['url']})"
					: ", url('{$item['url']}') format('{$item['format']}')";
			}

			return $src;
		};

		/**
		 * Compiles the font variation settings.
		 *
		 * @since 6.0.0
		 *
		 * @param array $font_variation_settings Array of font variation settings.
		 * @return string The CSS.
		 */
		$fn_compile_variations = static function( array $font_variation_settings ) {
			$variations = '';

			foreach ( $font_variation_settings as $key => $value ) {
				$variations .= "$key $value";
			}

			return $variations;
		};

		/**
		 * Builds the font-family's CSS.
		 *
		 * @since 6.0.0
		 *
		 * @uses $fn_compile_src To run the function that compiles the src.
		 * @uses $fn_compile_variations To run the function that compiles the variations.
		 *
		 * @param array $webfont Webfont to process.
		 * @return string This font-family's CSS.
		 */
		$fn_build_font_face_css = static function( array $webfont ) use ( $fn_compile_src, $fn_compile_variations ) {
			$css = '';

			// Wrap font-family in quotes if it contains spaces.
			if (
				str_contains( $webfont['font-family'], ' ' ) &&
				! str_contains( $webfont['font-family'], '"' ) &&
				! str_contains( $webfont['font-family'], "'" )
			) {
				$webfont['font-family'] = '"' . $webfont['font-family'] . '"';
			}

			foreach ( $webfont as $key => $value ) {
				/*
				 * Skip "provider", since it's for internal API use,
				 * and not a valid CSS property.
				 */
				if ( 'provider' === $key ) {
					continue;
				}

				// Compile the "src" parameter.
				if ( 'src' === $key ) {
					$value = $fn_compile_src( $webfont['font-family'], $value );
				}

				// If font-variation-settings is an array, convert it to a string.
				if ( 'font-variation-settings' === $key && is_array( $value ) ) {
					$value = $fn_compile_variations( $value );
				}

				if ( ! empty( $value ) ) {
					$css .= "$key:$value;";
				}
			}

			return $css;
		};

		/**
		 * Gets the '@font-face' CSS styles for locally-hosted font files.
		 *
		 * @since 6.0.0
		 *
		 * @uses $registered_webfonts To access and update the registered webfonts registry (passed by reference).
		 * @uses $fn_order_src To run the function that orders the src.
		 * @uses $fn_build_font_face_css To run the function that builds the font-face CSS.
		 *
		 * @return string The `@font-face` CSS.
		 */
		$fn_get_css = static function() use ( &$registered_webfonts, $fn_order_src, $fn_build_font_face_css ) {
			$css = '';

			foreach ( $registered_webfonts as $webfont ) {
				// Order the webfont's `src` items to optimize for browser support.
				$webfont = $fn_order_src( $webfont );

				// Build the @font-face CSS for this webfont.
				$css .= '@font-face{' . $fn_build_font_face_css( $webfont ) . '}';
			}

			return $css;
		};

		/**
		 * Generates and enqueues webfonts styles.
		 *
		 * @since 6.0.0
		 *
		 * @uses $fn_get_css To run the function that gets the CSS.
		 */
		$fn_generate_and_enqueue_styles = static function() use ( $fn_get_css ) {
			// Generate the styles.
			$styles = $fn_get_css();

			// Bail out if there are no styles to enqueue.
			if ( '' === $styles ) {
				return;
			}

			// Enqueue the stylesheet.
			wp_register_style( 'wp-webfonts', '' );
			wp_enqueue_style( 'wp-webfonts' );

			// Add the styles to the stylesheet.
			wp_add_inline_style( 'wp-webfonts', $styles );
		};

		/**
		 * Generates and enqueues editor styles.
		 *
		 * @since 6.0.0
		 *
		 * @uses $fn_get_css To run the function that gets the CSS.
		 */
		$fn_generate_and_enqueue_editor_styles = static function() use ( $fn_get_css ) {
			// Generate the styles.
			$styles = $fn_get_css();

			// Bail out if there are no styles to enqueue.
			if ( '' === $styles ) {
				return;
			}

			wp_add_inline_style( 'wp-block-library', $styles );
		};

		/**
		 * Adds webfonts mime types.
		 *
		 * @since 6.0.0
		 *
		 * @param array $mime_types Array of mime types.
		 * @return array Mime types with webfonts formats.
		 */
		$fn_add_mime_types = static function( $mime_types ) {
			// Webfonts formats.
			$mime_types['woff2'] = 'font/woff2';
			$mime_types['woff']  = 'font/woff';
			$mime_types['ttf']   = 'font/ttf';
			$mime_types['eot']   = 'application/vnd.ms-fontobject';
			$mime_types['otf']   = 'application/x-font-opentype';

			return $mime_types;
		};

		add_action( 'wp_loaded', $fn_register_webfonts );
		add_action( 'wp_enqueue_scripts', $fn_generate_and_enqueue_styles );
		add_action( 'admin_init', $fn_generate_and_enqueue_editor_styles );
		add_filter( 'mime_types', $fn_add_mime_types );
	}
}
