<?php
/**
 * Gallery block modifications.
 *
 * @package gutenberg
 */

/**
 * The new gallery block format is not compatible with the use_BalanceTags option
 * in WP versions <= 5.8 https://core.trac.wordpress.org/ticket/54130.
 * This method adds a variable to the wp namespace to indicate if the new gallery block
 * format can be enabled or not. It needs to be added this early and to the wp namespace
 * as it needs to be available when the initial block parsing runs on editor load, and most of
 * the editor store and standard flags are not loaded yet at that point
 *
 * @since 12.1.0
 * @todo This should be removed when the minimum required WP version is >= 6.0.
 *
 * @return void.
 */
function gutenberg_check_gallery_block_v2_compatibility() {
	$use_balance_tags   = (int) get_option( 'use_balanceTags' );
	$v2_gallery_enabled = boolval( 1 !== $use_balance_tags || is_wp_version_compatible( '6.0' ) ) ? 'true' : 'false';

	wp_add_inline_script(
		'wp-dom-ready',
		'wp.galleryBlockV2Enabled = ' . $v2_gallery_enabled . ';',
		'after'
	);
}
add_action( 'init', 'gutenberg_check_gallery_block_v2_compatibility' );

/**
 * Prevent use_balanceTags being enabled on WordPress 5.8 or earlier as it breaks
 * the layout of the new Gallery block.
 *
 * @since 12.1.0
 * @todo This should be removed when the minimum required WP version is >= 6.0.
 *
 * @param int $new_value The new value for use_balanceTags.
 */
function gutenberg_use_balancetags_check( $new_value ) {
	global $wp_version;

	if ( 1 === (int) $new_value && version_compare( $wp_version, '6.0', '<' ) ) {
		/* translators: %s: Minimum required version */
		$message = sprintf( __( 'Gutenberg requires WordPress %s or later in order to enable the &#8220;Correct invalidly nested XHTML automatically&#8221; option. Please upgrade WordPress before enabling.', 'gutenberg' ), '6.0' );
		add_settings_error( 'gutenberg_use_balancetags_check', 'gutenberg_use_balancetags_check', $message, 'error' );
		if ( class_exists( 'WP_CLI' ) ) {
			WP_CLI::error( $message );
		}
		return 0;
	}

	return $new_value;
}
add_filter( 'pre_update_option_use_balanceTags', 'gutenberg_use_balancetags_check' );
