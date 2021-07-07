<?php
/**
 * Bootstraps Global Styles.
 *
 * @package gutenberg
 */

/**
 * Takes a tree adhering to the theme.json schema and generates
 * the corresponding stylesheet.
 *
 * @param WP_Theme_JSON_Gutenberg $tree Input tree.
 * @param string                  $type Type of stylesheet we want accepts 'all', 'block_styles', and 'css_variables'.
 *
 * @return string Stylesheet.
 */
function gutenberg_experimental_global_styles_get_stylesheet( $tree, $type = 'all' ) {
	// Check if we can use cached.
	$can_use_cached = (
		( 'all' === $type ) &&
		( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) &&
		( ! defined( 'SCRIPT_DEBUG' ) || ! SCRIPT_DEBUG ) &&
		( ! defined( 'REST_REQUEST' ) || ! REST_REQUEST ) &&
		! is_admin()
	);

	if ( $can_use_cached ) {
		// Check if we have the styles already cached.
		$cached = get_transient( 'global_styles' );
		if ( $cached ) {
			return $cached;
		}
	}

	$stylesheet = $tree->get_stylesheet( $type );

	if ( $can_use_cached ) {
		// Cache for a minute.
		// This cache doesn't need to be any longer, we only want to avoid spikes on high-traffic sites.
		set_transient( 'global_styles', $stylesheet, MINUTE_IN_SECONDS );
	}

	return $stylesheet;
}

/**
 * Fetches the preferences for each origin (core, theme, user)
 * and enqueues the resulting stylesheet.
 */
