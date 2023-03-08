<?php
/**
 * Patches resources loaded by the block editor page
 * to include Template Part posts.
 *
 * @package gutenberg
 */

/**
 * Preloads requests needed for common Template Part posts
 *
 * @param array $preload_paths    Preload paths to be filtered.
 * @return array
 */
function gutenberg_preload_template_parts( $preload_paths ) {

	$theme_slug = wp_get_theme()->get_stylesheet();

	$template_parts_rest_route = rest_get_route_for_post_type_items(
		'wp_template_part'
	);

	$standard_template_parts = array( 'header', 'footer' );

	foreach ( $standard_template_parts as $template_part ) {
		$preload_paths[] = array(
			$template_parts_rest_route . "/$theme_slug//$template_part?context=edit",
			'GET',
		);
	}

	return $preload_paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_preload_template_parts', 10, 2 );
