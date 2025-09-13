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
	if ( ! isset( $block->context ) || ! isset( $attributes ) ) {
		return '';
	}

	$query_block_context = $block->context;

	if ( empty( $query_block_context['termQuery'] ) ) {
		return '';
	}

	$query = $query_block_context['termQuery'];

	$query_args = array(
		'taxonomy'   => $query['taxonomy'] ?? 'category',
		'number'     => $query['perPage'] ?? 10,
		'order'      => $query['order'] ?? 'asc',
		'orderby'    => $query['orderBy'] ?? 'name',
		'hide_empty' => $query['hideEmpty'] ?? true,
		'include'    => $query['include'] ?? array(),
		'exclude'    => $query['exclude'] ?? array(),
	);

	// Handle parent.
	if ( ! empty( $query['hierarchical'] ) && isset( $query['parent'] ) ) {
		$query_args['parent'] = $query['parent'];
	} elseif ( ! empty( $query['hierarchical'] ) ) {
		$query_args['parent'] = 0;
	} elseif ( isset( $query['parent'] ) ) {
		$query_args['parent'] = $query['parent'];
	}

	$terms_query = new WP_Term_Query( $query_args );
	$terms       = $terms_query->get_terms();

	if ( ! $terms || is_wp_error( $terms ) ) {
		return '';
	}

	// Handle hierarchical list.
	$is_hierarchical = ! empty( $query['hierarchical'] );

	if ( $is_hierarchical ) {
		$content = render_block_core_term_template_hierarchical( $terms, $block, $query_args );
	} else {
		$content = render_block_core_term_template_flat( $terms, $block );
	}

	$classnames = 'wp-block-term-template';

	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classnames .= ' has-link-color';
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => trim( $classnames ) ) );

	// Default list layout.
	return sprintf(
		'<ul %s>%s</ul>',
		$wrapper_attributes,
		$content
	);
}

/**
 * Renders terms in a flat list structure.
 *
 * @since 6.9.0
 *
 * @param array    $terms Array of WP_Term objects.
 * @param WP_Block $block Block instance.
 *
 * @return string HTML content for flat terms list.
 */
function render_block_core_term_template_flat( $terms, $block ) {
	$content = '';
	foreach ( $terms as $term ) {
		$content .= render_block_core_term_template_single( $term, $block );
	}
	return $content;
}

/**
 * Renders terms in a hierarchical structure.
 *
 * @since 6.9.0
 *
 * @param array    $terms Array of WP_Term objects.
 * @param WP_Block $block Block instance.
 * @param array    $base_query_args Base query arguments.
 *
 * @return string HTML content for hierarchical terms list.
 */
function render_block_core_term_template_hierarchical( $terms, $block, $base_query_args ) {
	$content = '';

	foreach ( $terms as $term ) {
		$term_content     = render_block_core_term_template_single( $term, $block );
		$children_content = render_block_core_term_template_get_children( $term->term_id, $block, $base_query_args );

		if ( ! empty( $children_content ) ) {
			$term_content = str_replace( '</li>', '<ul>' . $children_content . '</ul></li>', $term_content );
		}

		$content .= $term_content;
	}

	return $content;
}

/**
 * Gets and renders children of a specific term.
 *
 * @since 6.9.0
 *
 * @param int      $parent_term_id Parent term ID.
 * @param WP_Block $block          Block instance.
 * @param array    $base_query_args Base query arguments.
 *
 * @return string HTML content for children terms.
 */
function render_block_core_term_template_get_children( $parent_term_id, $block, $base_query_args ) {
	$child_query_args           = $base_query_args;
	$child_query_args['parent'] = $parent_term_id;

	$child_terms_query = new WP_Term_Query( $child_query_args );
	$child_terms       = $child_terms_query->get_terms();

	if ( ! $child_terms || is_wp_error( $child_terms ) ) {
		return '';
	}

	$content = '';

	foreach ( $child_terms as $child_term ) {
		$term_content     = render_block_core_term_template_single( $child_term, $block );
		$children_content = render_block_core_term_template_get_children( $child_term->term_id, $block, $base_query_args );

		if ( ! empty( $children_content ) ) {
			$term_content = str_replace( '</li>', '<ul>' . $children_content . '</ul></li>', $term_content );
		}

		$content .= $term_content;
	}

	return $content;
}

/**
 * Renders a single term with its inner blocks.
 *
 * @since 6.9.0
 *
 * @param WP_Term  $term  Term object.
 * @param WP_Block $block Block instance.
 *
 * @return string HTML content for a single term.
 */
function render_block_core_term_template_single( $term, $block ) {
	$inner_blocks  = $block->inner_blocks;
	$block_content = '';

	if ( ! empty( $inner_blocks ) ) {
		$term_id  = $term->term_id;
		$taxonomy = $term->taxonomy;

		$filter_block_context = static function ( $context ) use ( $term_id, $taxonomy ) {
			$context['termId']   = $term_id;
			$context['taxonomy'] = $taxonomy;
			return $context;
		};

		add_filter( 'render_block_context', $filter_block_context, 1 );

		foreach ( $inner_blocks as $inner_block ) {
			if ( method_exists( $inner_block, 'refresh_context_dependents' ) ) {
				// WP_Block::refresh_context_dependents() was introduced in WordPress 6.8.
				$inner_block->refresh_context_dependents();
				$block_content .= $inner_block->render( array( 'dynamic' => true ) );
			} else {
				$block_content = ( new WP_Block( $inner_block->parsed_block ) )->render( array( 'dynamic' => false ) );
			}
		}
		remove_filter( 'render_block_context', $filter_block_context, 1 );
	}

	$term_classes = implode( ' ', array( 'wp-block-term', 'term-' . $term->term_id ) );

	// Default list layout
	return '<li class="' . esc_attr( $term_classes ) . '">' . $block_content . '</li>';
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
