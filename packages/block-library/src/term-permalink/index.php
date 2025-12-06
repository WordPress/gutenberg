<?php
/**
 * Server-side rendering of the `core/term-permalink` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/term-permalink` block on the server.
 *
 * @since 6.9.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the term permalink link.
 */
function render_block_core_term_permalink( $attributes, $content, $block ) {
	// Get term from context or from the current query.
	if ( isset( $block->context['termId'] ) && isset( $block->context['taxonomy'] ) ) {
		$term = get_term( $block->context['termId'], $block->context['taxonomy'] );
	} else {
		$term = get_queried_object();
		if ( ! $term instanceof WP_Term ) {
			$term = null;
		}
	}

	if ( ! $term || is_wp_error( $term ) ) {
		return '';
	}

	$term_link = get_term_link( $term );
	if ( is_wp_error( $term_link ) ) {
		return '';
	}

	$term_name = $term->name;
	if ( '' === $term_name ) {
		$term_name = sprintf(
			/* translators: %s is term ID to describe the link for screen readers. */
			__( 'untitled term %s' ),
			$term->term_id
		);
	}

	$screen_reader_text = sprintf(
		/* translators: %s is either the term name or term ID to describe the link for screen readers. */
		__( ': %s' ),
		$term_name
	);

	$more_text = ! empty( $attributes['content'] ) ? wp_kses_post( $attributes['content'] ) : __( 'View term' );

	$wrapper_attributes = get_block_wrapper_attributes();

	return sprintf(
		'<a %1$s href="%2$s" target="%3$s">%4$s<span class="screen-reader-text">%5$s</span></a>',
		$wrapper_attributes,
		esc_url( $term_link ),
		esc_attr( $attributes['linkTarget'] ?? '_self' ),
		$more_text,
		$screen_reader_text
	);
}

/**
 * Registers the `core/term-permalink` block on the server.
 *
 * @since 6.9.0
 */
function register_block_core_term_permalink() {
	register_block_type_from_metadata(
		__DIR__ . '/term-permalink',
		array(
			'render_callback' => 'render_block_core_term_permalink',
		)
	);
}
add_action( 'init', 'register_block_core_term_permalink' );
