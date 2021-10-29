<?php
/**
 * Starte content API for block based themes.
 *
 * @package gutenberg
 */

/**
 * Setup starter content for fresh installations.
 *
 * @return void
 */
function gutenberg_setup_starter_contnet() {
	if ( get_option( 'fresh_site' ) ) {
		add_filter( 'get_template_content_from_file', 'gutenberg_inject_starter_content', 10, 2 );
	}
}
add_action( 'setup_theme', 'gutenberg_setup_starter_contnet' );

/**
 * Replaces template contents with starter templates on fresh installations.
 *
 * @param string $content Original template content.
 * @param string $slug    Template slug.
 * @return strong         Starter template content.
 */
function gutenberg_inject_starter_content( $content, $slug ) {
	$theme_support = get_theme_support( 'block-templates-stater' );
	if ( is_array( $theme_support ) && ! empty( $theme_support[0] ) && is_array( $theme_support[0] ) ) {
		$config = $theme_support[0];
	} else {
		$config = array();
	}

	// Check if we have starter content for this template.
	if ( ! array_key_exists( $slug, $config ) ) {
		return $content;
	}

	return $config[ $slug ];
}
