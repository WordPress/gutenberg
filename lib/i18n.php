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
 * Register script handle and chunk name for the given domain
 *
 * Registered scripts will be matched against the generated `translation-map.json` for any i18n strings to be loaded
 * when the script with the given handle is enqueued.
 *
 * @since 2.6.x
 *
 * @param string $handle     Name of the script being registered.
 * @param string $domain     i18n domain.
 */
function gutenberg_register_script_i18n( $handle, $domain = '' ) {
	static $gb_scripts;
	if ( ! $gb_scripts instanceof GB_Scripts ) {
		$gb_scripts = new GB_Scripts();
	}
	$gb_scripts->register_script_i18n( $handle, $domain );
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
	// gutenberg doesn't use domain in its js strings but has a domain set by virtue of being a plugin in the WordPress
	// plugin repository.  So we need to use that to retrieve the gutenberg translations. When GB is merged to WordPress
	// core this will be unnecessary.
	$domain       = $domain ? $domain : 'gutenberg';
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
