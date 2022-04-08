<?php
/**
 * Register two font faces of Roboto through the `wp_register_webfont` function.
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
				'src'          => get_theme_file_uri( '/assets/fonts/Roboto-Regular.ttf' ),
			)
		);

		wp_register_webfont(
			array(
				'font-family'  => 'Roboto',
				'font-style'   => 'bold',
				'font-stretch' => 'normal',
				'font-weight'  => '900',
				'src'          => get_theme_file_uri( '/assets/fonts/Roboto-Bold.ttf' ),
			)
		);
	}
);
