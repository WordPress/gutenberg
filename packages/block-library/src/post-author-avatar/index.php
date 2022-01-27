<?php
/**
 * Server-side rendering of the `core/post-author-avatar` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-author-avatar` block on the server.
 *
 * @param  array    $attributes Block attributes.
 * @param  string   $content    Block default content.
 * @param  WP_Block $block      Block instance.
 * @return string Returns the rendered author avatar block.
 */
function render_block_core_post_author_avatar( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$author_id = get_post_field( 'post_author', $block->context['postId'] );
	if ( empty( $author_id ) ) {
		return '';
	}

	/**
	 * Separate styles from class names since we need to place them on different elements.
	 * This is the only way to retreive style and classes on different instances.
	 */
	$wrapper_attributes = WP_Block_Supports::get_instance()->apply_block_supports();

	$width         = isset( $attributes['width'] ) ? $attributes['width'] : 96;
	$height        = isset( $attributes['height'] ) ? $attributes['height'] : 96;
	$styles        = isset( $wrapper_attributes['style'] ) ? $wrapper_attributes['style'] : '';
	$classes       = isset( $wrapper_attributes['class'] ) ? $wrapper_attributes['class'] : '';
	$author_name   = get_the_author_meta( 'display_name', $author_id );
	$image_classes = '';

	if ( isset( $attributes['style']['border'] ) ) {
		/**
		 * Remove the border class from the figure element,
		 * because we only want it to be visible around the image:
		 */
		$classes = str_replace( $classes, 'has-border-color', '' );

		// Add the border classes to the image element for consistency.
		$image_classes = 'has-border-color';
		if ( isset( $attributes['borderColor'] ) ) {
			$image_classes .= ' has-' . $attributes['borderColor'] . '-border-color';
		}
	}

	/* translators: %s is the Author name */
	$alt = sprintf( __( '%s Avatar' ), $author_name );

	$avatar = get_avatar(
		$author_id,
		null, // Default size is unused: Use height and width instead.
		'',   // Default gravatar.
		$alt,
		array(
			'height'     => $height,
			'width'      => $width,
			'extra_attr' => sprintf( 'style="%1s"', $styles ),
			'class'      => "wp-block-post-author-avatar__image $image_classes",
		)
	);

	if ( isset( $attributes['isLink'] ) && $attributes['isLink'] ) {
		$avatar = sprintf( '<a href="%1$s" target="%2$s" class="wp-block-post-author-avatar__link">%3$s</a>', get_author_posts_url( $author_id ), esc_attr( $attributes['linkTarget'] ), $avatar );
	}

	return sprintf(
		'<figure class="wp-block-post-author-avatar %1$s">%2$s</figure>',
		$classes,
		$avatar
	);
}

/**
 * Registers the `core/post-author-avatar` block on the server.
 */
function register_block_core_post_author_avatar() {
	register_block_type_from_metadata(
		__DIR__ . '/post-author-avatar',
		array(
			'render_callback' => 'render_block_core_post_author_avatar',
		)
	);
}
add_action( 'init', 'register_block_core_post_author_avatar' );
