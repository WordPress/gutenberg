<?php
/**
 * Temporary compatibility shims for kses rules present in Gutenberg.
 *
 * The functions in this file should not be backported to core.
 *
 * @package gutenberg
 */

/**
 * Sanitizes global styles user content removing unsafe rules.
 *
 * This function is identical to the core version, but called the
 * Gutenberg version of the theme JSON class (`WP_Theme_JSON_Gutenberg`).
 *
 * This function should not be backported to core.
 *
 * @since 5.9.0
 *
 * @param string $data Post content to filter.
 * @return string Filtered post content with unsafe rules removed.
 */
function gutenberg_filter_global_styles_post( $data ) {
	$decoded_data        = json_decode( wp_unslash( $data ), true );
	$json_decoding_error = json_last_error();
	if (
		JSON_ERROR_NONE === $json_decoding_error &&
		is_array( $decoded_data ) &&
		isset( $decoded_data['isGlobalStylesUserThemeJSON'] ) &&
		$decoded_data['isGlobalStylesUserThemeJSON']
	) {
		unset( $decoded_data['isGlobalStylesUserThemeJSON'] );

		$data_to_encode = WP_Theme_JSON_Gutenberg::remove_insecure_properties( $decoded_data, 'custom' );

		$data_to_encode['isGlobalStylesUserThemeJSON'] = true;
		/**
		 * JSON encode the data stored in post content.
		 * Escape characters that are likely to be mangled by HTML filters: "<>&".
		 *
		 * This matches the escaping in {@see WP_REST_Global_Styles_Controller_Gutenberg::prepare_item_for_database()}.
		 */
		return wp_slash( wp_json_encode( $data_to_encode, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) );
	}
	return $data;
}

/**
 * Override core's kses_init_filters hooks for global styles,
 * and use Gutenberg's version instead. This ensures that
 * Gutenberg's `remove_insecure_properties` function can be called.
 *
 * The hooks are only set if they are already added, which ensures
 * that global styles is only filtered for users without the `unfiltered_html`
 * capability.
 *
 * This function should not be backported to core.
 */
function gutenberg_override_core_kses_init_filters() {
	if ( has_filter( 'content_save_pre', 'wp_filter_global_styles_post' ) ) {
		remove_filter( 'content_save_pre', 'wp_filter_global_styles_post', 9 );
		add_filter( 'content_save_pre', 'gutenberg_filter_global_styles_post', 9 );
	}

	if ( has_filter( 'content_filtered_save_pre', 'wp_filter_global_styles_post' ) ) {
		remove_filter( 'content_filtered_save_pre', 'wp_filter_global_styles_post', 9 );
		add_filter( 'content_filtered_save_pre', 'gutenberg_filter_global_styles_post', 9 );
	}
}
// The 'kses_init_filters' is usually initialized with default priority. Use higher priority to override.
add_action( 'init', 'gutenberg_override_core_kses_init_filters', 20 );
add_action( 'set_current_user', 'gutenberg_override_core_kses_init_filters' );

if ( ! function_exists( 'allow_filter_in_styles' ) ) {
	/**
	 * See https://github.com/WordPress/wordpress-develop/pull/4108
	 *
	 * Mark CSS safe if it contains a "filter: url('#wp-duotone-...')" rule.
	 *
	 * This function should not be backported to core.
	 *
	 * @param bool   $allow_css Whether the CSS is allowed.
	 * @param string $css_test_string The CSS to test.
	 * @return bool Whether the CSS is allowed.
	 */
	function allow_filter_in_styles( $allow_css, $css_test_string ) {
		if ( preg_match(
			"/^filter:\s*url\((['\"]?)#wp-duotone-[-a-zA-Z0-9]+\\1\)(\s+!important)?$/",
			$css_test_string
		) ) {
			return true;
		}
		return $allow_css;
	}
}
add_filter( 'safecss_filter_attr_allow_css', 'allow_filter_in_styles', 10, 2 );

/**
 * Allow combined gradient and url() background-image values in inline styles.
 *
 * WordPress's safecss_filter_attr() handles gradient and url() values
 * separately for background-image, but fails when both appear in a single
 * comma-separated declaration. The url() portion is stripped from the test
 * string before the filter runs, but the gradient regex in core expects the
 * gradient to be the only value and doesn't match when a trailing comma and
 * whitespace remain. This leaves parentheses in the test string, which
 * triggers the unsafe-character check.
 *
 * This filter catches that case: the test string still contains a valid
 * gradient function with only commas and whitespace remaining after the
 * url() was removed.
 *
 * @param bool   $allow_css       Whether the CSS is allowed.
 * @param string $css_test_string The CSS declaration to test.
 * @return bool Whether the CSS is allowed.
 */
function gutenberg_allow_background_image_combined( $allow_css, $css_test_string ) {
	if ( $allow_css ) {
		return $allow_css;
	}
	/*
	 * The test string at this point has url() values already removed by
	 * safecss_filter_attr. What remains is a gradient with comma/whitespace
	 * residue where the url() was stripped. Two possible forms:
	 *
	 * Gradient first: "background-image:<gradient>(...), "
	 * URL first:      "background-image:, <gradient>(...)"
	 *
	 * A trailing or leading comma (with optional whitespace) must be present
	 * to confirm a url() was actually removed. Without that residue, the
	 * gradient alone would already pass core's own check.
	 */
	$gradient_pattern = '(?:linear|radial|conic|repeating-linear|repeating-radial|repeating-conic)-gradient\((?:[^()]|\([^()]*\))*\)';
	$var_pattern      = 'var\(--[a-zA-Z0-9_-]+(?:--[a-zA-Z0-9_-]+)*\)';
	$value_pattern    = "(?:$gradient_pattern|$var_pattern)";

	// Gradient/var first, then comma+whitespace residue from stripped url().
	$pattern_gradient_first = '/^background-image\s*:\s*' . $value_pattern . '\s*,[\s,]*$/';
	// Stripped url() first (comma+whitespace residue), then gradient/var.
	$pattern_url_first = '/^background-image\s*:[\s,]*,\s*' . $value_pattern . '\s*$/';

	if ( preg_match( $pattern_gradient_first, $css_test_string ) || preg_match( $pattern_url_first, $css_test_string ) ) {
		return true;
	}

	return $allow_css;
}
add_filter( 'safecss_filter_attr_allow_css', 'gutenberg_allow_background_image_combined', 10, 2 );

/**
 * Update allowed inline style attributes list.
 *
 * @param string[] $attrs Array of allowed CSS attributes.
 * @return string[] CSS attributes.
 */
function gutenberg_safe_grid_attrs( $attrs ) {
	$attrs[] = 'grid-column';
	$attrs[] = 'grid-row';
	$attrs[] = 'container-type';
	return $attrs;
}
add_filter( 'safe_style_css', 'gutenberg_safe_grid_attrs' );
