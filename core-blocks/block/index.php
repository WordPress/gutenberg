<?php
/**
 * Server-side registration and rendering of the `core/block` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/block` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Rendered HTML of the referenced block.
 */
function gutenberg_render_core_reusable_block( $attributes ) {
	if ( empty( $attributes['ref'] ) ) {
		return '';
	}

	$shared_block = get_post( $attributes['ref'] );
	if ( ! $shared_block || 'wp_block' !== $shared_block->post_type ) {
		return '';
	}

	$blocks = gutenberg_parse_blocks( $shared_block->post_content );

	$block = array_shift( $blocks );
	if ( ! $block ) {
		return '';
	}

	return gutenberg_render_block( $block );
}

/**
 * Registers the `core/block` block on the server-side.
 *
 * @since 2.7.0
 */
function register_core_reusable_block() {
	wp_register_script(
		'core-reusable-block',
		gutenberg_url( '/build/__block_block.js' ),
		array( 'wp-blocks', 'wp-i18n', 'wp-components', 'wp-element', 'wp-data', 'wp-utils' )
	);

	wp_register_style(
		'core-reusable-block-editor',
		gutenberg_url( '/build/__block_block_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_block_editor.css' )
	);

	wp_style_add_data( 'core-reusable-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/block', array(
		'editor_style'    => 'core-reusable-block-editor',
		'editor_script'   => 'core-reusable-block',
		'attributes'      => array(
			'ref' => array(
				'type' => 'number',
			),
		),

		'render_callback' => 'gutenberg_render_core_reusable_block',
	) );
}

add_action( 'init', 'register_core_reusable_block' );
