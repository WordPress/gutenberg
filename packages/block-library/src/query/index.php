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
function render_block_core_query( $attributes, $content ) {
	if ( $attributes['enhancedPagination'] ) {
		$p = new WP_HTML_Tag_Processor( $content );
		if ( $p->next_tag() ) {
			$p->set_attribute( 'data-wp-interactive', true );
			$p->set_attribute( 'data-wp-navigation-id', 'query-' . $attributes['queryId'] );
		}
		$content = $p->get_updated_html();
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
