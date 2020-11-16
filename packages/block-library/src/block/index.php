<?php
/**
 * Server-side rendering of the `core/block` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/block` block on server if safe to do so.
 *
 * @param array $attributes The block attributes.
 * @param string $content The block content.
 * @param object $block The block being rendered.
 *
 * @return string Rendered HTML of the referenced block.
 */
function render_block_core_block_safely( $attributes, $content, $block ) {
	if ( empty( $attributes['ref'] ) ) {
		return '';
	}
	if ( gutenberg_process_this_content( $attributes['ref'], $block->name ) ) {
		$html = render_block_core_block( $attributes );
		gutenberg_clear_processed_content();
	} else {
		$html = gutenberg_report_recursion_error();
	}
	return $html;
}

/**
 * Renders the `core/block` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Rendered HTML of the referenced block.
 */
function render_block_core_block( $attributes ) {
	$reusable_block = get_post($attributes['ref']);
	if (!$reusable_block || 'wp_block' !== $reusable_block->post_type) {
		return '';
	}

	if ('publish' !== $reusable_block->post_status || !empty($reusable_block->post_password)) {
		return '';
	}

	return( do_blocks($reusable_block->post_content) );
}

/**
 * Registers the `core/block` block.
 */
function register_block_core_block() {
	register_block_type_from_metadata(
		__DIR__ . '/block',
		array(
			'render_callback' => 'render_block_core_block_safely',
		)
	);
}
add_action( 'init', 'register_block_core_block' );
