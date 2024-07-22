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
 * Adds client-side navigation directives to BODY tag.
 *
 * Note: This should probably be done per site, not by default when this option is enabled.
 *
 * @param string $response_body The response body.
 *
 * @return string The rendered template with modified BODY attributes.
 */
function _gutenberg_add_client_side_navigation_directives( $response_body ) {
	$is_html_content_type = false;
	foreach ( headers_list() as $header ) {
		$header_parts = preg_split( '/\s*[:;]\s*/', strtolower( $header ) );
		if ( count( $header_parts ) >= 2 && 'content-type' === $header_parts[0] ) {
			$is_html_content_type = in_array( $header_parts[1], array( 'text/html', 'application/xhtml+xml' ), true );
		}
	}
	if ( ! $is_html_content_type ) {
		return $response_body;
	}

	$p = new WP_HTML_Tag_Processor( $response_body );
	if ( $p->next_tag( array( 'tag_name' => 'BODY' ) ) ) {
		$p->set_attribute( 'data-wp-interactive', 'core/experimental' );
		$p->set_attribute( 'data-wp-context', '{}' );
		$response_body = $p->get_updated_html();
	}
	return $response_body;
}

// TODO: Explore moving this to the server directive processing.
add_filter( 'gutenberg_template_output_buffer', '_gutenberg_add_client_side_navigation_directives' );

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
