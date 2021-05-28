<?php
/**
 * Support for page templates.
 *
 * @package gutenberg
 */

/**
 * Load the page templates in Gutenberg.
 *
 * @param array $templates Page templates.
 * @return array (Maybe) modified page templates array.
 */
function gutenberg_load_block_page_templates( $templates ) {
	if ( ! gutenberg_supports_block_templates() ) {
		return $templates;
	}

	$block_templates = gutenberg_get_block_templates( array(), 'wp_template' );
	foreach ( $block_templates as $template ) {
		// TODO: exclude templates that are not concerned by the current post type.
		$templates[ $template->slug ] = $template->title;
	}

	return $templates;
}
add_filter( 'theme_templates', 'gutenberg_load_block_page_templates' );
