<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Registers the extension of the WP_REST_Posts_Controller class,
 * to add support for post formats.
 * - Hardcoded the 'post' post type for now.
 */
function gutenberg_post_format_rest_posts_controller() {
	$posts_controller = new Gutenberg_REST_Posts_Controller_6_7( 'post' );
	$posts_controller->register_routes();
}

add_action( 'rest_api_init', 'gutenberg_post_format_rest_posts_controller' );

/**
 * Update the preload paths registered in Core (`site-editor.php` or `edit-form-blocks.php`).
 *
 * @param array                   $paths REST API paths to preload.
 * @param WP_Block_Editor_Context $context Current block editor context.
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_6_7( $paths, $context ) {
	if ( 'core/edit-site' === $context->name ) {
		// Fixes post type name. It should be `type/wp_template_part`.
		$parts_key = array_search( '/wp/v2/types/wp_template-part?context=edit', $paths, true );
		if ( false !== $parts_key ) {
			$paths[ $parts_key ] = '/wp/v2/types/wp_template_part?context=edit';
		}
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_6_7', 10, 2 );
