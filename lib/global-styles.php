<?php
/**
 * Bootstraps Global Styles.
 *
 * @package gutenberg
 */

/**
 * Fetches the preferences for each origin (core, theme, user)
 * and enqueues the resulting stylesheet.
 */
function gutenberg_experimental_global_styles_enqueue_assets() {
	$stylesheet = wp_get_global_stylesheet();
	if ( empty( $stylesheet ) ) {
		return;
	}

	if ( isset( wp_styles()->registered['global-styles'] ) ) {
		wp_styles()->registered['global-styles']->extra['after'][0] = $stylesheet;
	} else {
		wp_register_style( 'global-styles', false, array(), true, true );
		wp_add_inline_style( 'global-styles', $stylesheet );
		wp_enqueue_style( 'global-styles' );
	}
}

/**
 * Adds the necessary settings for the Global Styles client UI.
 *
 * @param array $settings Existing block editor settings.
 *
 * @return array New block editor settings.
 */
function gutenberg_experimental_global_styles_settings( $settings ) {
	// Set what is the context for this data request.
	$context = 'other';
	if (
		is_callable( 'get_current_screen' ) &&
		function_exists( 'gutenberg_is_edit_site_page' ) &&
		gutenberg_is_edit_site_page( get_current_screen()->id )
	) {
		$context = 'site-editor';
	}

	if (
		defined( 'REST_REQUEST' ) &&
		REST_REQUEST &&
		isset( $_GET['context'] ) &&
		'mobile' === $_GET['context']
	) {
		$context = 'mobile';
	}

	if ( 'mobile' === $context && WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
		$settings['__experimentalStyles'] = wp_get_global_styles();
	}

	if ( 'other' === $context ) {
		// Make sure the styles array exists.
		// In some contexts, like the navigation editor, it doesn't.
		if ( ! isset( $settings['styles'] ) ) {
			$settings['styles'] = array();
		}

		// Reset existing global styles.
		$styles_without_existing_global_styles = array();
		foreach ( $settings['styles'] as $style ) {
			if ( ! isset( $style['__unstableType'] ) || 'globalStyles' !== $style['__unstableType'] ) {
				$styles_without_existing_global_styles[] = $style;
			}
		}

		$new_global_styles = array();
		$new_presets       = array(
			array(
				'css'                     => 'variables',
				'__unstableType'          => 'presets',
				'__experimentalNoWrapper' => true,
			),
			array(
				'css'            => 'presets',
				'__unstableType' => 'presets',
			),
		);
		foreach ( $new_presets as $new_style ) {
			$style_css = wp_get_global_stylesheet( array( $new_style['css'] ) );
			if ( '' !== $style_css ) {
				$new_style['css']    = $style_css;
				$new_global_styles[] = $new_style;
			}
		}

		$new_block_classes = array(
			'css'            => 'styles',
			'__unstableType' => 'theme',
		);
		if ( WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
			$style_css = wp_get_global_stylesheet( array( $new_block_classes['css'] ) );
			if ( '' !== $style_css ) {
				$new_block_classes['css'] = $style_css;
				$new_global_styles[]      = $new_block_classes;
			}
		}

		$settings['styles'] = array_merge( $styles_without_existing_global_styles, $new_global_styles );
	}

	// Copied from get_block_editor_settings() at wordpress-develop/block-editor.php.
	$settings['__experimentalFeatures'] = wp_get_global_settings();

	if ( isset( $settings['__experimentalFeatures']['color']['palette'] ) ) {
		$colors_by_origin   = $settings['__experimentalFeatures']['color']['palette'];
		$settings['colors'] = isset( $colors_by_origin['custom'] ) ?
			$colors_by_origin['custom'] : (
				isset( $colors_by_origin['theme'] ) ?
					$colors_by_origin['theme'] :
					$colors_by_origin['default']
			);
	}

	if ( isset( $settings['__experimentalFeatures']['color']['gradients'] ) ) {
		$gradients_by_origin   = $settings['__experimentalFeatures']['color']['gradients'];
		$settings['gradients'] = isset( $gradients_by_origin['custom'] ) ?
			$gradients_by_origin['custom'] : (
				isset( $gradients_by_origin['theme'] ) ?
					$gradients_by_origin['theme'] :
					$gradients_by_origin['default']
			);
	}

	if ( isset( $settings['__experimentalFeatures']['typography']['fontSizes'] ) ) {
		$font_sizes_by_origin  = $settings['__experimentalFeatures']['typography']['fontSizes'];
		$settings['fontSizes'] = isset( $font_sizes_by_origin['custom'] ) ?
			$font_sizes_by_origin['user'] : (
				isset( $font_sizes_by_origin['theme'] ) ?
					$font_sizes_by_origin['theme'] :
					$font_sizes_by_origin['default']
			);
	}

	if ( isset( $settings['__experimentalFeatures']['color']['custom'] ) ) {
		$settings['disableCustomColors'] = ! $settings['__experimentalFeatures']['color']['custom'];
		unset( $settings['__experimentalFeatures']['color']['custom'] );
	}
	if ( isset( $settings['__experimentalFeatures']['color']['customGradient'] ) ) {
		$settings['disableCustomGradients'] = ! $settings['__experimentalFeatures']['color']['customGradient'];
		unset( $settings['__experimentalFeatures']['color']['customGradient'] );
	}
	if ( isset( $settings['__experimentalFeatures']['typography']['customFontSize'] ) ) {
		$settings['disableCustomFontSizes'] = ! $settings['__experimentalFeatures']['typography']['customFontSize'];
		unset( $settings['__experimentalFeatures']['typography']['customFontSize'] );
	}
	if ( isset( $settings['__experimentalFeatures']['typography']['lineHeight'] ) ) {
		$settings['enableCustomLineHeight'] = $settings['__experimentalFeatures']['typography']['lineHeight'];
		unset( $settings['__experimentalFeatures']['typography']['lineHeight'] );
	}
	if ( isset( $settings['__experimentalFeatures']['spacing']['units'] ) ) {
		$settings['enableCustomUnits'] = $settings['__experimentalFeatures']['spacing']['units'];
	}
	if ( isset( $settings['__experimentalFeatures']['spacing']['padding'] ) ) {
		$settings['enableCustomSpacing'] = $settings['__experimentalFeatures']['spacing']['padding'];
		unset( $settings['__experimentalFeatures']['spacing']['padding'] );
	}

	return $settings;
}

