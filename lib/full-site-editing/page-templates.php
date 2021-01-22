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
	$config_file = locate_template( 'experimental-theme.json' );
	if ( ! file_exists( $config_file ) ) {
		return $templates;
	}
	$data           = json_decode(
		file_get_contents( $config_file ),
		true
	);
	$page_templates = array();
	if ( isset( $data['pageTemplates'] ) ) {
		foreach ( $data['pageTemplates']  as $key => $page_template ) {
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
