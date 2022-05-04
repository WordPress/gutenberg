<?php
/**
 * Server-side rendering of the `core/comments-title` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/comments-title` block on the server.
 *
 * @param array $attributes Block attributes.
 *
 * @return string Return the post comments title.
 */
function render_block_core_comments_title( $attributes ) {

	if ( post_password_required() ) {
		return;
	}

	$align_class_name    = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";
	$show_post_title     = ! empty( $attributes['showPostTitle'] ) && $attributes['showPostTitle'];
	$show_comments_count = ! empty( $attributes['showCommentsCount'] ) && $attributes['showCommentsCount'];
	$wrapper_attributes  = get_block_wrapper_attributes( array( 'class' => $align_class_name ) );
	$comments_count      = number_format_i18n( get_comments_number() );
	$post_title          = '&#8220;' . get_the_title() . '&#8221;';
	$tag_name            = 'h2';
	if ( isset( $attributes['level'] ) ) {
		$tag_name = 'h' . $attributes['level'];
	}

	if ( '0' === $comments_count ) {
		return;
	}

	if ( $show_comments_count && ! empty( $comments_count ) ) {
		if ( $show_post_title ) {
			if ( '1' === $comments_count ) {
				/* translators: %s: Post title. */
				$comment_label = sprintf( __( 'One response to %s' ), $post_title );
			} else {
				$comment_label = sprintf(
					/* translators: 1: Number of comments, 2: Post title. */
					_n(
						'%1$s response to %2$s',
						'%1$s responses to %2$s',
						$comments_count
					),
					$comments_count,
					$post_title
				);
			}
		} elseif ( '1' === $comments_count ) {
			$comment_label = __( 'One response' );
		} else {
			$comment_label = sprintf(
				/* translators: %s: Number of comments. */
				_n( '%s responses', '%s responses', $comments_count ),
				$comments_count
			);
		}
	} elseif ( $show_post_title ) {
		if ( '1' === $comments_count ) {
			/* translators: %s: Post title. */
			$comment_label = sprintf( __( 'Response to %s' ), $post_title );
		} else {
			/* translators: %s: Post title. */
			$comment_label = sprintf( __( 'Responses to %s' ), $post_title );
		}
	} elseif ( '1' === $comments_count ) {
		$comment_label = __( 'Response' );
	} else {
		$comment_label = __( 'Responses' );
	}

	return sprintf(
		'<%1$s id="comments" %2$s>%3$s</%1$s>',
		$tag_name,
		$wrapper_attributes,
		$comment_label
	);
}

/**
 * Registers the `core/comments-title` block on the server.
 */
function register_block_core_comments_title() {
	register_block_type_from_metadata(
		__DIR__ . '/comments-title',
		array(
			'render_callback' => 'render_block_core_comments_title',
		)
	);
}

add_action( 'init', 'register_block_core_comments_title' );
