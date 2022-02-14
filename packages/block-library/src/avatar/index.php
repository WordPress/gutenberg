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
	$width  = isset( $attributes['width'] ) ? $attributes['width'] : 96;
	$height = isset( $attributes['height'] ) ? $attributes['height'] : 96;
	// This is the only way to retreive style and classes on different instances.
	$wrapper_attributes = WP_Block_Supports::get_instance()->apply_block_supports();

	/**
	 * We get the spacing attributes and transform the array provided into a string formatted for being applied as a style html tag.
	 * Good candidate to be moved to a separate function in core.
	*/
	$spacing_attributes = isset( $attributes['style']['spacing'] ) ? $attributes['style']['spacing'] : null;
	if ( isset( $spacing_attributes ) && ! empty( $spacing_attributes ) ) {
		$spacing_array = array();
		foreach ( $spacing_attributes as $spacing_attribute_key => $spacing_attribute_value ) {
			foreach ( $spacing_attribute_value as $position_key => $position_value ) {
				$spacing_array[] = $spacing_attribute_key . '-' . $position_key . ': ' . $position_value;
			}
		}
		$spacing_string = implode( ';', $spacing_array );
	}

	$styles  = isset( $wrapper_attributes['style'] ) ? $wrapper_attributes['style'] : '';
	$classes = isset( $wrapper_attributes['class'] ) ? $wrapper_attributes['class'] : '';

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
				'height'     => $height,
				'width'      => $width,
				'extra_attr' => sprintf( 'style="%1s"', $styles ),
				'class'      => $classes,
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
		if ( isset( $spacing_attributes ) ) {
			return sprintf( '<div style="%1s">%2s</div>', esc_attr( $spacing_string ), $avatar_block );
		}
		return sprintf( '<div>%1s</div>', $avatar_block );
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
			'height'     => $height,
			'width'      => $width,
			'extra_attr' => sprintf( 'style="%1s"', $styles ),
			'class'      => $classes,
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
	if ( isset( $spacing_attributes ) ) {
		return sprintf( '<div style="%1s">%2s</div>', esc_attr( $spacing_string ), $avatar_block );
	}
		return sprintf( '<div>%1s</div>', $avatar_block );
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
