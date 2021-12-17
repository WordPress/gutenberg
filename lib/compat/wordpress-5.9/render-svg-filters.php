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
 * filters which are handled by duotone.php, but it should
 * be rendered in the same location as those to satisfy
 * Safari's rendering quirks.
 */
function gutenberg_experimental_global_styles_render_svg_filters() {
	$filters = wp_get_global_styles_svg_filters();
	if ( ! empty( $filters ) ) {
		echo $filters;
	}
}

add_action(
	'wp_body_open',
	'gutenberg_experimental_global_styles_render_svg_filters'
);
