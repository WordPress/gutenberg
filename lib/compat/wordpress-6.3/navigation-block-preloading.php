<?php
/**
 * Patches resources loaded by the block editor page
 * to include Navigation posts.
 *
 * @package gutenberg
 */

/**
 * Preloads requests needed for Navigation posts
 *
 * @param array                   $preload_paths    Preload paths to be filtered.
 * @param WP_Block_Editor_Context $context          The current block editor context.
 * @return array
 */
function gutenberg_preload_navigation_posts( $preload_paths, $context ) {

	// Limit to the Site Editor.
	if ( ! empty( $context->name ) && 'core/edit-site' !== $context->name ) {
		return $preload_paths;
	}

	$navigation_rest_route = rest_get_route_for_post_type_items(
		'wp_navigation'
	);

	// Preload the OPTIONS request for all Navigation posts request.
	$preload_paths[] = array( $navigation_rest_route, 'OPTIONS' );

	// Preload the GET request for ALL 'published' or 'draft' Navigation posts.
	$preload_paths[] = array(
		add_query_arg(
			array(
				'context'   => 'edit',
				'per_page'  => 100,
				'order'     => 'desc',
				'orderby'   => 'date',
				'_locale'   => 'user',
				// array indices are required to avoid query being encoded and not matching in cache.
				'status[0]' => 'publish',
				'status[1]' => 'draft',
			),
			$navigation_rest_route
		),
		'GET',
	);

	// Preload request for all menus in Browse Mode sidebar "Navigation" section.
	$preload_paths[] = array(
		add_query_arg(
			array(
				'context'   => 'edit',
				'per_page'  => 100,
				'order'     => 'desc',
				'orderby'   => 'date',
				'status[0]' => 'publish',
				'status[1]' => 'draft',
			),
			$navigation_rest_route
		),
		'GET',
	);

	return $preload_paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_preload_navigation_posts', 10, 2 );
