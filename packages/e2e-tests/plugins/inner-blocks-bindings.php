<?php
/**
 * Plugin Name: Gutenberg Test Inner Blocks Bindings
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-inner-blocks-bindings
 */

/**
 * Registers a block bindings source that supplies inner blocks from a custom
 * field, in the server and in the client.
 */
function gutenberg_test_inner_blocks_bindings_registration() {
	register_meta(
		'post',
		'inner_blocks_field',
		array(
			'default'      => '',
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
		)
	);

	register_block_bindings_source(
		'testing/inner-blocks-field',
		array(
			'label'              => 'Inner Blocks Field',
			'get_value_callback' => function ( $source_args, $block_instance ) {
				if ( empty( $block_instance->context['postId'] ) ) {
					return null;
				}
				$value = get_post_meta( $block_instance->context['postId'], 'inner_blocks_field', true );
				return '' === $value ? null : $value;
			},
			'uses_context'       => array( 'postId', 'postType' ),
		)
	);

	wp_register_script(
		'gutenberg-test-inner-blocks-bindings',
		plugins_url( 'inner-blocks-bindings/index.js', __FILE__ ),
		array( 'wp-blocks', 'wp-core-data' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'inner-blocks-bindings/index.js' ),
		true
	);
}
add_action( 'init', 'gutenberg_test_inner_blocks_bindings_registration' );

/**
 * Enqueues the client source in the editor.
 */
function gutenberg_test_inner_blocks_bindings_enqueue() {
	wp_enqueue_script( 'gutenberg-test-inner-blocks-bindings' );
}
add_action( 'enqueue_block_editor_assets', 'gutenberg_test_inner_blocks_bindings_enqueue' );
