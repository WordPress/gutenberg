<?php
/**
 * Plugin Name: Gutenberg Test Inner Blocks Bindings
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-inner-blocks-bindings
 */

/**
 * Registers a read-only block bindings source that supplies a paragraph with
 * the text of its arguments as inner blocks, in the server and in the client.
 */
function gutenberg_test_inner_blocks_bindings_register() {
	register_block_bindings_source(
		'testing/inner-blocks',
		array(
			'label'              => 'Test inner blocks',
			'get_value_callback' => function ( $source_args ) {
				if ( ! isset( $source_args['text'] ) || ! is_string( $source_args['text'] ) ) {
					return null;
				}
				return '<!-- wp:paragraph --><p>' . esc_html( $source_args['text'] ) . '</p><!-- /wp:paragraph -->';
			},
		)
	);

	wp_register_script(
		'gutenberg-test-inner-blocks-bindings',
		plugins_url( 'inner-blocks-bindings/index.js', __FILE__ ),
		array( 'wp-blocks', 'wp-escape-html' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'inner-blocks-bindings/index.js' ),
		true
	);
}
add_action( 'init', 'gutenberg_test_inner_blocks_bindings_register' );

/**
 * Enqueues the client side of the source in the editor.
 */
function gutenberg_test_inner_blocks_bindings_enqueue() {
	wp_enqueue_script( 'gutenberg-test-inner-blocks-bindings' );
}
add_action( 'enqueue_block_editor_assets', 'gutenberg_test_inner_blocks_bindings_enqueue' );
