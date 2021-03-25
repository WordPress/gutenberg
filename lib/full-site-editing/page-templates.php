<?php
/**
 * Support for page templates.
 *
 * @package gutenberg
 */

/**
 * Load the page templates in Gutenberg.
 *
 * @param array    $templates Page templates.
 * @param WP_Theme $theme     WP_Theme instance.
 * @param WP_Post  $post      The post being edited, provided for context, or null.
 * @param string   $post_type Post type to get the templates for.
 * @return array (Maybe) modified page templates array.
 */
function gutenberg_load_block_page_templates( $templates, $theme, $post, $post_type ) {
	if ( ! gutenberg_is_fse_theme() ) {
		return $templates;
	}

	$data             = WP_Theme_JSON_Resolver::get_theme_data()->get_custom_templates();
	$custom_templates = array();
	if ( isset( $data ) ) {
		foreach ( $data  as $key => $template ) {
			if ( ( ! isset( $template['postTypes'] ) && 'page' === $post_type ) ||
				( isset( $template['postTypes'] ) && in_array( $post_type, $template['postTypes'], true ) )
			) {
				$custom_templates[ $key ] = $template['title'];
			}
		}
	}

	return $custom_templates;
}
add_filter( 'theme_templates', 'gutenberg_load_block_page_templates', 10, 4 );
