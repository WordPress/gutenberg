<?php


/**
 * Render callback for the Terms Query Pagination Next block.
 *
 * @since 7.0.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Rendered block HTML.
 */
function render_block_core_terms_query_pagination_next( $attributes, $content, $block ) {
	$term_query = $block->context['termQuery'];
	$per_page   = $term_query['perPage'];

	$page = get_query_var( 'termspage' );

	if ( ! $page ) {
		$page = 1;
	}

	$query_vars  = build_terms_query_vars_from_block( $block );
	$total_terms = wp_count_terms( $query_vars );
	$max_page    = max( 1, (int) ceil( $total_terms / $per_page ) );

	if ( ! ($page < $max_page) ) {
		return '';
	}

	$label      = isset( $attributes['label'] ) ? $attributes['label'] : __( 'Next Page' );
	$show_label = isset( $block->context['showLabel'] ) ? $block->context['showLabel'] : true;
	$arrow_type = isset( $block->context['paginationArrow'] ) ? $block->context['paginationArrow'] : 'none';

	$arrow_map = array(
		'none'    => '',
		'arrow'   => '→',
		'chevron' => '»',
	);

	$arrow = isset( $arrow_map[ $arrow_type ] ) ? $arrow_map[ $arrow_type ] : '';

	$display_label = $show_label ? $label : '';
	if ( $arrow && $show_label ) {
		$display_label = $display_label . ' ' . $arrow;
	} elseif ( $arrow ) {
		$display_label = $arrow;
	}

	$next_page = $page + 1;
	if ( $next_page <= 1 ) {
		$next_url = remove_query_arg( 'termspage' );
	} else {
		$next_url = add_query_arg( 'termspage', $next_page );
	}

	$wrapper_attributes = get_block_wrapper_attributes();
	$content            = sprintf(
		'<a href="%1$s" %2$s>%3$s</a>',
		esc_url( $next_url ),
		$wrapper_attributes,
		esc_html( $display_label )
	);

	return $content;
}

/**
 * Registers the `core/terms-query-pagination-next` block on the server.
 *
 * @since 7.0.0
 */
function register_block_core_terms_query_pagination_next() {
	register_block_type_from_metadata(
		__DIR__ . '/terms-query-pagination-next',
		array(
			'render_callback' => 'render_block_core_terms_query_pagination_next',
		)
	);
}
add_action( 'init', 'register_block_core_terms_query_pagination_next' );
