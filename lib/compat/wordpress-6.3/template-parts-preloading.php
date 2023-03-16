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
function gutenberg_preload_template_parts( $preload_paths, $context ) {

	// Limit to the Site Editor.
	if ( ! empty( $context->name ) && 'core/edit-site' !== $context->name ) {
		return $preload_paths;
	}

	// Get any template parts defined in theme.json.
	$theme_json_template_parts = WP_Theme_JSON_Resolver::get_merged_data()->get_template_parts();

	if ( ! is_array( $theme_json_template_parts ) ) {
		return $preload_paths;
	}

	$theme_json_template_part_slugs = array_keys( $theme_json_template_parts );

	$theme_slug = get_stylesheet();

	$template_parts_rest_route = rest_get_route_for_post_type_items(
		'wp_template_part'
	);

	$standard_template_parts = array( 'header', 'footer' );

	foreach ( $theme_json_template_part_slugs as $template_part_slug ) {
		$preload_paths[] = array(
			$template_parts_rest_route . "/$theme_slug//$template_part_slug?context=edit",
			'GET',
		);
	}

	return $preload_paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_preload_template_parts', 10, 2 );
