<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 6.1.0 becomes the lowest
 * supported version by this plugin.
 *
 * @package gutenberg
 */

/**
 * Updates the list of default template types, containing their
 * localized titles and descriptions.
 *
 * We will only need to update `get_default_block_template_types` function.
 *
 * @param array $default_template_types The default template types.
 *
 * @return array The default template types.
 */
function gutenberg_get_default_block_template_types( $default_template_types ) {
	if ( isset( $default_template_types['single'] ) ) {
		$default_template_types['single'] = array(
			'title'       => _x( 'Single', 'Template name', 'gutenberg' ),
			'description' => __( 'The default template for displaying any single post or attachment.', 'gutenberg' ),
		);
	}
	return $default_template_types;
}
add_filter( 'default_template_types', 'gutenberg_get_default_block_template_types', 10 );
