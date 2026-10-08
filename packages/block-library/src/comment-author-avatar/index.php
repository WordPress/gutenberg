<?php
/**
 * Server-side rendering of the `core/comment-author-avatar` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/comment-author-avatar` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Return the post comment's avatar.
 */
function render_block_core_comment_author_avatar( $attributes, $content, $block ) {
	if ( ! isset( $block->context['commentId'] ) ) {
		return '';
	}

	$comment = get_comment( $block->context['commentId'] );
	if ( ! $comment ) {
		return '';
	}

	// This is the only way to retrieve style and classes on different instances.
	$wrapper_attributes = WP_Block_Supports::get_instance()->apply_block_supports();

	// Spacing skips serialization, so it is applied to the wrapper rather than the image.
	$spacing_attributes = $attributes['style']['spacing'] ?? null;
	$spacing_styles     = wp_get_spacing_classes_and_styles( $attributes );

	$width   = $attributes['width'] ?? 96;
	$height  = $attributes['height'] ?? 96;
	$styles  = $wrapper_attributes['style'] ?? '';
	$classes = $wrapper_attributes['class'] ?? '';

	/* translators: %s: Author name. */
	$alt = sprintf( __( '%s Avatar' ), $comment->comment_author );

	$avatar_block = get_avatar(
		$comment,
		null,
		'',
		$alt,
		array(
			'height'     => $height,
			'width'      => $width,
			'extra_attr' => sprintf( 'style="%s"', $styles ),
			'class'      => $classes,
		)
	);
	if ( isset( $spacing_attributes ) ) {
		return sprintf( '<div style="%1$s">%2$s</div>', esc_attr( $spacing_styles['style'] ?? '' ), $avatar_block );
	}
	return sprintf( '<div>%s</div>', $avatar_block );
}

/**
 * Registers the `core/comment-author-avatar` block on the server.
 */
function register_block_core_comment_author_avatar() {
	register_block_type_from_metadata(
		__DIR__ . '/comment-author-avatar',
		array(
			'render_callback' => 'render_block_core_comment_author_avatar',
		)
	);
}
add_action( 'init', 'register_block_core_comment_author_avatar' );