function gutenberg_experimental_global_styles_enqueue_assets() {
	if (
		! get_theme_support( 'experimental-link-color' ) && // link color support needs the presets CSS variables regardless of the presence of theme.json file.
		! WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
		return;
	}

	$settings = gutenberg_get_default_block_editor_settings();
	$all      = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( $settings );

	$stylesheet = gutenberg_experimental_global_styles_get_stylesheet( $all );
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
	$context = 'all';
	if (
		is_callable( 'get_current_screen' ) &&
		function_exists( 'gutenberg_is_edit_site_page' ) &&
		gutenberg_is_edit_site_page( get_current_screen()->id ) &&
		WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() &&
		gutenberg_supports_block_templates()
	) {
		$context = 'site-editor';
	}

	if (
		defined( 'REST_REQUEST' ) &&
		REST_REQUEST &&
		isset( $_GET['context'] ) &&
		'mobile' === $_GET['context'] &&
		WP_Theme_JSON_Resolver_Gutenberg::theme_has_support()
	) {
		$context = 'mobile';
	}

	$origin = 'theme';
	if (
		WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() &&
		gutenberg_supports_block_templates()
	) {
		// Only lookup for the user data if we need it.
		$origin = 'user';
	}
	$consolidated = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( $settings, $origin );

	if ( 'mobile' === $context ) {
		$settings['__experimentalStyles'] = $consolidated->get_raw_data()['styles'];
	}

	if ( 'site-editor' === $context ) {
		$theme       = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( $settings, 'theme' );
		$user_cpt_id = WP_Theme_JSON_Resolver_Gutenberg::get_user_custom_post_type_id();

		$settings['__experimentalGlobalStylesUserEntityId'] = $user_cpt_id;
		$settings['__experimentalGlobalStylesBaseStyles']   = $theme->get_raw_data();
	}

	if (
		'site-editor' !== $context &&
		'mobile' !== $context &&
		( WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() || get_theme_support( 'experimental-link-color' ) )
	) {
		$block_styles  = array( 'css' => gutenberg_experimental_global_styles_get_stylesheet( $consolidated, 'block_styles' ) );
		$css_variables = array(
			'css'                     => gutenberg_experimental_global_styles_get_stylesheet( $consolidated, 'css_variables' ),
			'__experimentalNoWrapper' => true,
		);

		// Make sure the styles array exists.
		// In some contexts, like the navigation editor, it doesn't.
		if ( ! isset( $settings['styles'] ) ) {
			$settings['styles'] = array();
		}

		// Reset existing global styles.
		foreach ( $settings['styles'] as $key => $style ) {
			if ( isset( $style['__unstableType'] ) && 'globalStyles' === $style['__unstableType'] ) {
				unset( $settings['styles'][ $key ] );
			}
		}

		// Add the new ones.
		$settings['styles'][] = $css_variables;
		$settings['styles'][] = $block_styles;
	}

	// Copied from get_block_editor_settings() at wordpress-develop/block-editor.php.
	$settings['__experimentalFeatures'] = $consolidated->get_settings();

	if ( isset( $settings['__experimentalFeatures']['color']['palette'] ) ) {
		$colors_by_origin   = $settings['__experimentalFeatures']['color']['palette'];
		$settings['colors'] = isset( $colors_by_origin['user'] ) ?
			$colors_by_origin['user'] : (
				isset( $colors_by_origin['theme'] ) ?
					$colors_by_origin['theme'] :
					$colors_by_origin['core']
			);
	}

	if ( isset( $settings['__experimentalFeatures']['color']['gradients'] ) ) {
		$gradients_by_origin   = $settings['__experimentalFeatures']['color']['gradients'];
		$settings['gradients'] = isset( $gradients_by_origin['user'] ) ?
			$gradients_by_origin['user'] : (
				isset( $gradients_by_origin['theme'] ) ?
					$gradients_by_origin['theme'] :
					$gradients_by_origin['core']
			);
	}

	if ( isset( $settings['__experimentalFeatures']['typography']['fontSizes'] ) ) {
		$font_sizes_by_origin  = $settings['__experimentalFeatures']['typography']['fontSizes'];
		$settings['fontSizes'] = isset( $font_sizes_by_origin['user'] ) ?
			$font_sizes_by_origin['user'] : (
				isset( $font_sizes_by_origin['theme'] ) ?
					$font_sizes_by_origin['theme'] :
					$font_sizes_by_origin['core']
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
	if ( isset( $settings['__experimentalFeatures']['typography']['customLineHeight'] ) ) {
		$settings['enableCustomLineHeight'] = $settings['__experimentalFeatures']['typography']['customLineHeight'];
		unset( $settings['__experimentalFeatures']['typography']['customLineHeight'] );
	}
	if ( isset( $settings['__experimentalFeatures']['spacing']['units'] ) ) {
		$settings['enableCustomUnits'] = $settings['__experimentalFeatures']['spacing']['units'];
	}
	if ( isset( $settings['__experimentalFeatures']['spacing']['customPadding'] ) ) {
		$settings['enableCustomSpacing'] = $settings['__experimentalFeatures']['spacing']['customPadding'];
		unset( $settings['__experimentalFeatures']['spacing']['customPadding'] );
	}

	return $settings;
}

/**
 * Register CPT to store/access user data.
 *
 * @return array|undefined
 */
function gutenberg_experimental_global_styles_register_user_cpt() {
	if ( ! WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
		return;
	}

	WP_Theme_JSON_Resolver_Gutenberg::register_user_custom_post_type();
}

/**
 * Sanitizes global styles user content removing unsafe rules.
 *
 * @param string $content Post content to filter.
 * @return string Filtered post content with unsafe rules removed.
 */
function gutenberg_global_styles_filter_post( $content ) {
	$decoded_data        = json_decode( stripslashes( $content ), true );
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
		return wp_json_encode( $data_to_encode );
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

// The else clause can be removed when plugin support requires WordPress 5.8.0+.
if ( function_exists( 'get_block_editor_settings' ) ) {
	add_filter( 'block_editor_settings_all', 'gutenberg_experimental_global_styles_settings', PHP_INT_MAX );
} else {
	add_filter( 'block_editor_settings', 'gutenberg_experimental_global_styles_settings', PHP_INT_MAX );
}

add_action( 'init', 'gutenberg_experimental_global_styles_register_user_cpt' );
add_action( 'wp_enqueue_scripts', 'gutenberg_experimental_global_styles_enqueue_assets' );

// kses actions&filters.
add_action( 'init', 'gutenberg_global_styles_kses_init' );
add_action( 'set_current_user', 'gutenberg_global_styles_kses_init' );
add_filter( 'force_filtered_html_on_import', 'gutenberg_global_styles_force_filtered_html_on_import_filter', 999 );
add_filter( 'safecss_filter_attr_allow_css', 'gutenberg_global_styles_include_support_for_wp_variables', 10, 2 );
// This filter needs to be executed last.
