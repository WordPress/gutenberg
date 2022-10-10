<?php
/**
 * Compatibility fixes for WP 6.2 and Site Editor.
 *
 * It can be removed after the minimum required WP version is 6.2
 *
 * @package WordPress
 */

/**
 * Preload theme variations in site editor.
 *
 * @param string[]                $preload_paths  Array of paths to preload.
 * @param WP_Block_Editor_Context $block_editor_context The current block editor context.
 *
 * @return string[] Preload paths.
 */
function filter_block_editor_rest_api_preload_paths( $preload_paths, $block_editor_context ) {
	if ( isset( $block_editor_context->name ) && 'core/edit-site' === $block_editor_context->name ) {
		$active_theme    = wp_get_theme()->get_stylesheet();
		$preload_paths[] = '/wp/v2/global-styles/themes/' . $active_theme . '/variations';
	}

	return $preload_paths;
}

add_filter( 'block_editor_rest_api_preload_paths', 'filter_block_editor_rest_api_preload_paths', 10, 2 );
