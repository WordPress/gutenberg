<?php
/**
 * Server-side rendering of the `core/button` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/button` block on the server,
 *
 * @since 6.6.0
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block      The block object.
 *
 * @return string The block content.
 */
function render_block_core_button( $attributes, $content ) {
	$p = new WP_HTML_Tag_Processor( $content );

	/*
	 * The button block can render an `<a>` or `<button>` and also has a
	 * `<div>` wrapper. Find the a or button tag.
	 *
	 */
	$tag = null;
	while ( $p->next_tag() ) {
		$tag = $p->get_tag();
		if ( 'A' === $tag || 'BUTTON' === $tag ) {
			break;
		}
	}

	// If this happens, the likelihood is there's no block content.
	if ( null === $tag ) {
		return '';
	}

	// Build a string of the inner text.
	$text = '';
	while ( $p->next_token() ) {
		switch ( $p->get_token_name() ) {
			case '#text':
				$text .= $p->get_modifiable_text();
				break;

			case 'BR':
				$text .= '';
				break;
		}
	}

	/*
	 * When there's no text, render nothing for the block.
	 * It's this way because an anchor or button element without text results
	 * in poor accessibility.
	 */
	if ( '' === trim( $text ) ) {
		return '';
	}

	return $content;
}

/**
 * Registers the `core/button` block on server.
 *
 * @since 6.6.0
 */
function register_block_core_button() {
	register_block_type_from_metadata(
		__DIR__ . '/button',
		array(
			'render_callback' => 'render_block_core_button',
		)
	);
}
add_action( 'init', 'register_block_core_button' );
