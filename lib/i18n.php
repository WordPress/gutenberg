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
 * Returns Jed-formatted localization data associated with the given chunk string.
 *
 * @param string $chunk
 * @param string $domain
 * @return array
 */
function gutenberg_get_jed_locale_data_for_domain_and_chunk( $chunk, $domain ) {
	return gutenberg_get_locale_data_matching_map(
		gutenberg_get_original_strings_for_chunk_from_map( $chunk ),
		gutenberg_get_jed_locale_data( $domain )
	);
}


/**
 * Get original base strings for translations from a provided map of strings to chunk.
 *
 * @param string $chunk
 * @param array $map  Optional. If not provided will attempt to get default map from a json file.
 * @return array|mixed
 */
function gutenberg_get_original_strings_for_chunk_from_map( $chunk, $map = array() ) {
	if ( empty( $map ) || ! is_array( $map ) ) {
		$map = json_decode(
			file_get_contents(gutenberg_dir_path() . 'translation-map.json' ),
			true
		);
	}
	return isset( $map[ $chunk ] ) ? $map[ $chunk ] : array();
}


/**
 * Returns all translations matching those in the provided set of strings
 *
 * @param array  $string_set   (set of original strings to retrieve from the provided $translations.
 * @param array  $translations
 * @return array
 */
function gutenberg_get_locale_data_matching_map( $string_set, $translations ) {
	if ( ! is_array( $string_set ) || ! is_array( $translations ) ) {
		return array();
	}
	return array_intersect_key( $translations, array_flip( $string_set ) );
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
 */
function gutenberg_load_plugin_textdomain() {
	load_plugin_textdomain(
		'gutenberg',
		false,
		plugin_basename( gutenberg_dir_path() ) . '/languages/'
	);
}
add_action( 'plugins_loaded', 'gutenberg_load_plugin_textdomain' );
