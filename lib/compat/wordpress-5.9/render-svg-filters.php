<?php
/**
 * Renders the SVG filters for duotone.
 *
 * @package gutenberg
 */

/**
 * Render the SVG filters supplied by theme.json.
 *
 * Note that this doesn't render the per-block user-defined
 * filters which are handled by duotone.php.
 *
 * Safari doesn't render SVG filters defined in data URIs,
 * and SVG filters won't render in the head of a document,
 * so the next best place to put the SVG is in the footer.
 */
function gutenberg_experimental_global_styles_render_svg_filters() {
	$filters = wp_get_global_styles_svg_filters();
	if ( ! empty( $filters ) ) {
		echo $filters;
	}
}

add_action(
	is_admin() ? 'admin_footer' : 'wp_footer',
	'gutenberg_experimental_global_styles_render_svg_filters'
);
