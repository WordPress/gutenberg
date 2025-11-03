<?php
/**
 * Server-side rendering of the `core/fit-text` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/fit-text` block on the server.
 *
 * @since 22.0.0
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block default content.
 *
 * @return string Returns the block content.
 */
function render_block_core_fit_text( $attributes, $content ) {
	if ( ! $content || is_admin() ) {
		return $content;
	}

	// Enqueue the frontend script module.
	wp_enqueue_script_module( '@wordpress/block-library/fit-text/view' );

	// Add Interactivity API directives for fit text to work with client-side navigation.
	$processor = new WP_HTML_Tag_Processor( $content );
	if ( $processor->next_tag() ) {
		if ( ! $processor->get_attribute( 'data-wp-interactive' ) ) {
			$processor->set_attribute( 'data-wp-interactive', true );
		}
		$processor->set_attribute( 'data-wp-context---core-fit-text', 'core/fit-text::{"fontSize":""}' );
		$processor->set_attribute( 'data-wp-init---core-fit-text', 'core/fit-text::callbacks.init' );
		$processor->set_attribute( 'data-wp-style--font-size', 'core/fit-text::context.fontSize' );
		$content = $processor->get_updated_html();
	}

	return $content;
}

/**
 * Registers the `core/fit-text` block on the server.
 *
 * @since 22.0.0
 */
function register_block_core_fit_text() {
	register_block_type_from_metadata(
		__DIR__ . '/fit-text',
		array(
			'render_callback' => 'render_block_core_fit_text',
		)
	);
}
add_action( 'init', 'register_block_core_fit_text' );
