<?php
/**
 * Support for custom templates.
 *
 * @package gutenberg
 */

/**
 * Load the custom templates in Gutenberg.
 *
 * @param array $templates Theme custom templates.
 * @return array Modified templates.
 */
function gutenberg_load_fse_custom_templates( $templates ) {
	if ( ! gutenberg_is_fse_theme() ) {
		return $templates;
	}
	$config_file = locate_template( 'experimental-theme.json' );
	if ( ! file_exists( $config_file ) ) {
		return $templates;
	}
	$data = json_decode(
		file_get_contents( $config_file ),
		true
	);

	return isset( $data['customTemplates'] ) ? $data['customTemplates'] : array();
}
add_filter( 'theme_page_templates', 'gutenberg_load_fse_custom_templates' );
