<?php
/**
 * Server-side rendering of the `core/tab` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/tab` block on the server.
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block      The block object.
 *
 * @return string The block content.
 */
function render_block_core_tab( $attributes, $content ) {
	if ( ! $content ) {
		return '';
	}

	// Modify markup to include interactivity API attributes.
	$p = new WP_HTML_Tag_Processor( $content );

	while ( $p->next_tag( array( 'class_name' => 'wp-block-tab' ) ) ) {
		$p->set_attribute( 'data-wp-bind--hidden', '!state.isActiveTab' );
		$p->set_attribute( 'data-wp-bind--tabindex', 'state.tabindexPanelAttribute' );
		$p->set_attribute( 'data-tab-index', $attributes['tabIndex'] );
	}

	return $p->get_updated_html();
}

/**
 * Registers the `core/tab` block on server.
 */
function register_block_core_tab() {
	register_block_type_from_metadata(
		__DIR__ . '/tab',
		array(
			'render_callback' => 'render_block_core_tab',
		)
	);
}
add_action( 'init', 'register_block_core_tab' );
