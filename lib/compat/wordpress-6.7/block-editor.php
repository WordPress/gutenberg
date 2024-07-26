<?php
/**
 * Block Editor API.
 *
 * @package Gutenberg
 * @subpackage Editor
 */


/**
 * Updates block editor settings for WordPress 6.7.
 *
 * @param array $settings Existing block editor settings.
 *
 * @return array New block editor settings.
 */
function gutenberg_get_block_editor_settings_6_7( $settings ) {
	/*
	* Locale settings.
	*
	* Add user and site locale settings to block editor settings.
	* Because the current value of is_rtl() refers to the current locale,
	* we need to switch to the site locale to get the correct is_rtl() value for the site.
	*
	* Note: settings.isRTL is already available to determine the direction of the editor interface.
	*
	* Core backport notes:
	* - This could be added to block editor settings, e.g., $editor_settings array in /wp-includes/block-editor.php#L214
	* - Potential for abstracting this into a separate function in src/wp-includes/l10n.php, e.g., wp_get_site_locale() or something.
	*
	*/
	// Current user locale in the block editor.
	$current_user_locale = get_user_locale();
	$current_user_is_rtl = is_rtl();

	// Current site locale.
	$current_site_locale = get_locale();
	$current_site_is_rtl = $current_user_is_rtl;

	if ( $current_user_locale !== $current_site_locale ) {
		$switched_locale = switch_to_locale( $current_site_locale );
		if ( is_locale_switched() && $switched_locale ) {
			$current_site_is_rtl = is_rtl();
			restore_previous_locale();
		}
	}

	$settings['locale'] = array(
		'site' => array(
			'lang'  => $current_site_locale,
			'isRTL' => $current_site_is_rtl,
		),
		'user' => array(
			'lang'  => $current_user_locale,
			'isRTL' => $current_user_is_rtl,
		),
	);

	return $settings;
}

add_filter( 'block_editor_settings_all', 'gutenberg_get_block_editor_settings_6_7', 10 );
