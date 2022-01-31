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

	$width   = isset( $attributes['width'] ) ? $attributes['width'] : 96;
	$height  = isset( $attributes['height'] ) ? $attributes['height'] : 96;
	$styles  = isset( $wrapper_attributes['style'] ) ? $wrapper_attributes['style'] : '';
	$classes = isset( $wrapper_attributes['class'] ) ? $wrapper_attributes['class'] : '';

	// Add border width styles.
	$has_border_width = ! empty( $attributes['style']['border']['width'] );

	if ( $has_border_width ) {
		$border_width   = $attributes['style']['border']['width'];
		$image_styles[] = sprintf( 'border-width: %s;', esc_attr( $border_width ) );
	}

	// Add border radius styles.
	$has_border_radius = ! empty( $attributes['style']['border']['radius'] );

	if ( $has_border_radius ) {
		$border_radius = $attributes['style']['border']['radius'];

		if ( is_array( $border_radius ) ) {
			// Apply styles for individual corner border radii.
			foreach ( $border_radius as $key => $value ) {
				if ( null !== $value ) {
					// Convert camelCase key to kebab-case.
					$name = strtolower( preg_replace( '/(?<!^)[A-Z]/', '-$0', $key ) );

					// Add shared styles for individual border radii.
					$border_style   = sprintf(
						'border-%s-radius: %s;',
						esc_attr( $name ),
						esc_attr( $value )
					);
					$image_styles[] = $border_style;
				}
			}
		} else {
			$border_style   = sprintf( 'border-radius: %s;', esc_attr( $border_radius ) );
			$image_styles[] = $border_style;
		}
	}

	// Add border color styles.
	$has_border_color = ! empty( $attributes['style']['border']['color'] );

	if ( $has_border_color ) {
		$border_color   = $attributes['style']['border']['color'];
		$image_styles[] = sprintf( 'border-color: %s;', esc_attr( $border_color ) );
	}

	// Add border style (solid, dashed, dotted ).
	$has_border_style = ! empty( $attributes['style']['border']['style'] );

	if ( $has_border_style ) {
		$border_style   = $attributes['style']['border']['style'];
		$image_styles[] = sprintf( 'border-style: %s;', esc_attr( $border_style ) );
	}

	// Add border classes to the avatar image for both custom colors and palette colors.
	$image_classes = '';
	if ( $has_border_color || isset( $attributes['borderColor'] ) ) {
		$image_classes .= 'has-border-color';
	}
	if ( isset( $attributes['borderColor'] ) ) {
		$image_classes .= ' has-' . $attributes['borderColor'] . '-border-color';
	}

	/* translators: %s is the Comment Author name */
	$alt = sprintf( __( '%s Avatar' ), $comment->comment_author );

	$border_styles = safecss_filter_attr( implode( ' ', $image_styles ) );

	$classes = $classes . ' ' . $image_classes;
	$styles  = $styles . ' ' . $border_styles;

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
	if ( isset( $spacing_attributes ) ) {
		return sprintf( '<div style="%1s">%2s</div>', esc_attr( $spacing_string ), $avatar_block );
	}
	return sprintf( '<div>%1s</div>', $avatar_block );
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
