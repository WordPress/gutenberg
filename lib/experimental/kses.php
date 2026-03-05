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

/**
 * Strip block-level custom CSS for users without unfiltered_html capability.
 *
 * When a user without unfiltered_html saves post content, filter_block_content()
 * runs filter_block_kses() on each block. wp_kses() treats attrs.style.css as
 * HTML and encodes & and >, corrupting CSS (e.g. nesting selectors). This runs
 * before wp_pre_kses_block_attributes (priority 10) so content is stripped
 * before filter_block_content can mangle it.
 *
 * @see https://core.trac.wordpress.org/ticket/64771
 *
 * @param string $content           Content to be run through KSES.
 * @param array[]|string $allowed_html Allowed HTML elements or context name.
 * @param string[]       $allowed_protocols Allowed URL protocols.
 * @return string Filtered content.
 */
function gutenberg_strip_block_custom_css_for_restricted_users( $content, $allowed_html, $allowed_protocols ) {
	if ( current_user_can( 'unfiltered_html' ) ) {
		return $content;
	}
	if ( false === strpos( $content, '<!-- wp:' ) ) {
		return $content;
	}

	$blocks = parse_blocks( $content );
	$blocks = gutenberg_strip_custom_css_from_blocks( $blocks );
	return serialize_blocks( $blocks );
}

/**
 * Recursively strip attrs.style.css from blocks.
 *
 * @param array[] $blocks Parsed blocks.
 * @return array[] Blocks with custom CSS removed.
 */
function gutenberg_strip_custom_css_from_blocks( $blocks ) {
	foreach ( $blocks as &$block ) {
		if ( empty( $block['blockName'] ) ) {
			continue;
		}
		if ( isset( $block['attrs']['style']['css'] ) && trim( (string) $block['attrs']['style']['css'] ) !== '' ) {
			$block['attrs']['style']['css'] = '';
			if ( empty( array_filter( (array) $block['attrs']['style'] ) ) ) {
				unset( $block['attrs']['style'] );
			}
		}
		if ( ! empty( $block['innerBlocks'] ) ) {
			$block['innerBlocks'] = gutenberg_strip_custom_css_from_blocks( $block['innerBlocks'] );
		}
	}
	return $blocks;
}

add_filter( 'pre_kses', 'gutenberg_strip_block_custom_css_for_restricted_users', 5, 3 );

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
