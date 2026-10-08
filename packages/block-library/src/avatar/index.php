<?php
/**
 * Server-side rendering of the `core/avatar` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/avatar` block on the server.
 *
 * @since 6.0.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Return the avatar.
 */
function render_block_core_avatar( $attributes, $content, $block ) {
	$size               = $attributes['size'] ?? 96;
	$wrapper_attributes = get_block_wrapper_attributes();
	$border_attributes  = get_block_core_avatar_border_attributes( $attributes );
	$shadow_styles      = wp_style_engine_get_styles( array( 'shadow' => $attributes['style']['shadow'] ?? null ) );

	// Class gets passed through `esc_attr` via `get_avatar`.
	$image_classes = ! empty( $border_attributes['class'] )
		? "wp-block-avatar__image {$border_attributes['class']}"
		: 'wp-block-avatar__image';

	// Unlike class, `get_avatar` doesn't filter the styles via `esc_attr`.
	// The style engine does pass the border and shadow styles through
	// `safecss_filter_attr` however.
	$image_css    = ( $border_attributes['style'] ?? '' ) . ( $shadow_styles['css'] ?? '' );
	$image_styles = ! empty( $image_css )
		? sprintf( ' style="%s"', esc_attr( $image_css ) )
		: '';

	if ( ! isset( $block->context['commentId'] ) ) {
		if ( isset( $attributes['userId'] ) ) {
			$author_id = $attributes['userId'];
		} elseif ( isset( $block->context['postId'] ) ) {
			$author_id = get_post_field( 'post_author', $block->context['postId'] );
		} else {
			$author_id = get_query_var( 'author' );
		}

		if ( empty( $author_id ) ) {
			return '';
		}

		$author_name = get_the_author_meta( 'display_name', $author_id );
		// translators: %s: Author name.
		$alt          = sprintf( __( '%s Avatar' ), $author_name );
		$avatar_block = get_avatar(
			$author_id,
			$size,
			'',
			$alt,
			array(
				'extra_attr' => $image_styles,
				'class'      => $image_classes,
			)
		);
		if ( isset( $attributes['isLink'] ) && $attributes['isLink'] ) {
			$label = '';
			if ( '_blank' === $attributes['linkTarget'] ) {
				// translators: %s is the Author name.
				$label = 'aria-label="' . esc_attr( sprintf( __( '(%s author archive, opens in a new tab)' ), $author_name ) ) . '"';
			}
			// translators: 1: Author archive link. 2: Link target. %3$s Aria label. %4$s Avatar image.
			$avatar_block = sprintf( '<a href="%1$s" target="%2$s" %3$s class="wp-block-avatar__link">%4$s</a>', esc_url( get_author_posts_url( $author_id ) ), esc_attr( $attributes['linkTarget'] ), $label, $avatar_block );
		}
		return sprintf( '<div %1$s>%2$s</div>', $wrapper_attributes, $avatar_block );
	}
	$comment = get_comment( $block->context['commentId'] );
	if ( ! $comment ) {
		return '';
	}
	/* translators: %s: Author name. */
	$alt          = sprintf( __( '%s Avatar' ), $comment->comment_author );
	$avatar_block = get_avatar(
		$comment,
		$size,
		'',
		$alt,
		array(
			'extra_attr' => $image_styles,
			'class'      => $image_classes,
		)
	);
	if ( isset( $attributes['isLink'] ) && $attributes['isLink'] && isset( $comment->comment_author_url ) && '' !== $comment->comment_author_url ) {
		$label = '';
		if ( '_blank' === $attributes['linkTarget'] ) {
			// translators: %s: Comment author name.
			$label = 'aria-label="' . esc_attr( sprintf( __( '(%s website link, opens in a new tab)' ), $comment->comment_author ) ) . '"';
		}
		$avatar_block = sprintf( '<a href="%1$s" target="%2$s" %3$s class="wp-block-avatar__link">%4$s</a>', esc_url( $comment->comment_author_url ), esc_attr( $attributes['linkTarget'] ), $label, $avatar_block );
	}
	return sprintf( '<div %1$s>%2$s</div>', $wrapper_attributes, $avatar_block );
}

/**
 * Generates class names and styles to apply the border support styles for
 * the Avatar block.
 *
 * @since 6.3.0
 *
 * @param array $attributes The block attributes.
 * @return array The border-related classnames and styles for the block.
 */
function get_block_core_avatar_border_attributes( $attributes ) {
	return wp_get_border_classes_and_styles( $attributes );
}

/**
 * Registers the `core/avatar` block on the server.
 *
 * @since 6.0.0
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
