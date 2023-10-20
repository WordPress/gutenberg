<?php
/**
 * Server-side rendering of the `core/paragraph` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/paragraph` block on the server,
 * adding a data-id attribute to the element if core/gallery has added on pre-render.
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block      The block object.
 *
 * @return string The block content with the data-id attribute added.
 */
function render_block_core_paragraph( $attributes, $content, $block ) {

	if ( ! $attributes['typewritter'] ) {
		return $content;
	}

	// In the future, we can use `get_inner_markup` method of the HTML API.
	$pattern = '/<span[^>]*>(.*?)<\/span>/s';
	if ( preg_match( $pattern, $content, $matches ) ) {
		$original_text = strip_tags( $matches[1] );
	}

	$context   = array(
		'originalText' => $original_text,
		'dynamicText'  => '',
	);
	$processor = new WP_HTML_Tag_Processor( $content );
	$processor->next_tag( 'p' );
	$processor->set_attribute( 'data-wp-interactive', '{"namespace": "core"}' );
	// I needed to add an extra `span` because the directives need to be in another element.
	$processor->next_tag( 'span' );
	$processor->set_attribute( 'data-wp-context', wp_json_encode( $context, JSON_NUMERIC_CHECK ) );
	$processor->set_attribute( 'data-wp-init', 'callbacks.updateText' );
	$processor->set_attribute( 'data-wp-text', 'context.dynamicText' );

	return $processor->get_updated_html();
}

/**
 * Registers the `core/paragraph` block on server.
 */
function register_block_core_paragraph() {
	register_block_type_from_metadata(
		__DIR__ . '/paragraph',
		array(
			'render_callback' => 'render_block_core_paragraph',
		)
	);
}
add_action( 'init', 'register_block_core_paragraph' );
