<?php
/**
 * Registers full page client-side navigation option using the Interactivity API and adds the necessary directives.
 */

// Add the full client-side navigation config option.
wp_interactivity_config( 'core/router', array( 'fullPageClientSideNavigation' => true ) );

// Register and enqueue the full client-side navigation script.
wp_register_script_module(
	'@wordpress/interactivity-full-page-router',
	gutenberg_url( '/build/interactivity/full-page-router.min.js' ),
	array( '@wordpress/interactivity' ),
	false
);
wp_enqueue_script_module( '@wordpress/interactivity-full-page-router' );

// Add directives to all links.
// This should probably be done per site, not by default when this option is enabled.
function gutenberg_add_client_side_navigation_directives( $content, $block ) {
	// Don't add directives to query blocks and pagination blocks.
	if (
		'core/query' === $block['blockName'] ||
		'core/query-pagination-next' === $block['blockName'] ||
		'core/query-pagination-previous' === $block['blockName'] ||
		'core/query-pagination-numbers' === $block['blockName']
		) {
		return $content;
	}
	$p = new WP_HTML_Tag_Processor( $content );
	while ( $p->next_tag( array( 'tag_name' => 'a' ) ) ) {
		$p->set_attribute( 'data-wp-on--click', 'core/router::actions.navigate' );
		$p->set_attribute( 'data-wp-on--mouseenter', 'core/router::actions.prefetch' );
	}
	// Hack to add the necessary directives to the body tag.
	// TODO: Find a proper way to add directives to the body tag.
	return (string) $p . '<body data-wp-interactive="core/experimental" data-wp-context="{}">';
}

add_filter( 'render_block', 'gutenberg_add_client_side_navigation_directives', 10, 2 );