/**
 * Whether or not the Site Editor is available.
 *
 * @return boolean
 */
function gutenberg_experimental_is_site_editor_available() {
	return gutenberg_is_fse_theme();
}

/**
 * Register CPT to store/access user data.
 *
 * @return void
 */
function gutenberg_experimental_global_styles_register_user_cpt() {
	if ( gutenberg_experimental_is_site_editor_available() ) {
		register_global_styles_custom_post_type();
	}
}

/**
 * Sanitizes global styles user content removing unsafe rules.
 *
 * @param string $content Post content to filter.
 * @return string Filtered post content with unsafe rules removed.
 */
function gutenberg_global_styles_filter_post( $content ) {
	$decoded_data        = json_decode( wp_unslash( $content ), true );
	$json_decoding_error = json_last_error();
	if (
		JSON_ERROR_NONE === $json_decoding_error &&
		is_array( $decoded_data ) &&
		isset( $decoded_data['isGlobalStylesUserThemeJSON'] ) &&
		$decoded_data['isGlobalStylesUserThemeJSON']
	) {
		unset( $decoded_data['isGlobalStylesUserThemeJSON'] );

		$data_to_encode = WP_Theme_JSON_Gutenberg::remove_insecure_properties( $decoded_data );

		$data_to_encode['isGlobalStylesUserThemeJSON'] = true;
		return wp_slash( wp_json_encode( $data_to_encode ) );
	}
	return $content;
}

/**
 * Adds the filters to filter global styles user theme.json.
 */
function gutenberg_global_styles_kses_init_filters() {
	add_filter( 'content_save_pre', 'gutenberg_global_styles_filter_post' );
}

/**
 * Removes the filters to filter global styles user theme.json.
 */
