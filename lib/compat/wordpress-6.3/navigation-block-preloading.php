<?php

/**
 * Adds the preload paths registered in Core (`edit-form-blocks.php`).
 *
 * @param array                   $preload_paths    Preload paths to be filtered.
 * @param WP_Block_Editor_Context $context The current block editor context.
 * @return array
 */
function gutenberg_preload_navigation_permissions( $preload_paths, $context ) {

	$navigation_rest_route = rest_get_route_for_post_type_items(
		'wp_navigation'
	);

	// Preload the OPTIONS request for all Navigation posts request.
	$preload_paths[] = array( $navigation_rest_route, 'OPTIONS' );

	// Preload the GET request for all Navigation posts request.
	$preload_paths[] = array(
		$navigation_rest_route . '?context=edit&per_page=100&status[0]=publish&status[1]=draft&_locale=user',
		'GET',
	);

	return $preload_paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_preload_navigation_permissions', 10, 2 );
