<?php
/**
 * Register two font families through the `wp_register_webfont` function.
 *
 * @package gutenberg
 */

add_action(
	'after_setup_theme',
	function() {
		wp_register_webfont(
			array(
				'font-family'  => 'Roboto',
				'font-style'   => 'normal',
				'font-stretch' => 'normal',
				'font-weight'  => '400',
				'src'          => get_theme_file_uri( '/assets/fonts/Roboto-regular.ttf' ),
			)
		);

		wp_register_webfont(
			array(
				'font-family'  => 'Source Serif Pro',
				'font-style'   => 'normal',
				'font-stretch' => 'normal',
				'font-weight'  => '400',
				'src'          => get_theme_file_uri( '/assets/fonts/Source-Serif-Pro-Regular.ttf' ),
			)
		);
	}
);
