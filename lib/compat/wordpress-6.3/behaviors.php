<?php
/**
 * Behaviors.
 *
 * @package gutenberg
 */

add_filter(
	'block_editor_settings_all',
	function( $settings ) {

		// Make sure to also get the value from the core theme.json file.
		$settings['behaviors'] = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_data()['behaviors'];
		return $settings;
	},
	PHP_INT_MAX
);
