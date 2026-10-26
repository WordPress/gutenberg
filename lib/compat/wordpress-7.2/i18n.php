<?php
/**
 * WordPress 7.2 compatibility functions for the locale used by `wp.i18n` to
 * format numbers.
 *
 * @package gutenberg
 */

/**
 * Passes the locale of the current user to `wp.i18n`, as the `lang` of the
 * locale data of the default text domain. `wp.i18n.formatNumber()` formats
 * numbers with it.
 *
 * Translation files carry the same `lang` in their locale data, but English
 * sites have none, so the locale is always set.
 *
 * @param WP_Scripts $scripts WP_Scripts instance.
 */
function gutenberg_add_i18n_locale( $scripts ) {
	if ( ! $scripts->query( 'wp-i18n', 'registered' ) ) {
		return;
	}

	$scripts->add_inline_script(
		'wp-i18n',
		sprintf(
			'wp.i18n.setLocaleData( { "": { "lang": %s } } );',
			wp_json_encode( get_user_locale(), JSON_HEX_TAG | JSON_UNESCAPED_SLASHES )
		),
		'after'
	);
}
add_action( 'wp_default_scripts', 'gutenberg_add_i18n_locale', 20 );
