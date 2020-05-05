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
	// TODO: Use customized query.
	$posts = get_posts(
		array(
			'post_type'      => 'post',
			'posts_per_page' => 10,
		)
	);

	$content = '';
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
