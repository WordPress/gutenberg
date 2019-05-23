<?php
/**
 * Temporary compatibility shims for features present in Gutenberg, pending
 * upstream commit to the WordPress core source repository. Functions here
 * exist only as long as necessary for corresponding WordPress support, and
 * each should be associated with a Trac ticket.
 *
 * @package gutenberg
 */

/**
 * Filters allowed CSS attributes to include `flex-basis`, included in saved
 * markup of the Column block.
 *
 * @since 5.7.0
 *
 * @param string[] $attr Array of allowed CSS attributes.
 *
 * @return string[] Filtered array of allowed CSS attributes.
 */
function gutenberg_safe_style_css_column_flex_basis( $attr ) {
	$attr[] = 'flex-basis';

	return $attr;
}
add_filter( 'safe_style_css', 'gutenberg_safe_style_css_column_flex_basis' );

/**
 * Adds an inline script to augment the default persistence method for data to
 * use WordPress client user settings.
 *
 * @since 5.8.0
 */
function gutenberg_settings_cookie_persistence() {
	// Ensure `utils` is a dependency, which makes available `userSettings`,
	// `getUserSetting`, and `setUserSettings` window globals.
	$data_script = wp_scripts()->query( 'wp-data', 'registered' );
	if ( ! in_array( 'utils', $data_script->deps ) ) {
		$data_script->deps[] = 'utils';
	}

	wp_add_inline_script(
		'wp-data',
		"
( function() {
	wp.data.use( wp.data.plugins.persistence, {
		storage: {
			getItem: function() {
				return (
					window.getUserSetting( 'dataState' ) ||
					localStorage.getItem( 'WP_DATA_USER_' + window.userSettings.uid )
				);
			},
			setItem: function( key, value ) {
				window.setUserSetting( 'dataState', value );
			}
		}
	} );
} )();"
	);
}
add_action( 'admin_enqueue_scripts', 'gutenberg_settings_cookie_persistence' );
