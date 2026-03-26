<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Enable Templates UI
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-enable-templates-ui
 */

/**
 * Enable Templates & Template Parts post type UI during e2e testing.
 */


function gutenberg_enable_templates_ui() {
	add_filter(
		'register_post_type_args',
		static function ( $args, $name ) {
			if ( in_array( $name, array( 'wp_template', 'wp_template_part' ), true ) ) {
				$args['show_ui'] = wp_is_block_theme();
			}
			return $args;
		},
		20,
		2
	);
}
add_action( 'setup_theme', 'gutenberg_enable_templates_ui' );
