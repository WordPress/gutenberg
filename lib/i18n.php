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
 *
 * @param  string $domain Translation domain.
 *
 * @return array
 */
function gutenberg_get_jed_locale_data( $domain ) {
	$translations = get_translations_for_domain( $domain );

	$locale = array(
		'domain'      => $domain,
		'locale_data' => array(
			$domain => array(
				'' => array(
					'domain' => $domain,
					'lang'   => is_admin() ? get_user_locale() : get_locale(),
				),
			),
		),
	);

	if ( ! empty( $translations->headers['Plural-Forms'] ) ) {
		$locale['locale_data'][ $domain ]['']['plural_forms'] = $translations->headers['Plural-Forms'];
	}

	foreach ( $translations->entries as $msgid => $entry ) {
		$locale['locale_data'][ $domain ][ $msgid ] = $entry->translations;
	}

	$third_party_translation_domains = apply_filters( 'gutenberg_get_third_party_translation_domains', array() );
	if ( ! empty( $third_party_translation_domains ) ) {
		foreach ( $third_party_translation_domains as $third_party_domain ) {
			$translations = get_translations_for_domain( $third_party_domain );
			if ( ! $translations ) {
				continue;
			}
			foreach ( $translations->entries as $msgid => $entry ) {
				$locale['locale_data'][ $domain ][ $msgid ] = $entry->translations;
				$locale['locale_data'][ $domain ]['domain'] = $third_party_domain;
			}
		}
	}

	return $locale;
}

/**
 * Load plugin text domain for translations.
 *
 * @since 0.1.0
 */
function gutenberg_load_plugin_textdomain() {
	load_plugin_textdomain(
		'gutenberg',
		false,
		dirname( plugin_basename( __FILE__ ) ) . '/languages/'
	);
}
add_action( 'plugins_loaded', 'gutenberg_load_plugin_textdomain' );
