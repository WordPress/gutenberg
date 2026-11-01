<?php
/**
 * Preload paths for the site editor.
 *
 * @package gutenberg
 */

/**
 * Adds the requests the site editor makes before its first render, so that
 * its kickoff in `packages/edit-site/src/index.jsx` is served from the
 * preload cache.
 *
 * @since 7.3.0
 *
 * @param array                   $paths   REST API paths to preload.
 * @param WP_Block_Editor_Context $context Block editor context.
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_7_3( $paths, $context ) {
	if ( 'core/edit-site' !== $context->name ) {
		return $paths;
	}

	// Read by `getEntitiesConfig( 'postType' )`.
	$paths[] = '/wp/v2/taxonomies?context=view';

	if ( isset( $context->post ) && 'page' === $context->post->post_type ) {
		$paths[] = '/wp/v2/types/page?context=edit';
		$paths[] = '/wp/v2/templates/lookup?slug=front-page';
		$paths[] = rest_get_route_for_post( $context->post ) . '/autosaves?context=edit';
		$paths[] = '/wp/v2/users/me';
		$paths[] = '/wp/v2/taxonomies?context=edit';
		$paths[] = array( '/wp/v2/templates', 'OPTIONS' );
		$paths[] = '/wp/v2/templates?context=edit&per_page=-1&post_type=page';
		$paths[] = '/wp/v2/view-config?kind=postType&name=page&_fields=form';
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_7_3', 10, 2 );
