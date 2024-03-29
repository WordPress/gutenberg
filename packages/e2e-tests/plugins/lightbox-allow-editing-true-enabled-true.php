<?php
/**
 * Plugin Name: Lightbox Allow Editing True Enabled true
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-lightbox-allow-editing-true-enabled-true
 */

function filter_theme_json_theme( $theme_json ) {
	$new_data = array(
		'version'  => 2,
		'settings' => array(
			'blocks' => array(
				'core/image' => array(
					'lightbox' => array(
						'allowEditing' => true,
						'enabled'      => true,
					),
				),
			),
		),
	);
	// $theme_json = WP_Theme_JSON_Resolver::get_theme_data();
	return $theme_json->update_with( $new_data );
}
add_filter( 'wp_theme_json_data_theme', 'filter_theme_json_theme' );
