<?php
/**
 * Plugin Name: Gutenberg Test Block Context
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-block-context
 */

/**
 * Registers plugin test context blocks.
 */
function gutenberg_test_register_context_blocks() {
	wp_register_script(
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

	register_block_type(
		'gutenberg/test-context-provider',
		array(
			'attributes'            => array(
				'recordId' => array(
					'type'    => 'number',
					'default' => 0,
				),
			),
			'provides_context'      => array(
				'gutenberg/recordId' => 'recordId',
			),
			'editor_script_handles' => array( 'gutenberg-test-block-context' ),
		)
	);

	register_block_type(
		'gutenberg/test-context-consumer',
		array(
			'uses_context'          => array(
				'gutenberg/recordId',
				'postId',
				'postType',
			),
			'render_callback'       => static function ( $attributes, $content, $block ) {
				$ordered_context = array(
					$block->context['gutenberg/recordId'],
					$block->context['postId'],
					$block->context['postType'],
				);

				return '<p>' . implode( ',', $ordered_context ) . '</p>';
			},
			'editor_script_handles' => array( 'gutenberg-test-block-context' ),
		)
	);
}
add_action( 'init', 'gutenberg_test_register_context_blocks' );
