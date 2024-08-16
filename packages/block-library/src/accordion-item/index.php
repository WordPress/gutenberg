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

	// If the item is open by default,
	// add its id to the accordion group's initial context.isOpen list.
	if ( $attributes['openByDefault'] ) {
		// phpcs:ignore Gutenberg.CodeAnalysis.ForbiddenFunctionsAndClasses.ForbiddenFunctionCall
		gutenberg_block_core_accordion_group_item_ids( $unique_id );
	}

	// Initialize the state of the item on the server using a closure,
	// since we need to get derived state based on the current context.
	wp_interactivity_state(
		'core/accordion',
		array(
			'isOpen' => function () {
				$context = wp_interactivity_get_context();
				return in_array( $context['id'], $context['isOpen'], true );
			},
		)
	);

	if ( $p->next_tag( array( 'class_name' => 'wp-block-accordion-item' ) ) ) {
		$p->set_attribute( 'data-wp-context', '{ "id": "' . $unique_id . '" }' );
		$p->set_attribute( 'data-wp-class--is-open', 'state.isOpen' );

		if ( $p->next_tag( array( 'class_name' => 'accordion-item__toggle' ) ) ) {
			$p->set_attribute( 'data-wp-on--click', 'actions.toggle' );
			$p->set_attribute( 'id', $unique_id );
			$p->set_attribute( 'aria-controls', $unique_id . '-content' );
			$p->set_attribute( 'data-wp-bind--aria-expanded', 'state.isOpen' );

			if ( $p->next_tag( array( 'class_name' => 'wp-block-accordion-content' ) ) ) {
				$p->set_attribute( 'id', $unique_id . '-content' );
				$p->set_attribute( 'aria-labelledby', $unique_id );
				$p->set_attribute( 'data-wp-bind--aria-hidden', '!state.isOpen' );
				$p->set_attribute( 'data-wp-watch', 'callbacks.setTabIndex' );

				// Only modify content if all directives have been set.
				$content = $p->get_updated_html();
			}
		}
	}

	return $content;
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
