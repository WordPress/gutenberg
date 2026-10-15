<?php
/**
 * Preload paths for the DataForm-based editor inspector experiment.
 *
 * @package gutenberg
 */

/**
 * Filters the block editor preload paths.
 *
 * @param array                   $paths   REST API paths to preload.
 * @param WP_Block_Editor_Context $context Block editor context.
 * @return array Filtered preload paths.
 */
function gutenberg_dataform_inspector_preload_paths( $paths, $context ) {
	if ( 'core/edit-post' !== $context->name || ! isset( $context->post ) ) {
		return $paths;
	}

	// `DataFormPostSummary` requests the post type form config through
	// `useViewConfig` with `fields: [ 'form' ]`, so the preload path must
	// match the resulting `_fields=form` REST API request.
	$paths[] = '/wp/v2/view-config?kind=postType&name=' . $context->post->post_type . '&_fields=form';

	// `DataFormPostSummary` reads the fields of the post type through
	// `useFields`, from the `wp/v2/entity-fields` route.
	if ( function_exists( '_gutenberg_get_post_type_fields_preload_paths' ) ) {
		$paths = array_merge( $paths, _gutenberg_get_post_type_fields_preload_paths( array( $context->post->post_type ) ) );
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_dataform_inspector_preload_paths', 10, 2 );
