<?php
/**
 * Internationalization-related functions for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Returns Jed-formatted localization data.
 *
 * @since 0.1.0
 * @deprecated 5.2.0
 *
 * @param  string $domain Translation domain.
 *
 * @return array
 */
function gutenberg_get_jed_locale_data( $domain ) {
	_deprecated_function( __FUNCTION__, '5.2.0' );

	$translations = get_translations_for_domain( $domain );

	$locale = array(
		'' => array(
			'domain' => $domain,
			'lang'   => is_admin() ? get_user_locale() : get_locale(),
		),
	);

	if ( ! empty( $translations->headers['Plural-Forms'] ) ) {
		$locale['']['plural_forms'] = $translations->headers['Plural-Forms'];
	}

	foreach ( $translations->entries as $msgid => $entry ) {
		$locale[ $msgid ] = $entry->translations;
	}

	return $locale;
}

/**
 * Load plugin text domain for translations.
 *
 * @since 0.1.0
 * @deprecated 5.2.0
 */
function gutenberg_load_plugin_textdomain() {
	_deprecated_function( __FUNCTION__, '5.2.0' );
}
