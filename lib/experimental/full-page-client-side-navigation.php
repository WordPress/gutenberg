<?php
/**
 * Registers full page client-side navigation option using the Interactivity API and adds the necessary directives.
 */

// Set the navigation mode to full page client-side navigation.
wp_interactivity_config( 'core/router', array( 'navigationMode' => 'fullPage' ) );

// Enqueue the interactivity router script.
function _gutenberg_enqueue_interactivity_router() {
	wp_enqueue_script_module( '@wordpress/interactivity-router' );
}

add_action( 'init', '_gutenberg_enqueue_interactivity_router', 20 );

// Add directives to all links.
// This should probably be done per site, not by default when this option is enabled.
function _gutenberg_add_enhanced_pagination( $parsed_block ) {
	if ( 'core/query' !== $parsed_block['blockName'] ) {
		return $parsed_block;
	}

	$parsed_block['attrs']['enhancedPagination'] = true;
	return $parsed_block;
}

add_filter( 'render_block_data', '_gutenberg_add_enhanced_pagination', 10 );

// Add directives to all links.
// This should probably be done per site, not by default when this option is enabled.
function _gutenberg_add_client_side_navigation_directives( $content ) {
	$p = new WP_HTML_Tag_Processor( $content );
	while ( $p->next_tag( array( 'tag_name' => 'a' ) ) ) {
		if ( empty( $p->get_attribute( 'data-wp-on--click' ) ) ) {
			$p->set_attribute( 'data-wp-on--click', 'core/router::actions.navigate' );
		}
		if ( empty( $p->get_attribute( 'data-wp-on--mouseenter' ) ) ) {
			$p->set_attribute( 'data-wp-on--mouseenter', 'core/router::actions.prefetch' );
		}
	}
	// Hack to add the necessary directives to the body tag.
	// TODO: Find a proper way to add directives to the body tag.
	return (string) $p . '<body data-wp-interactive="core/experimental" data-wp-context="{}">';
}

// TODO: Explore moving this to the server directive processing.
add_filter( 'render_block', '_gutenberg_add_client_side_navigation_directives', 10, 2 );