function gutenberg_global_styles_kses_remove_filters() {
	remove_filter( 'content_save_pre', 'gutenberg_global_styles_filter_post' );
}

/**
 * Register global styles kses filters if the user does not have unfiltered_html capability.
 *
 * @uses render_block_core_navigation()
 * @throws WP_Error An WP_Error exception parsing the block definition.
 */
function gutenberg_global_styles_kses_init() {
	gutenberg_global_styles_kses_remove_filters();
	if ( ! current_user_can( 'unfiltered_html' ) ) {
		gutenberg_global_styles_kses_init_filters();
	}
}

/**
 * This filter is the last being executed on force_filtered_html_on_import.
 * If the input of the filter is true it means we are in an import situation and should
 * enable kses, independently of the user capabilities.
 * So in that case we call gutenberg_global_styles_kses_init_filters;
 *
 * @param string $arg Input argument of the filter.
 * @return string Exactly what was passed as argument.
 */
function gutenberg_global_styles_force_filtered_html_on_import_filter( $arg ) {
	// force_filtered_html_on_import is true we need to init the global styles kses filters.
	if ( $arg ) {
		gutenberg_global_styles_kses_init_filters();
	}
	return $arg;
}

// TODO: Remove this filter when minimum supported version is WP 5.8
// As all this code is not needed anymore now core supports all variables.
/**
 * This filter is the last being executed on force_filtered_html_on_import.
 * If the input of the filter is true it means we are in an import situation and should
 * enable kses, independently of the user capabilities.
 * So in that case we call gutenberg_global_styles_kses_init_filters;
 *
 * @param bool $allow_css       Whether the CSS in the test string is considered safe.
 * @param bool $css_test_string The CSS string to test..
 * @return bool If $allow_css is true it returns true.
 * If $allow_css is false and the CSS rule is referencing a WordPress css variable it returns true.
 * Otherwise the function return false.
 */
function gutenberg_global_styles_include_support_for_wp_variables( $allow_css, $css_test_string ) {
	if ( $allow_css ) {
		return $allow_css;
	}
	$allowed_preset_attributes = array(
		'background',
		'background-color',
		'border-color',
		'color',
		'font-family',
		'font-size',
	);
	$parts                     = explode( ':', $css_test_string, 2 );

	if ( ! in_array( trim( $parts[0] ), $allowed_preset_attributes, true ) ) {
		return $allow_css;
	}
	return ! ! preg_match( '/^var\(--wp-[a-zA-Z0-9\-]+\)$/', trim( $parts[1] ) );
}

/**
 * Get webfonts defined in theme.json.
 *
 * @return array Returns an array of webfonts defined in theme.json.
 */
function gutenberg_get_webfonts_from_theme_json() {
	static $webfonts = null;

	// Get settings from theme.json.
	$theme_settings = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_settings();

	// Bail out early if there are no settings for webfonts.
	if ( empty( $theme_settings['typography'] ) || empty( $theme_settings['typography']['fontFamilies'] ) ) {
		return array();
	}

	// Return cached webfonts if available.
	if ( null !== $webfonts ) {
		return $webfonts;
	}

	$webfonts = array();

	// Look for fontFamilies.
	foreach ( $theme_settings['typography']['fontFamilies'] as $font_families ) {
		foreach ( $font_families as $font_family ) {

			// Skip if fontFace is not defined.
			if ( empty( $font_family['fontFace'] ) ) {
				continue;
			}

			$font_family['fontFace'] = (array) $font_family['fontFace'];

			foreach ( $font_family['fontFace'] as $font_face ) {
				// Check if webfonts have a "src" param, and if they do account for the use of "file:./".
				if ( ! empty( $font_face['src'] ) ) {
					$font_face['src'] = (array) $font_face['src'];

					foreach ( $font_face['src'] as $src_key => $url ) {
						// Tweak the URL to be relative to the theme root.
						if ( 0 !== strpos( $url, 'file:./' ) ) {
							continue;
						}
						$font_face['src'][ $src_key ] = get_theme_file_uri( str_replace( 'file:./', '', $url ) );
					}
				}

				// Convert keys to kebab-case.
				foreach ( $font_face as $property => $value ) {
					$kebab_case               = _wp_to_kebab_case( $property );
					$font_face[ $kebab_case ] = $value;
					if ( $kebab_case !== $property ) {
						unset( $font_face[ $property ] );
					}
				}

				$webfonts[] = $font_face;
			}
		}
	}
	return $webfonts;
}

