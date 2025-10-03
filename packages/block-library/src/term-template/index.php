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
	if ( ! isset( $block->context['termQuery'] ) || ! isset( $attributes ) ) {
		return '';
	}

	$query_args = build_query_vars_from_terms_query_block( $block );

	// Inherit by default if termId is available in context.
	$inherit = isset( $block->context['termQuery']['inherit'] ) ? $block->context['termQuery']['inherit'] : isset( $block->context['termId'] );

	if ( $inherit ) {
		$query_context = $block->context['termQuery']['context'] ?? '';
		// Get the parent term ID from the block context. This is needed if rendering a nested query whether inheriting from a post or taxonomy archive.
		$parent_term_id = isset( $block->context['termId'] ) ? $block->context['termId'] : null;
		if ( $parent_term_id && $parent_term_id > 0 ) {
			$query_args['parent'] = $parent_term_id;
		} elseif (
			'taxonomy_archive' === $query_context
			&& is_tax( $query_args['taxonomy'] )
		) {
			// Get the current term ID from the queried object.
			$current_term_id = get_queried_object_id();
			if ( $current_term_id && $current_term_id > 0 ) {
				$query_args['parent'] = $current_term_id;
			}
		}

		if ( isset( $block->context['postId'] ) ) {
			$query_args['object_ids'] = array( $block->context['postId'] );
		} elseif ( 'post' === $query_context && is_single() ) {
			$query_args['object_ids'] = array( get_queried_object_id() );
		}
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

		$block_content = '';

		// Use an early priority to so that other 'render_block_context' filters have access to the values.
		add_filter( 'render_block_context', $filter_block_context, 1 );

		// Render the inner blocks of the Term Template block with `dynamic` set to `false` to prevent calling
		// `render_callback` and ensure that no wrapper markup is included.
		$block_content .= ( new WP_Block( $block_instance ) )->render( array( 'dynamic' => false ) );

		remove_filter( 'render_block_context', $filter_block_context, 1 );

		// Wrap the render inner blocks in a `li` element with the appropriate term classes.
		$term_classes = implode( ' ', array( 'wp-block-term', "term-{$term->term_id}", $term->taxonomy, "taxonomy-{$term->taxonomy}" ) );

		$content .= '<li class="' . esc_attr( $term_classes ) . '">' . $block_content . '</li>';
	}

	$classnames = 'wp-block-term-template';

	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classnames .= ' has-link-color';
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
