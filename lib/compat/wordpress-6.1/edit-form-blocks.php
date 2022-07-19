<?php
/**
 * Patches resources loaded by the block editor page.
 *
 * @package gutenberg
 */

/**
 * Adds the preload paths registered in Core (`edit-form-blocks.php`).
 *
 * @param array                   $preload_paths    Preload paths to be filtered.
 * @param WP_Block_Editor_Context $context The current block editor context.
 * @return array
 */
function gutenberg_preload_template_permissions( $preload_paths, $context ) {
	if ( ! empty( $context->post ) ) {
		$preload_paths[] = array( rest_get_route_for_post_type_items( 'wp_template' ), 'OPTIONS' );
		$preload_paths[] = array( '/wp/v2/settings', 'OPTIONS' );
	}

	return $preload_paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_preload_template_permissions', 10, 2 );
