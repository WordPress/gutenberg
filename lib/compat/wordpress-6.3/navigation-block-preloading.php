<?php

/**
 * Adds the preload paths registered in Core (`edit-form-blocks.php`).
 *
 * @param array                   $preload_paths    Preload paths to be filtered.
 * @param WP_Block_Editor_Context $context The current block editor context.
 * @return array
 */
function gutenberg_preload_navigation_permissions( $preload_paths, $context ) {

    $preload_paths[] = array( rest_get_route_for_post_type_items( 'wp_navigation' ), 'OPTIONS' );

	$preload_paths[] = rest_get_route_for_post_type_items( 'wp_navigation' );
	// add /wp/v2/navigation?context=edit&per_page=-1&status%5B0%5D=publish&status%5B1%5D=draft to preload paths array
	$preload_paths[] = array(
		rest_get_route_for_post_type_items(
			'wp_navigation',
		),
		array(
			'context'  => 'edit',
			'per_page' => '-1',
			'status'   => array( 'publish, draft' ),
		),

	);

	// add /wp/v2/navigation?_locale=user&context=edit&per_page=100&status%5B0%5D=publish&status%5B1%5D=draft to preload paths array
	$preload_paths[] = array(
		rest_get_route_for_post_type_items(
			'wp_navigation',
		),
		array(
			'_locale'  => 'user',
			'context'  => 'edit',
			'per_page' => '100',
			'status'   => array( 'publish, draft' ),
		),

	);

	echo '<pre>';
	var_dump( $preload_paths );
	echo '</pre>';

	return $preload_paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_preload_navigation_permissions', 10, 2 );
