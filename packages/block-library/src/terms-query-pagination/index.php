<?php
/**
 * Render callback for the Terms Query Pagination block.
 *
 * @since 7.1.0
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block default content.
 *
 * @return string Rendered block HTML.
 */
function render_block_core_terms_query_pagination( $attributes, $content ) {
	if ( empty( trim( $content ) ) ) {
		return '';
	}

	$classes = ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) ? 'has-link-color' : '';

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'aria-label' => __( 'Terms Pagination', 'gutenberg' ),
			'class'      => $classes,
		)
	);

	return sprintf(
		'<nav %1$s>%2$s</nav>',
		$wrapper_attributes,
		$content
	);
}

/**
 * Registers the `core/terms-query-pagination` block on the server.
 *
 * @since 7.1.0
 */
function register_block_core_terms_query_pagination() {
	register_block_type_from_metadata(
		__DIR__ . '/terms-query-pagination',
		array(
			'render_callback' => 'render_block_core_terms_query_pagination',
		)
	);
}
add_action( 'init', 'register_block_core_terms_query_pagination' );
