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

	$query = array(
		'post_type'    => 'post',
		'offset'       => 0,
		'order'        => 'DESC',
		'orderby'      => 'date',
		'post__not_in' => array(),
	);

	if ( isset( $block->context['query'] ) ) {
		if ( isset( $block->context['query']['postType'] ) ) {
			$query['post_type'] = $block->context['query']['postType'];
		}
		if ( isset( $block->context['query']['sticky'] ) && ! empty( $block->context['query']['sticky'] ) ) {
			$sticky = get_option( 'sticky_posts' );
			if ( 'only' === $block->context['query']['sticky'] ) {
				$query['post__in'] = $sticky;
			} else {
				$query['post__not_in'] = array_merge( $query['post__not_in'], $sticky );
			}
		}
		if ( isset( $block->context['query']['exclude'] ) ) {
			$query['post__not_in'] = array_merge( $query['post__not_in'], $block->context['query']['exclude'] );
		}
		if ( isset( $block->context['query']['perPage'] ) ) {
			$query['offset'] = ( $block->context['query']['perPage'] * ( $page - 1 ) ) + $block->context['query']['offset'];
		}
		if ( isset( $block->context['query']['categoryIds'] ) ) {
			$query['category__in'] = $block->context['query']['categoryIds'];
		}
		if ( isset( $block->context['query']['tagIds'] ) ) {
			$query['tag__in'] = $block->context['query']['tagIds'];
		}
		if ( isset( $block->context['query']['order'] ) ) {
			$query['order'] = strtoupper( $block->context['query']['order'] );
		}
		if ( isset( $block->context['query']['orderBy'] ) ) {
			$query['orderby'] = $block->context['query']['orderBy'];
		}
		if ( isset( $block->context['query']['perPage'] ) ) {
			$query['posts_per_page'] = $block->context['query']['perPage'];
		}
		if ( isset( $block->context['query']['author'] ) ) {
			$query['author'] = $block->context['query']['author'];
		}
		if ( isset( $block->context['query']['search'] ) ) {
			$query['s'] = $block->context['query']['search'];
		}
	}

	$posts = get_posts( $query );

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
		$content .= "<li>{$block_content}</li>";
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
