<?php
/**
 * Server-side rendering of the `core/query` block.
 *
 * @package WordPress
 */

/**
 * Modifies the static `core/query` block on the server.
 *
 * @since X.X.X
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block default content.
 *
 * @return string Returns the modified output of the query block.
 */
function render_block_core_query( $attributes, $content, $block ) {
	$should_load_view_script = $attributes['enhancedPagination'];
	$view_js_file            = 'wp-block-query-view';

	if ( $attributes['enhancedPagination'] ) {
		$p = new WP_HTML_Tag_Processor( $content );
		if ( $p->next_tag() ) {
			// Add the necessary directives.
			$p->set_attribute( 'data-wp-interactive', true );
			$p->set_attribute( 'data-wp-navigation-id', 'query-' . $attributes['queryId'] );
			$content = $p->get_updated_html();

			// Make the block as interactive.
			$block->block_type->supports['interactivity'] = true;
		}
	}

	if ( ! wp_script_is( $view_js_file ) ) {
		$script_handles = $block->block_type->view_script_handles;

		// If the script is not needed, and it is still in the `view_script_handles`, remove it.
		if ( ! $should_load_view_script && in_array( $view_js_file, $script_handles, true ) ) {
			$block->block_type->view_script_handles = array_diff( $script_handles, array( $view_js_file ) );
		}
		// If the script is needed, but it was previously removed, add it again.
		if ( $should_load_view_script && ! in_array( $view_js_file, $script_handles, true ) ) {
			$block->block_type->view_script_handles = array_merge( $script_handles, array( $view_js_file ) );
		}
	}

	return $content;
}

/**
 * Registers the `core/query` block on the server.
 */
function register_block_core_query() {
	register_block_type_from_metadata(
		__DIR__ . '/query',
		array(
			'render_callback' => 'render_block_core_query',
		)
	);
}
add_action( 'init', 'register_block_core_query' );
