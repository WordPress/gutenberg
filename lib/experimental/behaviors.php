<?php
/**
 * Behaviors.
 *
 * Updates the block editor settings with the theme's behaviors.
 *
 * @package gutenberg
 */

add_filter(
	'block_editor_settings_all',
	function( $settings ) {
		$theme_data = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data()->get_data();
		if ( array_key_exists( 'behaviors', $theme_data ) ) {
			$settings['behaviors'] = $theme_data['behaviors'];
		}
		return $settings;
	},
	PHP_INT_MAX
);
