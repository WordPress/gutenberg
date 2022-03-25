<?php
/**
 * Server-side rendering of the `core/comment-reply-link` block.
 *
 * @package WordPress
 */
function render_js_comment_post_form() {
	return "
		async createComment({ content, parent }) {
			const commentPosted = await fetch( apiSettings.root + 'wp/v2/comments/', {
				method: 'POST',
				body: JSON.stringify({
					post: 1,
					author_name: 'admin',
					author_email: 'wordpress@example.com',
					'parent': parent,
					'content': content,
				}),
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
					'X-WP-Nonce': apiSettings.nonce,
				},
			});
			const comment = await commentPosted.json();
			if (comment) {
				location.reload();
			}
		}
	";
}

/**
 * Renders the `core/comment-reply-link` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Return the post comment's reply link.
 */
function render_block_core_comment_reply_link( $attributes, $content, $block ) {
	require_alpine_js();
	if ( ! isset( $block->context['commentId'] ) ) {
		return '';
	}

	$thread_comments = get_option( 'thread_comments' );
	if ( ! $thread_comments ) {
		return '';
	}

	$comment = get_comment( $block->context['commentId'] );
	if ( empty( $comment ) ) {
		return '';
	}

	$depth     = 1;
	$max_depth = get_option( 'thread_comments_depth' );
	$parent_id = $comment->comment_parent;

	// Compute comment's depth iterating over its ancestors.
	while ( ! empty( $parent_id ) ) {
		$depth++;
		$parent_id = get_comment( $parent_id )->comment_parent;
	}

	$comment_reply_link = get_comment_reply_link(
		array(
			'depth'     => $depth,
			'max_depth' => $max_depth,
		),
		$comment
	);

	// Render nothing if the generated reply link is empty.
	if ( empty( $comment_reply_link ) ) {
		return;
	}

	$classes = '';
	if ( isset( $attributes['textAlign'] ) ) {
		$classes .= 'has-text-align-' . $attributes['textAlign'];
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $classes ) );

	$comment_field = '<p class="comment-form-comment"><label for="comment">' . _x( 'Comment', 'noun' ) . '</label><br /><textarea x-model="commentContent" id="comment" name="comment" aria-required="true"></textarea></p>';
	ob_start();
	comment_form(
		array(
			'comment_field' => $comment_field,
		)
	);
	$form = str_replace(
		'<form',
		'<form x-on:submit.prevent="createComment({ parent:' . $block->context['commentId'] . ', content: commentContent })" ',
		ob_get_clean()
	);

	$comment_toggled_form = sprintf(
		'<div x-data="{ commentContent: \'\', open: false, ' . render_js_comment_post_form() . '  }" %1$s>
			<div @click.prevent="open = ! open">%2$s</div>
			<div x-show="open" x-transition>
				%3$s
			</div>
		</div>',
		$wrapper_attributes,
		$comment_reply_link,
		$form
	);
	return $comment_toggled_form;
}

/**
 * Registers the `core/comment-reply-link` block on the server.
 */
function register_block_core_comment_reply_link() {
	register_block_type_from_metadata(
		__DIR__ . '/comment-reply-link',
		array(
			'render_callback' => 'render_block_core_comment_reply_link',
		)
	);
}

add_action( 'init', 'register_block_core_comment_reply_link' );
