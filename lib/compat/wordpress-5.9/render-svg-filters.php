<?php
/**
 * Renders the SVG filters for duotone.
 *
 * @package gutenberg
 */

/*
 * If wp_global_styles_render_svg_filters is defined, it means the plugin
 * is running on WordPress 5.9.1, so don't need to render the global styles
 * SVG filters as it was already done by WordPress core.
 */
if ( ! function_exists( 'wp_global_styles_render_svg_filters' ) ) {
	/**
	 * Render the SVG filters supplied by theme.json.
	 *
	 * Note that this doesn't render the per-block user-defined
	 * filters which are handled by wp_render_duotone_support,
	 * but it should be rendered before the filtered content
	 * in the body to satisfy Safari's rendering quirks.
	 */
	function wp_global_styles_render_svg_filters() {
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

		$filters = wp_get_global_styles_svg_filters();
		if ( ! empty( $filters ) ) {
			echo $filters;
		}
	}

	add_action(
		'wp_body_open',
		'wp_global_styles_render_svg_filters'
	);
	add_action(
		'in_admin_header',
		'wp_global_styles_render_svg_filters'
	);
}
