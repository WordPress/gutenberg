<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Activate RTL
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team / Yoav Farhi
 *
 * Based on the code from http://wordpress.org/extend/plugins/rtl-tester/.
 *
 * @package gutenberg-test-plugin-activate-rtl
 */

/**
 * Set the locale's and styles' text direction to RTL.
 */
function gutenberg_test_plugin_activate_rtl_set_direction() {
	global $wp_locale, $wp_styles;

	$wp_locale->text_direction = 'rtl';
	if ( ! is_a( $wp_styles, 'WP_Styles' ) ) {
		$wp_styles = new WP_Styles();
	}
	$wp_styles->text_direction = 'rtl';
}

add_action( 'init', 'gutenberg_test_plugin_activate_rtl_set_direction' );
