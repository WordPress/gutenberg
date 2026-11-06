<?php
/**
 * Server-side rendering of the `core/comment-edit-link` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/comment-edit-link` block on the server.
 *
 * @since 6.0.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Return the post comment's date.
 */
function render_block_core_comment_edit_link( $attributes, $content, $block ) {
	if ( ! isset( $block->context['commentId'] ) || ! current_user_can( 'edit_comment', $block->context['commentId'] ) ) {
		return '';
	}

	$edit_comment_link = get_edit_comment_link( $block->context['commentId'] );

	$link_atts = '';

	if ( ! empty( $attributes['linkTarget'] ) ) {
		$link_atts .= sprintf( 'target="%s"', esc_attr( $attributes['linkTarget'] ) );
	}

	$classes = array();
	if ( isset( $attributes['textAlign'] ) ) {
		$classes[] = 'has-text-align-' . $attributes['textAlign'];
	}
	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classes[] = 'has-link-color';
	}

	$links = sprintf(
		'<a href="%1$s" %2$s>%3$s</a>',
		esc_url( $edit_comment_link ),
		$link_atts,
		esc_html__( 'Edit' )
	);

	if ( ! empty( $attributes['showModerationLinks'] ) ) {
		$comment_id  = $block->context['commentId'];
		$is_approved = '1' === get_comment( $comment_id )->comment_approved;

		// Each action maps to the nonce action and label expected by wp-admin/comment.php.
		$moderation_links = array(
			$is_approved ? 'unapprovecomment' : 'approvecomment' => array( 'approve-comment_', $is_approved ? __( 'Unapprove' ) : __( 'Approve' ) ),
			'spamcomment' => array( 'delete-comment_', _x( 'Spam', 'verb' ) ),
		);

		// Without a trash, trashing deletes permanently, which is too risky for a one-click link.
		if ( EMPTY_TRASH_DAYS ) {
			$moderation_links['trashcomment'] = array( 'delete-comment_', _x( 'Trash', 'verb' ) );
		}

		// Moderation actions redirect back to the current page, so they always open in the same tab.
		foreach ( $moderation_links as $action => list( $nonce_action, $label ) ) {
			$url    = wp_nonce_url( admin_url( "comment.php?action=$action&c=$comment_id" ), $nonce_action . $comment_id );
			$links .= sprintf(
				' <a href="%1$s">%2$s</a>',
				esc_url( $url ),
				esc_html( $label )
			);
		}
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classes ) ) );

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$links
	);
}

/**
 * Registers the `core/comment-edit-link` block on the server.
 *
 * @since 6.0.0
 */
function register_block_core_comment_edit_link() {
	register_block_type_from_metadata(
		__DIR__ . '/comment-edit-link',
		array(
			'render_callback' => 'render_block_core_comment_edit_link',
		)
	);
}

add_action( 'init', 'register_block_core_comment_edit_link' );
