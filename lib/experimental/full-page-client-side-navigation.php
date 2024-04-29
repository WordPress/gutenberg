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
	static $body_interactive_added;
	if ( ! $body_interactive_added ) {
		$body_interactive_added = true;
		add_filter( 'gutenberg_template_output_buffer', static function ( $html ) {
			$p = new WP_HTML_Tag_Processor( $html );
			if ( $p->next_tag( array( 'tag_name' => 'BODY' ) ) ) {
				$p->set_attribute( 'data-wp-interactive', 'core/experimental' );
				$p->set_attribute( 'data-wp-context', '{}' );
				$html = $p->get_updated_html();
			}
			return $html;
		} );
	}
	return $content;
}

// TODO: Explore moving this to the server directive processing.
add_filter( 'render_block', '_gutenberg_add_client_side_navigation_directives' );

/**
 * Starts output buffering at the end of the 'template_include' filter.
 *
 * This is to implement #43258 in core.
 *
 * This is a hack which would eventually be replaced with something like this in wp-includes/template-loader.php:
 *
 *          $template = apply_filters( 'template_include', $template );
 *     +    ob_start( 'wp_template_output_buffer_callback' );
 *          if ( $template ) {
 *              include $template;
 *          } elseif ( current_user_can( 'switch_themes' ) ) {
 *
 * @since 0.1.0
 * @link https://core.trac.wordpress.org/ticket/43258
 *
 * @param string $passthrough Value for the template_include filter which is passed through.
 *
 * @return string Unmodified value of $passthrough.
 */
function _gutenberg_buffer_template_output( string $passthrough ): string {
	ob_start(
		static function ( string $output ): string {
			/**
			 * Filters the template output buffer prior to sending to the client.
			 *
			 * @param string $output Output buffer.
			 * @return string Filtered output buffer.
			 */
			return (string) apply_filters( 'gutenberg_template_output_buffer', $output );
		}
	);
	return $passthrough;
}
add_filter( 'template_include', '_gutenberg_buffer_template_output', PHP_INT_MAX );
