<?php
/**
 * Support for custom block-based page templates.
 *
 * @package gutenberg
 */

// Only run any of the code in this file if the version is less than 5.9.
// wp_list_users was introduced in 5.9.
if ( ! function_exists( 'wp_list_users' ) ) {
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

		$block_templates = gutenberg_get_block_templates( array( 'post_type' => $post_type ), 'wp_template' );
		foreach ( $block_templates as $template ) {
			$templates[ $template->slug ] = $template->title;
		}

		return $templates;
	}
	add_filter( 'theme_templates', 'gutenberg_load_block_page_templates', 10, 4 );
}
