<?php
/**
 * Patches resources loaded by the block editor page
 * to include Template Part posts.
 *
 * @package gutenberg
 */

/**
 * Preloads requests needed for common Template Part posts.
 *
 * @param array $preload_paths    Preload paths to be filtered.
 * @param array $context          Context for the preload paths.
 * @return array    the preload paths.
 */
function gutenberg_preload_template_parts( $preload_paths, $context ) {

	$template_part_preloading_limit = apply_filters( 'gutenberg_template_part_preloading_limit', 10 );

	// Limit to the Site Editor.
	if ( ! empty( $context->name ) && 'core/edit-site' !== $context->name ) {
		return $preload_paths;
	}

	// Get any template parts defined in theme.json.
	$theme_json_template_parts = WP_Theme_JSON_Resolver::get_merged_data()->get_template_parts();

	if ( ! is_array( $theme_json_template_parts ) ) {
		return $preload_paths;
	}

	// Only preload template parts that are in the "header" area.
	$theme_json_template_part_slugs = array_filter(
		array_keys( $theme_json_template_parts ),
		function( $slug ) use ( $theme_json_template_parts ) {
			return ! isset( $theme_json_template_parts[ $slug ]['area'] ) || 'header' === $theme_json_template_parts[ $slug ]['area'];
		}
	);

	if ( empty( $theme_json_template_part_slugs ) ) {
		return $preload_paths;
	}

	$theme_slug = get_stylesheet();

	$template_parts_rest_route = rest_get_route_for_post_type_items(
		'wp_template_part'
	);

	// Limit the length of theme_json_template_part_slugs to $template_part_preloading_limit
	$theme_json_template_part_slugs = array_slice( $theme_json_template_part_slugs, 0, $template_part_preloading_limit );

	foreach ( $theme_json_template_part_slugs as $template_part_slug ) {
		$preload_paths[] = array(
			$template_parts_rest_route . '/' . $theme_slug . '//' . $template_part_slug . '?context=edit',
			'GET',
		);
	}

	return $preload_paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_preload_template_parts', 10, 2 );
