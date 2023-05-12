<?php
/**
 * Updates the script-loader.php file
 *
 * @package gutenberg
 */

/**
 * Registers interactivity runtime and vendor scripts to use with interactive blocks.
 *
 * @param WP_Scripts $scripts WP_Scripts instance.
 */
function gutenberg_register_interactivity_scripts( $scripts ) {
	gutenberg_override_script(
		$scripts,
		'wp-interactivity-runtime',
		gutenberg_url(
			'build/block-library/interactive-blocks/interactivity.min.js'
		),
		array( 'wp-interactivity-vendors' )
	);

	gutenberg_override_script(
		$scripts,
		'wp-interactivity-vendors',
		gutenberg_url(
			'build/block-library/interactive-blocks/vendors.min.js'
		)
	);
}
add_action( 'wp_default_scripts', 'gutenberg_register_interactivity_scripts', 10, 1 );

/**
 * Adds the "defer" attribute to all the interactivity script tags.
 *
 * @param string $tag    The generated script tag.
 *
 * @return string The modified script tag.
 */
function gutenberg_interactivity_scripts_add_defer_attribute( $tag ) {
	if ( str_contains( $tag, '/block-library/interactive-blocks/' ) ) {
		$p = new WP_HTML_Tag_Processor( $tag );
		$p->next_tag( array( 'tag' => 'script' ) );
		$p->set_attribute( 'defer', true );
		return $p->get_updated_html();
	}
	return $tag;
}
add_filter( 'script_loader_tag', 'gutenberg_interactivity_scripts_add_defer_attribute', 10, 1 );
