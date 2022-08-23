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
 * filters which are handled by wp_render_duotone_support,
 * but it should be rendered before the filtered content
 * in the body to satisfy Safari's rendering quirks.
 */
function gutenberg_global_styles_render_svg_filters() {
	/*
	 * When calling via the in_admin_header action, we only want to render the
	 * SVGs on block editor pages.
	 */
	if (
		is_admin() &&
		! get_current_screen()->is_block_editor()
	) {
		return;
	}

	$filters = gutenberg_get_global_styles_svg_filters();
	if ( ! empty( $filters ) ) {
		echo $filters;
	}
}

// Override actions introduced in 5.9.1 if they exist.
remove_action( 'wp_body_open', 'wp_global_styles_render_svg_filters' );
remove_action( 'in_admin_header', 'wp_global_styles_render_svg_filters' );
add_action( 'wp_body_open', 'gutenberg_global_styles_render_svg_filters' );
add_action( 'in_admin_header', 'gutenberg_global_styles_render_svg_filters' );
