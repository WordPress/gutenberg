<?php
/**
 * Server-side rendering of the `core/avatar` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/avatar` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Return the avatar.
 */
function render_block_core_avatar( $attributes, $content, $block ) {
	$width              = isset( $attributes['width'] ) ? $attributes['width'] : 96;
	$height             = isset( $attributes['height'] ) ? $attributes['height'] : 96;
	$wrapper_attributes = get_block_wrapper_attributes();

	if ( ! isset( $block->context['commentId'] ) ) {
		$author_id   = get_post_field( 'post_author', $block->context['postId'] );
		$author_name = get_the_author_meta( 'display_name', $author_id );
		// translators: %s is the Author name.
		$alt          = sprintf( __( '%s Avatar' ), $author_name );
		$avatar_block = get_avatar(
			$author_id,
			null,
			'',
			$alt,
			array(
				'height' => $height,
				'width'  => $width,
			)
		);
		if ( isset( $attributes['isLink'] ) && $attributes['isLink'] ) {
			$label = '';
			if ( '_blank' === $attributes['linkTarget'] ) {
				// translators: %s is the Author name.
				$label = 'aria-label="' . sprintf( esc_attr__( '( %s author archive, opens in a new tab)' ), $author_name ) . '"';
			}
			// translators: %1$s: Author archive link. %2$s: Link target. %3$s Aria label. %4$s Avatar image.
			$avatar_block = sprintf( '<a href="%1$s" target="%2$s" %3$s class="wp-block-post-avatar__link">%4$s</a>', get_author_posts_url( $author_id ), esc_attr( $attributes['linkTarget'] ), $label, $avatar_block );
		}
		return sprintf( '<div %1s>%2s</div>', $wrapper_attributes, $avatar_block );
	}
	$comment = get_comment( $block->context['commentId'] );
	/* translators: %s is the Comment Author name */
	$alt = sprintf( __( '%s Avatar' ), $comment->comment_author );
	if ( ! $comment ) {
		return '';
	}
	$avatar_block = get_avatar(
		$comment,
		null,
		'',
		$alt,
		array(
			'height' => $height,
			'width'  => $width,
		)
	);
	if ( isset( $attributes['isLink'] ) && $attributes['isLink'] && isset( $comment->comment_author_url ) && '' !== $comment->comment_author_url ) {
		$label = '';
		if ( '_blank' === $attributes['linkTarget'] ) {
			// translators: %s is the Comment Author name.
			$label = 'aria-label="' . sprintf( esc_attr__( '( %s website link, opens in a new tab)' ), $comment->comment_author ) . '"';
		}
		// translators: %1$s: Comment Author website link. %2$s: Link target. %3$s Aria label. %4$s Avatar image.
		$avatar_block = sprintf( '<a href="%1$s" target="%2$s" %3$s class="wp-block-post-avatar__link">%4$s</a>', $comment->comment_author_url, esc_attr( $attributes['linkTarget'] ), $label, $avatar_block );
	}
	return sprintf( '<div %1s>%2s</div>', $wrapper_attributes, $avatar_block );
}

/**
 * Registers the `core/avatar` block on the server.
 */
function register_block_core_avatar() {
	register_block_type_from_metadata(
		__DIR__ . '/avatar',
		array(
			'render_callback' => 'render_block_core_avatar',
		)
	);
}
add_action( 'init', 'register_block_core_avatar' );
