<?php
/**
 * Support for page templates.
 *
 * @package gutenberg
 */

/**
 * Load the page templates in Gutenberg.
 *
 * @param array $templates Theme page templates.
 * @return array Modified templates.
 */
function gutenberg_load_fse_page_templates( $templates ) {
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
		foreach ( $data['pageTemplates']  as $key => $page_emplate ) {
			$page_templates[ $key ] = $page_emplate['title'];
		}
	}

	return $page_templates;
}
add_filter( 'theme_page_templates', 'gutenberg_load_fse_page_templates' );
