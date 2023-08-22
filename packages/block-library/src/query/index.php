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
 * @param string $block      Block instance.
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
			$p->set_attribute(
				'data-wp-context',
				json_encode( array( 'core' => array( 'query' => (object) array() ) ) )
			);
			$content = $p->get_updated_html();

			// Make the block as interactive.
			$block->block_type->supports['interactivity'] = true;

			// Add a div to announce messages using `aria-live`.
			$last_div_position = strripos( $content, '</div>' );
			$content           = substr_replace(
				$content,
				'<div
					style="position:absolute;clip:rect(0,0,0,0);"
					aria-live="polite"
					data-wp-text="context.core.query.message"
				></div>
				<div
					class="wp-block-query__enhanced-pagination-animation"
					data-wp-class--start-animation="selectors.core.query.startAnimation"
					data-wp-class--finish-animation="selectors.core.query.finishAnimation"
				></div>',
				$last_div_position,
				0
			);

			// Use state to send translated strings.
			wp_store(
				array(
					'state' => array(
						'core' => array(
							'query' => array(
								'loadingText' => __( 'Loading page, please wait.' ),
								'loadedText'  => __( 'The new page has been loaded. You can continue navigating.' ),
							),
						),
					),
				)
			);
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
