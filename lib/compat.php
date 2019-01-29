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
 * @deprecated 5.0.0 _mb_substr
 *
 * @param string $str The string to split.
 * @return string Extracted substring.
 */
function _gutenberg_utf8_split( $str ) {
	_deprecated_function( __FUNCTION__, '5.0.0', '_mb_substr' );

	return _mb_substr( $str );
}

/**
 * Disables wpautop behavior in classic editor when post contains blocks, to
 * prevent removep from invalidating paragraph blocks.
 *
 * @link https://core.trac.wordpress.org/ticket/45113
 * @link https://core.trac.wordpress.org/changeset/43758
 * @deprecated 5.0.0
 *
 * @param array $settings Original editor settings.
 * @return array Filtered settings.
 */
function gutenberg_disable_editor_settings_wpautop( $settings ) {
	_deprecated_function( __FUNCTION__, '5.0.0' );

	return $settings;
}

/**
 * Add rest nonce to the heartbeat response.
 *
 * @link https://core.trac.wordpress.org/ticket/45113
 * @link https://core.trac.wordpress.org/changeset/43939
 * @deprecated 5.0.0
 *
 * @param array $response Original heartbeat response.
 * @return array New heartbeat response.
 */
function gutenberg_add_rest_nonce_to_heartbeat_response_headers( $response ) {
	_deprecated_function( __FUNCTION__, '5.0.0' );

	return $response;
}

/**
 * Check if we need to load the block warning in the Classic Editor.
 *
 * @deprecated 5.0.0
 */
function gutenberg_check_if_classic_needs_warning_about_blocks() {
	_deprecated_function( __FUNCTION__, '5.0.0' );
}

/**
 * Adds a warning to the Classic Editor when trying to edit a post containing blocks.
 *
 * @since 3.4.0
 * @deprecated 5.0.0
 */
function gutenberg_warn_classic_about_blocks() {
	_deprecated_function( __FUNCTION__, '5.0.0' );
}

/**
 * Display the privacy policy help notice.
 *
 * In Gutenberg, the `edit_form_after_title` hook is not supported. Because
 * WordPress Core uses this hook to display this notice, it never displays.
 * Outputting the notice on the `admin_notices` hook allows Gutenberg to
 * consume the notice and display it with the Notices API.
 *
 * @since 4.5.0
 * @deprecated 5.0.0
 */
function gutenberg_show_privacy_policy_help_text() {
	_deprecated_function( __FUNCTION__, '5.0.0' );
}
