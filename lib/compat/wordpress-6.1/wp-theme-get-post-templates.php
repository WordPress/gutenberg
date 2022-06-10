<?php
/**
 * Support for custom block-based page templates.
 *
 * @package gutenberg
 */

/**
 * Load the page templates in Gutenberg.
 *
 * @param string[] $templates Page templates.
 * @param WP_Theme $theme     WP_Theme instance.
 * @param WP_Post  $post      The post being edited, provided for context, or null.
 * @param string   $post_type Post type to get the templates for.
 * @return array (Maybe) modified page templates array.
 */
function gutenberg_load_block_page_templates( $templates, $theme, $post, $post_type ) {
	if ( ! current_theme_supports( 'block-templates' ) ) {
		return $templates;
	}

	// `get_post_templates` in core uses `get_block_templates` and since we have updated the
	// logic in that function, we need to find and remove the templates that were added from
	// the core function. That is why we need to call both functions to find which templates
	// we should exclude from passed `$templates`.
	$gutenberg_block_templates = array_map(
		function( $template ) {
			return $template->slug;
		},
		gutenberg_get_block_templates( array( 'post_type' => $post_type ), 'wp_template' )
	);
	$core_block_templates      = array_map(
		function( $template ) {
			return $template->slug;
		},
		get_block_templates( array( 'post_type' => $post_type ), 'wp_template' )
	);
	$templates_to_exclude      = array_diff( $core_block_templates, $gutenberg_block_templates );
	foreach ( $templates_to_exclude as $template_slug ) {
		unset( $templates[ $template_slug ] );
	}
	return $templates;
}
add_filter( 'theme_templates', 'gutenberg_load_block_page_templates', 10, 4 );
