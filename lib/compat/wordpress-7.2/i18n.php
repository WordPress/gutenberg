<?php
/**
 * WordPress 7.2 compatibility functions for the number formatting settings
 * of the `wp-i18n` script.
 *
 * @package gutenberg
 */

/**
 * Passes the locale of the current user to `wp.i18n`, which formats numbers
 * with it.
 *
 * Only the settings `wp.i18n.formatNumber()` needs are passed, unlike the date
 * settings, which also carry month names, formats and more.
 *
 * @param WP_Scripts $scripts WP_Scripts instance.
 */
function gutenberg_add_i18n_number_format_settings( $scripts ) {
	if ( ! $scripts->query( 'wp-i18n', 'registered' ) ) {
		return;
	}

	$scripts->add_inline_script(
		'wp-i18n',
		sprintf(
			'wp.i18n.setSettings( %s );',
			wp_json_encode(
				array( 'locale' => get_user_locale() ),
				JSON_HEX_TAG | JSON_UNESCAPED_SLASHES
			)
		),
		'after'
	);
}
add_action( 'wp_default_scripts', 'gutenberg_add_i18n_number_format_settings', 20 );
