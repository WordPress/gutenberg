<?php
/**
 * Tab Panels Block
 *
 * @package WordPress
 */

/**
 * Render callback for core/tab-panels.
 *
 * @param array     $attributes Block attributes.
 * @param string    $content    Block content.
 * @param \WP_Block $block      WP_Block instance.
 *
 * @return string Updated HTML.
 */
function block_core_tab_panels_render_callback( array $attributes, string $content, \WP_Block $block ): string {
	// Simple passthrough - just return the content with innerblocks
	return $content;
}

/**
 * Registers the `core/tab-panels` block on the server.
 *
 * @since 6.9.0
 */
function register_block_core_tab_panels() {
	register_block_type_from_metadata(
		__DIR__ . '/tab-panels',
		array(
			'render_callback' => 'block_core_tab_panels_render_callback',
		)
	);
}
add_action( 'init', 'register_block_core_tab_panels' );
