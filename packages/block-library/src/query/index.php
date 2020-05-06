<?php
/**
 * Server-side rendering of the `core/query` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/query` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the output of the query, structured using the layout defined by the block's inner blocks.
 */
function render_block_core_query( $attributes, $content, $block ) {
	$page_key = 'query-' . $attributes['id'] . '-page';
	$page     = empty( $_GET[ $page_key ] ) ? 1 : $_GET[ $page_key ];
	$posts    = get_posts(
		array(
			'post_type'      => 'post',
			'posts_per_page' => $attributes['query']['per_page'],
			'offset'         => $attributes['query']['per_page'] * ( $page - 1 ) + $attributes['query']['offset'],
		)
	);

	$content = '';

	// Render posts.
	foreach ( $posts as $post ) {
		$content .= (
			new WP_Block(
				$block->parsed_block,
				array_merge(
					$block->available_context ? $block->available_context : array(),
					array(
						'postType' => $post->post_type,
						'postId'   => $post->ID,
					)
				)
			)
		)->render( true );
	}

	// Render pagination.
	// TODO: Make pagination buttons inner blocks of the Query block.
	if ( 1 !== $page ) {
		$content .= sprintf(
			'<div><a href="%s">Previous</a></div>',
			add_query_arg( $page_key, '2' === $page ? false : $page - 1 )
		);
	}
	if ( $page < $attributes['query']['pages'] ) {
		$content .= sprintf(
			'<div><a href="%s">Next</a></div>',
			add_query_arg( $page_key, $page + 1 )
		);
	}

	return $content;
}

/**
 * Registers the `core/query` block on the server.
 */
function register_block_core_query() {
	register_block_type_from_metadata(
		__DIR__ . '/query',
		array(
			'render_callback' => 'render_block_core_query',
		)
	);
}
add_action( 'init', 'register_block_core_query' );
