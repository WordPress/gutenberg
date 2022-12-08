<?php
/**
 * WP_Theme_JSON_Gutenberg class
 *
 * @package gutenberg
 */

/**
 * Class that encapsulates the processing of structures that adhere to the theme.json spec.
 *
 * This class is for internal core usage and is not supposed to be used by extenders (plugins and/or themes).
 * This is a low-level API that may need to do breaking changes. Please,
 * use get_global_settings, get_global_styles, and get_global_stylesheet instead.
 *
 * @access private
 */
class WP_Theme_JSON_Gutenberg extends WP_Theme_JSON_6_2 {
	/**
	 * Holds block metadata extracted from block.json
	 * to be shared among all instances so we don't
	 * process it twice.
	 *
	 * It is necessary to redefine $blocks_metadata here so that it
	 * doesn't get inherited from an earlier instantiation of the
	 * parent class.
	 *
	 * @since 5.8.0
	 * @var array
	 */
	protected static $blocks_metadata = null;
}

/**
 * Sanitizes global styles user content removing unsafe rules.
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

		$data_to_encode = WP_Theme_JSON_Gutenberg::remove_insecure_properties( $decoded_data );

		$data_to_encode['isGlobalStylesUserThemeJSON'] = true;
		return wp_slash( wp_json_encode( $data_to_encode ) );
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
add_action( 'init', 'gutenberg_override_core_kses_init_filters' );
add_action( 'set_current_user', 'gutenberg_override_core_kses_init_filters' );
