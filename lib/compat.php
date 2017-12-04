<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Splits a UTF-8 string into an array of UTF-8-encoded codepoints.
 *
 * @since 0.5.0
 *
 * Based on WordPress' _mb_substr() compat function.
 *
 * @param string $str        The string to split.
 * @return array
 */
function _gutenberg_utf8_split( $str ) {
	if ( _wp_can_use_pcre_u() ) {
		// Use the regex unicode support to separate the UTF-8 characters into
		// an array.
		preg_match_all( '/./us', $str, $match );
		return $match[0];
	}

	$regex = '/(
		  [\x00-\x7F]                  # single-byte sequences   0xxxxxxx
		| [\xC2-\xDF][\x80-\xBF]       # double-byte sequences   110xxxxx 10xxxxxx
		| \xE0[\xA0-\xBF][\x80-\xBF]   # triple-byte sequences   1110xxxx 10xxxxxx * 2
		| [\xE1-\xEC][\x80-\xBF]{2}
		| \xED[\x80-\x9F][\x80-\xBF]
		| [\xEE-\xEF][\x80-\xBF]{2}
		| \xF0[\x90-\xBF][\x80-\xBF]{2} # four-byte sequences   11110xxx 10xxxxxx * 3
		| [\xF1-\xF3][\x80-\xBF]{3}
		| \xF4[\x80-\x8F][\x80-\xBF]{2}
	)/x';

	// Start with 1 element instead of 0 since the first thing we do is pop.
	$chars = array( '' );
	do {
		// We had some string left over from the last round, but we counted it
		// in that last round.
		array_pop( $chars );

		// Split by UTF-8 character, limit to 1000 characters (last array
		// element will contain the rest of the string).
		$pieces = preg_split(
			$regex,
			$str,
			1000,
			PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY
		);

		$chars = array_merge( $chars, $pieces );

		// If there's anything left over, repeat the loop.
		if ( count( $pieces ) > 1 ) {
			$str = array_pop( $pieces );
		} else {
			break;
		}
	} while ( $str );

	return $chars;
}

/**
 * Fixes a conflict with the Jetpack plugin trying to read an undefined global
 * variable `grunionEditorView` during the initialization of the
 * `core/freeform` block.
 *
 * @since 0.7.1
 */
function gutenberg_fix_jetpack_freeform_block_conflict() {
	if (
		defined( 'JETPACK__VERSION' ) &&
		version_compare( JETPACK__VERSION, '5.2.2', '<' )
	) {
		remove_filter(
			'mce_external_plugins',
			array( 'Grunion_Editor_View', 'mce_external_plugins' )
		);
	}
}

/**
 * Shims wp-api-request for WordPress installations not running 4.9-alpha or
 * newer.
 *
 * @see https://core.trac.wordpress.org/ticket/40919
 *
 * @since 0.10.0
 */
function gutenberg_ensure_wp_api_request() {
	if ( wp_script_is( 'wp-api-request', 'registered' ) ||
			! wp_script_is( 'wp-api-request-shim', 'registered' ) ) {
		return;
	}

	global $wp_scripts;

	// Define script using existing shim. We do this because we must define the
	// vendor script in client-assets.php, but want to use consistent handle.
	$shim = $wp_scripts->registered['wp-api-request-shim'];
	wp_register_script(
		'wp-api-request',
		$shim->src,
		$shim->deps,
		$shim->ver
	);

	// Localize wp-api-request using wp-api handle data (swapped in 4.9-alpha).
	$wp_api_localized_data = $wp_scripts->get_data( 'wp-api', 'data' );
	if ( false !== $wp_api_localized_data ) {
		wp_add_inline_script( 'wp-api-request', $wp_api_localized_data, 'before' );
	}
}
add_action( 'wp_enqueue_scripts', 'gutenberg_ensure_wp_api_request', 20 );
add_action( 'admin_enqueue_scripts', 'gutenberg_ensure_wp_api_request', 20 );

/**
 * Disables wpautop behavior in classic editor when post contains blocks, to
 * prevent removep from invalidating paragraph blocks.
 *
 * @param  array $settings Original editor settings.
 * @return array           Filtered settings.
 */
function gutenberg_disable_editor_settings_wpautop( $settings ) {
	$post = get_post();
	if ( is_object( $post ) && gutenberg_post_has_blocks( $post ) ) {
		$settings['wpautop'] = false;
	}

	return $settings;
}
add_filter( 'wp_editor_settings', 'gutenberg_disable_editor_settings_wpautop' );

/**
 * Add rest nonce to the heartbeat response.
 *
 * @param  array $response Original heartbeat response.
 * @return array           New heartbeat response.
 */
function gutenberg_add_rest_nonce_to_heartbeat_response_headers( $response ) {
	$response['rest-nonce'] = wp_create_nonce( 'wp_rest' );
	return $response;
}

add_filter( 'wp_refresh_nonces', 'gutenberg_add_rest_nonce_to_heartbeat_response_headers' );

/**
 * Ensure that the wp-json index contains the `permalink_structure` setting as
 * part of its site info elements.
 *
 * @see https://core.trac.wordpress.org/ticket/42465
 *
 * @param WP_REST_Response $response WP REST API response of the wp-json index.
 * @return WP_REST_Response Response that contains the permalink structure.
 */
function gutenberg_ensure_wp_json_has_permalink_structure( $response ) {
	$site_info = $response->get_data();

	if ( ! array_key_exists( 'permalink_structure', $site_info ) ) {
		$site_info['permalink_structure'] = get_option( 'permalink_structure' );
	}

	$response->set_data( $site_info );

	return $response;
}
add_filter( 'rest_index', 'gutenberg_ensure_wp_json_has_permalink_structure' );

/**
 * As a substitute for the default content `wpautop` filter, applies autop
 * behavior only for posts where content does not contain blocks.
 *
 * @param  string $content Post content.
 * @return string          Paragraph-converted text if non-block content.
 */
function gutenberg_wpautop( $content ) {
	if ( gutenberg_content_has_blocks( $content ) ) {
		return $content;
	}

	return wpautop( $content );
}
remove_filter( 'the_content', 'wpautop' );
add_filter( 'the_content', 'gutenberg_wpautop', 8 );
