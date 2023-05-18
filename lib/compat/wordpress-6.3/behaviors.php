<?php
/**
 * Behaviors.
 *
 * @package gutenberg
 */

add_filter(
	'block_editor_settings_all',
	function( $settings ) {
		$theme_data = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_data();
		if ( array_key_exists( 'behaviors', $theme_data ) ) {
			$settings['behaviors'] = $theme_data['behaviors'];
		}
		// TODO: Make sure to also get the value from the core theme.json file.
		return $settings;
	},
	PHP_INT_MAX
);
