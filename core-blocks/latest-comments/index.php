<?php
/**
 * Server-side rendering of the `core/latest-comments` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/latest-comments` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with latest comments added.
 */
function gutenberg_render_block_core_latest_comments( $attributes = array() ) {

	// Basic attribute validation.
	if (
		! is_numeric( $attributes['commentsToShow'] ) ||
		$attributes['commentsToShow'] < 0 ||
		$attributes['commentsToShow'] > 100
	) {
		$attributes['commentsToShow'] = 5;
	}

	$align = 'center';
	if ( isset( $attributes['align'] ) && in_array( $attributes['align'], array( 'left', 'right', 'wide', 'full' ), true ) ) {
		$align = $attributes['align'];
	}

	/** This filter is documented in wp-includes/widgets/class-wp-widget-recent-comments.php */
	$comments = get_comments( apply_filters( 'widget_comments_args', array(
		'number'      => $attributes['commentsToShow'],
		'status'      => 'approve',
		'post_status' => 'publish',
	) ) );

	$list_items_markup = '';
	if ( ! empty( $comments ) ) {

		// Prime cache for associated posts. This is copied from \WP_Widget_Recent_Comments::widget().
		$post_ids = array_unique( wp_list_pluck( $comments, 'comment_post_ID' ) );
		_prime_post_caches( $post_ids, strpos( get_option( 'permalink_structure' ), '%category%' ), false );

		foreach ( $comments as $comment ) {
			$list_items_markup .= '<li class="recentcomments">';
			if ( $attributes['displayAvatar'] ) {
				$avatar = get_avatar( $comment, 48, '', '', array(
					'class' => 'wp-block-latest-comments__comment-avatar',
				) );
				if ( $avatar ) {
					$list_items_markup .= $avatar;
				}
			}

			$list_items_markup .= '<div class="comment-data"';
			$author_url         = get_comment_author_url( $comment );
			if ( empty( $author_url ) && ! empty( $comment->user_id ) ) {
				$author_url = get_author_posts_url( $comment->user_id );
			}
			if ( $author_url ) {
				$list_items_markup .= '<a class="wp-block-latest-comments__comment-author" href="' . esc_url( $author_url ) . '">' . get_comment_author( $comment ) . '</a>';
			} else {
				$list_items_markup .= '<a class="wp-block-latest-comments__comment-author">' . get_comment_author( $comment ) . '</a>';
			}

			$list_items_markup .= __( ' on ', 'gutenberg' );
			$list_items_markup .= '<a class="wp-block-latest-comments__comment-link" href="' . esc_url( get_comment_link( $comment ) ) . '">' . get_the_title( $comment->comment_post_ID ) . '</a>';

			if ( $attributes['displayTimestamp'] ) {
				$list_items_markup .= sprintf(
					'<time datetime="%1$s" class="wp-block-latest-comments__comment-timestamp">%2$s</time>',
					esc_attr( get_comment_date( 'c', $comment ) ),
					esc_html( get_comment_date( '', $comment ) )
				);
			}
			if ( $attributes['displayExcerpt'] ) {
				$list_items_markup .= '<div class="wp-block-latest-comments__comment-excerpt">' . wpautop( get_comment_excerpt( $comment ) ) . '</div>';
			}
			$list_items_markup .= '</div></li>';
		}
	}

	$class = "wp-block-latest-comments align{$align}";
	if ( $attributes['displayAvatar'] ) {
		$class .= ' has-avatars';
	}
	if ( $attributes['displayTimestamp'] ) {
		$class .= ' has-timestamps';
	}
	if ( $attributes['displayExcerpt'] ) {
		$class .= ' has-excerpts';
	}

	$block_content = sprintf(
		'<ul class="%1$s">%2$s</ul>',
		esc_attr( $class ),
		$list_items_markup
	);

	return $block_content;
}

register_block_type( 'core/latest-comments', array(
	'attributes'      => array(
		'className'        => array(
			'type' => 'string',
		),
		'commentsToShow'   => array(
			'type'    => 'number',
			'default' => 5,
		),
		'displayAvatar'    => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'displayExcerpt'   => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'displayTimestamp' => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'align'            => array(
			'type'    => 'string',
			'default' => 'center',
		),
	),
	'render_callback' => 'gutenberg_render_block_core_latest_comments',
) );
