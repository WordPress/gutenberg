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
 * @return array (Maybe) modified page templates array.
 */
function gutenberg_load_block_page_templates( $templates, $theme, $post ) {
	if ( ! gutenberg_is_fse_theme() ) {
		return $templates;
	}

	$resolver       = new WP_Theme_JSON_Resolver();
	$data           = $resolver->get_theme_data()->get_page_templates();
	$page_templates = array();
	if ( isset( $data ) ) {
		foreach ( $data  as $key => $page_template ) {
			if ( ( ! isset( $page_template['postTypes'] ) && 'page' === $post->post_type ) ||
				( isset( $page_template['postTypes'] ) && in_array( $post->post_type, $page_template['postTypes'], true ) )
			) {
				$page_templates[ $key ] = $page_template['title'];
			}
		}
	}

	return $page_templates;
}
add_filter( 'theme_post_templates', 'gutenberg_load_block_page_templates', 10, 3 );
add_filter( 'theme_page_templates', 'gutenberg_load_block_page_templates', 10, 3 );