/**
 * Register webfonts defined in theme.json.
 */
function gutenberg_register_webfonts_from_theme_json() {
	wp_register_webfonts( gutenberg_get_webfonts_from_theme_json() );
}

/**
 * Add missing fonts data to the global styles.
 *
 * @param array $data The global styles.
 *
 * @return array The global styles with missing fonts data.
 */
function gutenberg_add_registered_webfonts_to_theme_json( $data ) {
	$font_families_registered = wp_webfonts()->webfonts()->get_all_registered();
	$font_families_from_theme = array();
	if ( ! empty( $data['settings'] ) && ! empty( $data['settings']['typography'] ) && ! empty( $data['settings']['typography']['fontFamilies'] ) ) {
		$font_families_from_theme = $data['settings']['typography']['fontFamilies'];
	}

	/**
	 * Helper to get an array of the font-families.
	 *
	 * @param array $families_data The font-families data.
	 *
	 * @return array The font-families array.
	 */
	$get_families = function( $families_data ) {
		$families = array();
		foreach ( $families_data as $family ) {
			if ( isset( $family['font-family'] ) ) {
				$families[] = $family['font-family'];
			} elseif ( isset( $family['fontFamily'] ) ) {
				$families[] = $family['fontFamily'];
			}
		}

		// Micro-optimization: Use array_flip( array_flip( $array ) )
		// instead of array_unique( $array ) because it's faster.
		// The result is the same.
		return array_flip( array_flip( $families ) );
	};

	// Diff the arrays to find the missing fonts.
	$to_add = array_diff(
		$get_families( $font_families_registered ),
		$get_families( $font_families_from_theme )
	);

	// Bail out early if there are no missing fonts.
	if ( empty( $to_add ) ) {
		return $data;
	}

	// Make sure the path to settings.typography.fontFamilies.theme exists
	// before adding missing fonts.
	if ( ! isset( $data['settings'] ) ) {
		$data['settings'] = array();
	}
	if ( ! isset( $data['settings']['typography'] ) ) {
		$data['settings']['typography'] = array();
	}
	if ( ! isset( $data['settings']['typography']['fontFamilies'] ) ) {
		$data['settings']['typography']['fontFamilies'] = array();
	}

	// Add missing fonts.
	foreach ( $to_add as $family ) {
		$data['settings']['typography']['fontFamilies'][] = array(
			'fontFamily' => false !== strpos( $family, ' ' ) ? "'{$family}'" : $family,
			'name'       => $family,
			'slug'       => sanitize_title( $family ),
		);
	}

	return $data;
}

// The else clause can be removed when plugin support requires WordPress 5.8.0+.
if ( function_exists( 'get_block_editor_settings' ) ) {
	add_filter( 'block_editor_settings_all', 'gutenberg_experimental_global_styles_settings', PHP_INT_MAX );
} else {
	add_filter( 'block_editor_settings', 'gutenberg_experimental_global_styles_settings', PHP_INT_MAX );
}

add_action( 'init', 'gutenberg_experimental_global_styles_register_user_cpt' );
add_action( 'wp_enqueue_scripts', 'gutenberg_experimental_global_styles_enqueue_assets' );
add_action( 'wp_loaded', 'gutenberg_register_webfonts_from_theme_json' );
add_filter( 'theme_json_data', 'gutenberg_add_registered_webfonts_to_theme_json' );

// kses actions&filters.
add_action( 'init', 'gutenberg_global_styles_kses_init' );
add_action( 'set_current_user', 'gutenberg_global_styles_kses_init' );
add_filter( 'force_filtered_html_on_import', 'gutenberg_global_styles_force_filtered_html_on_import_filter', 999 );
add_filter( 'safecss_filter_attr_allow_css', 'gutenberg_global_styles_include_support_for_wp_variables', 10, 2 );
// This filter needs to be executed last.
