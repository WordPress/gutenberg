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

	$image_styles = array();

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

	$author_name = get_the_author_meta( 'display_name', $author_id );
	/* translators: %s is the Author name */
	$alt    = sprintf( __( '%s Avatar' ), $author_name );
	$width  = isset( $attributes['width'] ) ? $attributes['width'] : 96;
	$height = isset( $attributes['height'] ) ? $attributes['height'] : 96;

	$avatar = get_avatar(
		$author_id,
		null, // Default size is unused: Use height and width instead.
		'',   // Default gravatar.
		$alt,
		array(
			'height'     => $height,
			'width'      => $width,
			'extra_attr' => isset( $image_styles ) ? sprintf( ' style="%s"', safecss_filter_attr( implode( ' ', $image_styles ) ) ) : '',
			'class'      => "wp-block-post-author-avatar__image $image_classes",
		)
	);

	$wrapper_attributes = get_block_wrapper_attributes();

	if ( isset( $attributes['isLink'] ) && $attributes['isLink'] ) {
		$avatar = sprintf( '<a href="%1$s" target="%2$s" class="wp-block-post-author-avatar__link">%3$s</a>', get_author_posts_url( $author_id ), esc_attr( $attributes['linkTarget'] ), $avatar );
	}

	return sprintf(
		'<figure %1$s>%2$s</figure>',
		$wrapper_attributes,
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
