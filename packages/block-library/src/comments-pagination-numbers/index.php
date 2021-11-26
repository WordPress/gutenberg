<?php
/**
 * Server-side rendering of the `core/comments-pagination-numbers` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/comments-pagination-numbers` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the pagination numbers for the comments.
 */
function render_block_core_comments_pagination_numbers( $attributes, $content, $block ) {
	// Get the post ID from which comments should be retrieved.
	$post_id = isset( $block->context['postId'] )
		? $block->context['postId']
		: get_the_id();

	if ( ! $post_id ) {
		return '';
	}

	// Get the 'comments per page' setting.
	$per_page = isset( $block->context['queryPerPage'] )
		? $block->context['queryPerPage']
		: get_option( 'comments_per_page' );

	// Get the total number of pages.
	$comments = get_approved_comments( $post_id );
	$total    = get_comment_pages_count( $comments, $per_page );

	// Get the number of the default page.
	$default_page = 'newest' === get_option( 'default_comments_page' ) ? 1 : $total;

	// Get the current comment page from the URL.
	$current = empty( $_GET['cpage'] ) ? $default_page : (int) $_GET['cpage'];

	// Render links.
	$content = paginate_comments_links(
		array(
			'total'     => $total,
			'current'   => $current,
			'prev_next' => false,
			'echo'      => false,
		)
	);

	if ( empty( $content ) ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$content
	);
}

/**
 * Registers the `core/comments-pagination-numbers` block on the server.
 */
function register_block_core_comments_pagination_numbers() {
	register_block_type_from_metadata(
		__DIR__ . '/comments-pagination-numbers',
		array(
			'render_callback' => 'render_block_core_comments_pagination_numbers',
		)
	);
}
add_action( 'init', 'register_block_core_comments_pagination_numbers' );
