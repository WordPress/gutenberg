<?php

/**
 * Server-side rendering of the `core/accordion-item` block.
 *
 * @package WordPress
 * @since 6.6.0
 *
 * @param array $attributes The block attributes.
 * @param string $content The block content.
 *
 * @return string Returns the updated markup.
 */
function block_core_accordion_item_render( $attributes, $content ) {
	if ( ! $content ) {
		return $content;
	}

	$p         = new WP_HTML_Tag_Processor( $content );
	$unique_id = wp_unique_id( 'accordion-item-' );

	while ( $p->next_tag() ) {
		if ( $p->has_class( 'wp-block-accordion-item' ) ) {
			$p->set_attribute( 'id', $unique_id );
			$p->set_attribute( 'data-wp-class--is-open', 'state.isOpen' );
			if ( $attributes['openByDefault'] ) {
				$p->set_attribute( 'data-wp-init', 'callbacks.open' );
			}
		}
	}

	$content = $p->get_updated_html();
	$p       = new WP_HTML_Tag_Processor( $content );

	while ( $p->next_tag() ) {
		if ( $p->has_class( 'accordion-item__toggle' ) ) {
			$p->set_attribute( 'data-wp-on--click', 'actions.toggle' );
			$p->set_attribute( 'aria-controls', $unique_id );
			$p->set_attribute( 'data-wp-bind--aria-expanded', 'state.isOpen' );
		}
	}

	$content = $p->get_updated_html();
	$p       = new WP_HTML_Tag_Processor( $content );

	while ( $p->next_tag() ) {
		if ( $p->has_class( 'wp-block-accordion-content' ) ) {
			$p->set_attribute( 'aria-labelledby', $unique_id );
			$p->set_attribute( 'data-wp-bind--aria-hidden', '!state.isOpen' );
		}
	}

	return $p->get_updated_html();
}

/**
 * Registers the `core/accordion-item` block on server.
 *
 * @since 6.6.0
 */
function register_block_core_accordion_item() {
	register_block_type_from_metadata(
		__DIR__ . '/accordion-item',
		array(
			'render_callback' => 'block_core_accordion_item_render',
		)
	);
}
add_action( 'init', 'register_block_core_accordion_item' );
