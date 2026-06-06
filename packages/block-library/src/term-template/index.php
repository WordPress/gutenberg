<?php
/**
 * Server-side rendering of the `core/term-template` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/term-template` block on the server.
 *
 * @since 6.9.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the output of the term template.
 */
function render_block_core_term_template( $attributes, $content, $block ) {
	if ( ! isset( $block->context ) || empty( $block->context['termQuery'] ) ) {
		return '';
	}

	$query_args = build_terms_query_vars_from_block( $block );

	$page = get_query_var( 'termspage' );

	if ( ! $page ) {
		$page = 1;
	}

	if ( $page > 1 ) {
		$query_args['offset'] = ( $page - 1 ) * $query_args['number'];
	}

	$terms_query = new WP_Term_Query( $query_args );
	$terms       = $terms_query->get_terms();

	if ( ! $terms || is_wp_error( $terms ) ) {
		return '';
	}

	$content = '';
	foreach ( $terms as $term ) {
		// Get an instance of the current Term Template block.
		$block_instance = $block->parsed_block;

		// Set the block name to one that does not correspond to an existing registered block.
		// This ensures that for the inner instances of the Term Template block, we do not render any block supports.
		$block_instance['blockName'] = 'core/null';

		$term_id  = $term->term_id;
		$taxonomy = $term->taxonomy;

		$filter_block_context = static function ( $context ) use ( $term_id, $taxonomy ) {
			$context['termId']   = $term_id;
			$context['taxonomy'] = $taxonomy;
			return $context;
		};

		// Use an early priority to so that other 'render_block_context' filters have access to the values.
		add_filter( 'render_block_context', $filter_block_context, 1 );

		// Render the inner blocks of the Term Template block with `dynamic` set to `false` to prevent calling
		// `render_callback` and ensure that no wrapper markup is included.
		$block_content = ( new WP_Block( $block_instance ) )->render( array( 'dynamic' => false ) );

		remove_filter( 'render_block_context', $filter_block_context, 1 );

		// Wrap the render inner blocks in a `li` element with the appropriate term classes.
		$term_classes = "wp-block-term term-{$term->term_id} {$term->taxonomy} taxonomy-{$term->taxonomy}";

		$content .= '<li class="' . esc_attr( $term_classes ) . '">' . $block_content . '</li>';
	}

	$classnames = '';

	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classnames .= 'has-link-color';
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => trim( $classnames ) ) );

	return sprintf(
		'<ul %s>%s</ul>',
		$wrapper_attributes,
		$content
	);
}

/**
 * Registers the `core/term-template` block on the server.
 *
 * @since 6.9.0
 */
function register_block_core_term_template() {
	register_block_type_from_metadata(
		__DIR__ . '/term-template',
		array(
			'render_callback' => 'render_block_core_term_template',
		)
	);
}
add_action( 'init', 'register_block_core_term_template' );
