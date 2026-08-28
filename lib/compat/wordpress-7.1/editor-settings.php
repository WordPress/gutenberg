<?php
/**
 * Editor settings additions for WordPress 7.1.
 *
 * @since 7.1.0
 * @package gutenberg
 * @subpackage Editor
 */

/**
 * Adds the site locale's language attribute and text direction to the block
 * editor settings.
 *
 * The block editor admin screens run in the user's locale, so by default the
 * editor canvas inherits the user's language and text direction. The canvas
 * represents the site's front end, so it should instead reflect the site
 * locale. These settings let the editor set the correct `lang` and `dir` on the
 * canvas iframe when the user and site locales differ.
 *
 * @param array $settings The block editor settings.
 * @return array The filtered block editor settings.
 */
function gutenberg_add_site_locale_to_editor_settings( $settings ) {
	// In the admin the current locale is the user locale, so `get_bloginfo()`
	// and `is_rtl()` describe the user locale. When the site locale differs,
	// switch to it to read the site's language attribute and text direction.
	$site_lang   = get_bloginfo( 'language' );
	$site_is_rtl = is_rtl();

	if ( get_user_locale() !== get_locale() ) {
		if ( switch_to_locale( get_locale() ) ) {
			$site_lang   = get_bloginfo( 'language' );
			$site_is_rtl = is_rtl();
			restore_previous_locale();
		} else {
			// The switch fails when the site locale's translation files are
			// not installed. Without them the front end falls back to the
			// locale code for the `lang` attribute and to left-to-right text,
			// so report those values rather than the user locale's.
			$site_lang   = str_replace( '_', '-', get_locale() );
			$site_is_rtl = false;
		}
	}

	$settings['siteLang']  = $site_lang;
	$settings['siteIsRTL'] = $site_is_rtl;

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_site_locale_to_editor_settings' );
