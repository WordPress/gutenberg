<?php
/**
 * Plugin Name: Gutenberg Test Block Context
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-block-context
 */

/**
 * Enqueues a custom script for the plugin.
 */
function gutenberg_test_enqueue_block_context_script() {
	wp_enqueue_script(
		'gutenberg-test-block-context',
		plugins_url( 'block-context/index.js', __FILE__ ),
		array(
			'wp-block-editor',
			'wp-blocks',
			'wp-element',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'block-context/index.js' ),
		true
	);
}
add_action( 'init', 'gutenberg_test_enqueue_block_context_script' );

/**
 * Registers plugin test context blocks.
 */
function gutenberg_test_register_context_blocks() {
	register_block_type(
		'gutenberg/test-context-provider',
		array(
			'attributes'      => array(
				'recordId' => array(
					'type'    => 'number',
					'default' => 0,
				),
			),
			'providesContext' => array(
				'gutenberg/recordId' => 'recordId',
			),
		)
	);

	register_block_type(
		'gutenberg/test-context-consumer',
		array(
			'context'         => array( 'gutenberg/recordId' ),
			'render_callback' => function( $block ) {
				$record_id = $block->context['gutenberg/recordId'];

				if ( ! is_int( $record_id ) ) {
					throw new Exception( 'Expected numeric recordId' );
				}

				return 'The record ID is: ' . filter_var( $record_id, FILTER_VALIDATE_INT );
			},
		)
	);
}
add_action( 'init', 'gutenberg_test_register_context_blocks' );
