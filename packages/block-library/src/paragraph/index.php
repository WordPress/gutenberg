<?php
/**
 * Appending the wp-block-paragraph to before rendering the stored `core/paragraph` block contents.
 *
 * @package WordPress
 */

/**
 * Adds a wp-block-paragraph class to the paragraph block content.
 *
 * For example, the following block content:
 *  <p class="align-left">Hello Paragraph!</p>
 *
 * Would be transformed to:
 *  <p class="align-left wp-block-paragraph">Hello Paragraph!</p>
 *
 * @param array  $attributes Attributes of the block being rendered.
 * @param string $content    Content of the block being rendered.
 *
 * @return string The content of the block being rendered.
 */
function block_core_paragraph_render( $attributes, $content ) {

	if ( ! $content ) {
		return $content;
	}

	$p = new WP_HTML_Tag_Processor( $content );

	while ( $p->next_tag() ) {
		if ( 'P' === $p->get_tag() ) {
			$p->add_class( 'wp-block-paragraph' );
			break;
		}
	}

	return $p->get_updated_html();
}

/**
 * Registers the `core/paragraph` block on server.
 */
function register_block_core_paragraph() {
	register_block_type_from_metadata(
		__DIR__ . '/paragraph',
		array(
			'render_callback' => 'block_core_paragraph_render',
		)
	);
}

add_action( 'init', 'register_block_core_paragraph' );
