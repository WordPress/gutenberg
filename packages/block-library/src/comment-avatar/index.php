<?php
/**
 * Server-side rendering of the `core/comment-avatar` block.
 *
 * @package WordPress
 */

/**
 * Builds an array of inline styles for the avatar block.
 *
 * The result will contain one entry for shared styles such as those for the
 * inner img and a second for the inner wrapper.
 *
 * @param  array $attributes The block attributes.
 *
 * @return array Style HTML attribute.
 */
function block_core_comment_avatar_set_styles( $attributes ) {
	$has_border_radius = ! empty( $attributes['style']['border']['radius'] );
	$has_padding       = ! empty( $attributes['style']['spacing']['padding'] );
	$border_styles     = array();
	$wrapper_styles    = array();

	if ( $has_border_radius ) {
		$border_radius = $attributes['style']['border']['radius'];
		if ( is_array( $border_radius ) ) {
			// Apply styles for individual corner border radii.
			foreach ( $border_radius as $key => $value ) {
				if ( null !== $value ) {
					// Convert camelCase key to kebab-case.
					$name = strtolower( preg_replace( '/(?<!^)[A-Z]/', '-$0', $key ) );

					// Add shared styles for individual border radii for input & button.
					$border_style    = sprintf(
						'border-%1$s-radius: %2$s;',
						esc_attr( $name ),
						esc_attr( $value )
					);
					$border_styles[] = $border_style;
				}
			}
		} else {
			// Numeric check is for backwards compatibility purposes.
			$border_radius   = is_numeric( $border_radius ) ? $border_radius . 'px' : $border_radius;
			$border_style    = sprintf( 'border-radius: %s;', esc_attr( $border_radius ) );
			$border_styles[] = $border_style;
		}
	}

	if ( $has_padding ) {
		$padding = $attributes['style']['spacing']['padding'];
		foreach ( $padding as $key => $value ) {
			if ( null !== $value ) {
				// Convert to lowercase.
				$lowercase_key = strtolower( $key );

				// Add shared styles for individual border radii for input & button.
				$wrapper_style    = sprintf(
					'padding-%1$s: %2$s;',
					esc_attr( $lowercase_key ),
					esc_attr( $value )
				);
				$wrapper_styles[] = $wrapper_style;
			}
		}
	}

	return array(
		'img'     => ! empty( $border_styles ) ? sprintf( ' style="%s"', implode( ' ', $border_styles ) ) : '',
		'wrapper' => ! empty( $wrapper_styles ) ? sprintf( 'class="wp-block-comment-avatar" style="%s"', implode( ' ', $wrapper_styles ) ) : '',
	);
}

/**
 * Renders the `core/comment-avatar` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Return the post comment's content.
 */
function render_block_core_comment_avatar( $attributes, $content, $block ) {
	if ( ! isset( $block->context['commentId'] ) ) {
		return '';
	}
	$comment = get_comment( $block->context['commentId'] );
	// We use this function in order to have the border-radius applied to the image and the padding to the wrapper.
	// Would be better to parse get_block_wrapper_attributes() and move the border-radius to the img?
	$inline_styles = block_core_comment_avatar_set_styles( $attributes );

	$width  = isset( $attributes['width'] ) ? $attributes['width'] : '96';
	$height = isset( $attributes['height'] ) ? $attributes['height'] : '96';
	$alt    = sprintf( __( '%s Avatar' ), $comment->comment_author );

	return sprintf(
		'<div %1$s>%2$s</div>',
		$inline_styles['wrapper'],
		get_avatar(
			$comment,
			null,
			'',
			$alt,
			array(
				'height'     => $height,
				'width'      => $width,
				'class'      => $attributes['className'],
				'extra_attr' => $inline_styles['img'],
			)
		)
	);

}

/**
 * Registers the `core/comment-avatar` block on the server.
 */
function register_block_core_comment_avatar() {
	register_block_type_from_metadata(
		__DIR__ . '/comment-avatar',
		array(
			'render_callback' => 'render_block_core_comment_avatar',
		)
	);
}
add_action( 'init', 'register_block_core_comment_avatar' );
