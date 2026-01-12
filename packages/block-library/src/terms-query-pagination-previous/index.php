<?php
/**
 * Render callback for the Terms Query Pagination Previous block.
 *
 * @since 7.0.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Rendered block HTML.
 */
function render_block_core_terms_query_pagination_previous( $attributes, $content, $block ) {
	$term_query = isset( $block->context['termQuery'] ) ? $block->context['termQuery'] : array();

	if ( empty( $term_query ) ) {
		return '';
	}

	$page = get_query_var( 'termspage' );

	if ( ! $page ) {
		$page = 1;
	}

	if ( $page <= 1 ) {
		return '';
	}

	$label      = isset( $attributes['label'] ) ? $attributes['label'] : __( 'Previous Page', 'gutenberg' );
	$show_label = isset( $block->context['showLabel'] ) ? $block->context['showLabel'] : true;
	$arrow_type = isset( $block->context['paginationArrow'] ) ? $block->context['paginationArrow'] : 'none';

	$arrow_map = array(
		'none'    => '',
		'arrow'   => '←',
		'chevron' => '«',
	);

	$arrow = isset( $arrow_map[ $arrow_type ] ) ? $arrow_map[ $arrow_type ] : '';

	$display_label = $show_label ? $label : '';
	if ( $arrow && $show_label ) {
		$display_label = $arrow . ' ' . $display_label;
	} elseif ( $arrow ) {
		$display_label = $arrow;
	}

	$previous_page = $page - 1;
	if ( $previous_page <= 1 ) {
		// Remove termspage parameter for page 1.
		$previous_url = remove_query_arg( 'termspage' );
	} else {
		$previous_url = add_query_arg( 'termspage', $previous_page );
	}

	$wrapper_attributes = get_block_wrapper_attributes();
	$content            = sprintf(
		'<a href="%1$s" %2$s>%3$s</a>',
		esc_url( $previous_url ),
		$wrapper_attributes,
		esc_html( $display_label )
	);

	return $content;
}

/**
 * Registers the `core/terms-query-pagination-previous` block on the server.
 *
 * @since 7.0.0
 */
function register_block_core_terms_query_pagination_previous() {
	register_block_type_from_metadata(
		__DIR__ . '/terms-query-pagination-previous',
		array(
			'render_callback' => 'render_block_core_terms_query_pagination_previous',
		)
	);
}
add_action( 'init', 'register_block_core_terms_query_pagination_previous' );
