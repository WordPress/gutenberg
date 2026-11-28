<?php
/**
 * Plugin Name: Gutenberg Test Font Providers
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-font-providers
 */

/**
 * Registers a font provider whose face is limited to a Unicode range, the way a
 * script fallback plugin would supply it.
 */
function gutenberg_test_register_font_providers() {
	if ( ! function_exists( 'wp_register_font_provider' ) ) {
		return;
	}

	wp_register_font_provider(
		'gutenberg-test-font-provider',
		array(
			'label'        => 'Gutenberg Test Font Provider',
			'description'  => 'Supplies Exo 2 for Latin capital letters only.',
			'fontFamilies' => array(
				array(
					'name'       => 'Exo 2',
					'slug'       => 'gutenberg-test-exo-2',
					'fontFamily' => '"Exo 2", sans-serif',
					'fontFace'   => array(
						array(
							'fontFamily'   => 'Exo 2',
							'fontStyle'    => 'italic',
							'fontWeight'   => '600',
							'unicodeRange' => 'U+0041-005A',
							'src'          => plugins_url( 'gutenberg/test/e2e/assets/Exo2-SemiBoldItalic.woff2' ),
						),
					),
				),
			),
		)
	);
}
add_action( 'init', 'gutenberg_test_register_font_providers' );
