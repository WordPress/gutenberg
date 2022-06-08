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

	// `$templates` in core come from `get_block_templates`, but since we have udpated the logic there,
	// we need to use and return the templates from `gutenberg_get_block_templates`.
	$block_templates = gutenberg_get_block_templates( array( 'post_type' => $post_type ), 'wp_template' );
	$new_templates   = array();
	foreach ( $block_templates as $template ) {
		$new_templates[ $template->slug ] = $template->title;
	}
	return $new_templates;
}
add_filter( 'theme_templates', 'gutenberg_load_block_page_templates', 10, 4 );
