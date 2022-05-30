<?php
/**
 * Filters responsible for escaping and sanitizing global styles user theme.json.
 *
 * @package gutenberg
 */

/**
 * Removes the filters that currently escape and sanitize global styles user theme.json in core.
 */
function gutenberg_remove_kses_filters_global_styles_post() {
	remove_filter( 'content_save_pre', 'wp_filter_global_styles_post', 9 );
	remove_filter( 'content_filtered_save_pre', 'wp_filter_global_styles_post', 9 );
	gutenberg_global_styles_kses_remove_filters();
}

// The correspondent add filter actions in core have the default priority of 10.
// For the remove to work the priority needs to be higher so the remove happens after the add.
add_action( 'init', 'gutenberg_remove_kses_filters_global_styles_post', 11 );
add_action( 'set_current_user', 'gutenberg_remove_kses_filters_global_styles_post', 11 );

// Conditionality add wp_global_styles filters during init and each time the current user changes.
add_action( 'init', 'gutenberg_wp_global_styles_filter_init' );
add_action( 'set_current_user', 'gutenberg_wp_global_styles_filter_init' );

// During the import start process add the possibility to add wp_global_styles because the import has special rules..
add_action( 'import_start', 'gutenberg_wp_global_styles_import_filter_init' );
// When the import is ended go back to the default wp_global_styles filter init conditions.
add_action( 'import_end', 'gutenberg_wp_global_styles_filter_init' );

/**
 * Adds the filters to escape and sanitize global styles user theme.json if the user can not use unfiltered_html.
 */
function gutenberg_wp_global_styles_filter_init() {
	// Remove the wp_global_styles filter if there is one already.
	remove_filter( 'wp_insert_post_data', 'gutenberg_filter_global_styles_post', 9 );
	if ( ! current_user_can( 'unfiltered_html' ) ) {
		// Add the wp_global_styles filter if the user has not unfiltered_html capability.
		add_filter( 'wp_insert_post_data', 'gutenberg_filter_global_styles_post', 9, 1 );
	}
}

/**
 * Adds the filters to escape and sanitize global styles user theme.json
 * if the filtered is not already added forced filtered html on import is true.
 * To be used during site import situations.
 */
function gutenberg_wp_global_styles_import_filter_init() {
	// If forcing filters on import is enabled and currently the wp_global_styles filter is not added
	// add the filter.
	if (
		apply_filters( 'force_filtered_html_on_import', false ) &&
		! has_filter( 'wp_insert_post_data', 'gutenberg_filter_global_styles_post' )
	) {
		add_filter( 'wp_insert_post_data', 'gutenberg_filter_global_styles_post', 9, 1 );
	}
}


/**
 * If the post content passed to the function is a theme.json user style,
 * the function escapes and sanitizes it. Otherwise returns the same data without any change.
 *
 * @param array $data An array of slashed, sanitized, and processed post data.
 *
 * @return array An array of slashed, sanitized, and processed post data with theme.json user styles properly sanitized and escaped.
 */
function gutenberg_filter_global_styles_post( $data ) {
	// If there is post content and we are in the presence of wp_global_styles post type or a revision of a wp_global_styles post type.
	if ( isset( $data['post_type'] ) &&
		isset( $data['post_content'] ) &&
		(
			'wp_global_styles' === $data['post_type'] ||
			(
					'revision' === $data['post_type'] &&
					! empty( $data['post_parent'] ) &&
					'wp_global_styles' === get_post_type( $data['post_parent'] )
			)
		)
	) {
		$decoded_data        = json_decode( wp_unslash( $data['post_content'] ), true );
		$json_decoding_error = json_last_error();
		// If the post content is a user theme.json object.
		if (
			JSON_ERROR_NONE === $json_decoding_error &&
			is_array( $decoded_data ) &&
			isset( $decoded_data['isGlobalStylesUserThemeJSON'] ) &&
			$decoded_data['isGlobalStylesUserThemeJSON']
		) {
			// Remove unsecure properties from the user global styles object.
			unset( $decoded_data['isGlobalStylesUserThemeJSON'] );
			$data_to_encode                                = WP_Theme_JSON::remove_insecure_properties( $decoded_data );
			$data_to_encode['isGlobalStylesUserThemeJSON'] = true;

			// Re-encode the data and pass it by wp_filter_post_kses to make sure the data is still safe
			// even if output as html to the browser.
			$data['post_content'] = wp_filter_post_kses( wp_slash( wp_json_encode( $data_to_encode ) ) );
		}
	}
	return $data;
}
