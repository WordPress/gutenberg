<?php
/**
 * Registers full page client-side navigation option using the Interactivity API and adds the necessary directives.
 */

/**
 * Enqueue the interactivity router script.
 */
function _gutenberg_enqueue_interactivity_router() {
	// Set the navigation mode to full page client-side navigation.
	wp_interactivity_config( 'core/router', array( 'navigationMode' => 'fullPage' ) );
	wp_enqueue_script_module( '@wordpress/interactivity-router' );
}

add_action( 'wp_enqueue_scripts', '_gutenberg_enqueue_interactivity_router' );

/**
 * Set enhancedPagination attribute for query loop when the experiment is enabled.
 *
 * @param array $parsed_block The parsed block.
 *
 * @return array The same parsed block with the modified attribute.
 */
function _gutenberg_add_enhanced_pagination_to_query_block( $parsed_block ) {
	if ( 'core/query' !== $parsed_block['blockName'] ) {
		return $parsed_block;
	}

	$parsed_block['attrs']['enhancedPagination'] = true;
	return $parsed_block;
}

add_filter( 'render_block_data', '_gutenberg_add_enhanced_pagination_to_query_block' );

/**
 * Add directives to all links.
 *
 * Note: This should probably be done per site, not by default when this option is enabled.
 *
 * @param array $content The block content.
 *
 * @return array The same block content with the directives needed.
 */
function _gutenberg_add_client_side_navigation_directives( $content ) {
	$p = new WP_HTML_Tag_Processor( $content );
	// Hack to add the necessary directives to the body tag.
	// TODO: Find a proper way to add directives to the body tag.
	static $body_interactive_added;
	if ( ! $body_interactive_added ) {
		$body_interactive_added = true;
		return (string) $p . '<body data-wp-interactive="core/experimental" data-wp-context="{}">';
	}
	return (string) $p;
}

// TODO: Explore moving this to the server directive processing.
add_filter( 'render_block', '_gutenberg_add_client_side_navigation_directives' );
