<?php
/**
 * Server-side rendering of the `core/query-loop` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/query-loop` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the output of the query, structured using the layout defined by the block's inner blocks.
 */
function render_block_core_query_loop( $attributes, $content, $block ) {
	$page_key = isset( $block->context['queryId'] ) ? 'query-' . $block->context['queryId'] . '-page' : 'query-page';
	$page     = empty( $_GET[ $page_key ] ) ? 1 : filter_var( $_GET[ $page_key ], FILTER_VALIDATE_INT );

	$query = construct_wp_query_args( $block, $page );
	// Override the custom query with the global query if needed.
	$use_global_query = ( isset( $block->context['query']['inherit'] ) && $block->context['query']['inherit'] );
	if ( $use_global_query ) {
		global $wp_query;
		if ( $wp_query && isset( $wp_query->query_vars ) && is_array( $wp_query->query_vars ) ) {
			// Unset `offset` because if is set, $wp_query overrides/ignores the paged parameter and breaks pagination.
			unset( $query['offset'] );
			$query = wp_parse_args( $wp_query->query_vars, $query );

			if ( empty( $query['post_type'] ) && is_singular() ) {
				$query['post_type'] = get_post_type( get_the_ID() );
			}
		}
	}

	$posts      = get_posts( $query );
	$classnames = '';
	if ( isset( $block->context['layout'] ) && isset( $block->context['query'] ) ) {
		if ( isset( $block->context['layout']['type'] ) && 'flex' === $block->context['layout']['type'] ) {
			$classnames = "is-flex-container columns-{$block->context['layout']['columns']}";
		}
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $classnames ) );

	$content = '';
	foreach ( $posts as $post ) {
		$block_content = (
			new WP_Block(
				$block->parsed_block,
				array(
					'postType' => $post->post_type,
					'postId'   => $post->ID,
				)
			)
		)->render( array( 'dynamic' => false ) );
		$content      .= "<li>{$block_content}</li>";
	}
	return sprintf(
		'<ul %1$s>%2$s</ul>',
		$wrapper_attributes,
		$content
	);
}

/**
 * Registers the `core/query-loop` block on the server.
 */
function register_block_core_query_loop() {
	register_block_type_from_metadata(
		__DIR__ . '/query-loop',
		array(
			'render_callback'   => 'render_block_core_query_loop',
			'skip_inner_blocks' => true,
		)
	);
}
add_action( 'init', 'register_block_core_query_loop' );
