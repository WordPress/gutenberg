<?php
/**
 * Server-side rendering of the `core/slider-pagination-indicator` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/slider-pagination-indicator` block on the server.
 *
 * Adds the `data-wp-interactive` namespace so the Interactivity API
 * picks up the `data-wp-each` directive on the inner <template> element.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block default content.
 *
 * @return string Returns the block markup.
 */
function render_block_core_slider_pagination_indicator( $attributes, $content ) {
	if ( empty( $content ) ) {
		return '';
	}

	$p = new WP_HTML_Tag_Processor( $content );
	if ( $p->next_tag( array( 'class_name' => 'wp-block-slider-pagination-indicator' ) ) ) {
		$p->set_attribute( 'data-wp-interactive', 'core/slider' );
	}

	return $p->get_updated_html();
}

/**
 * Registers the `core/slider-pagination-indicator` block on the server.
 */
function register_block_core_slider_pagination_indicator() {
	register_block_type_from_metadata(
		__DIR__ . '/slider-pagination-indicator',
		array(
			'render_callback' => 'render_block_core_slider_pagination_indicator',
		)
	);
}
add_action( 'init', 'register_block_core_slider_pagination_indicator' );
