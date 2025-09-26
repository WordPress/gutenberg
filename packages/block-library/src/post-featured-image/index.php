<?php
/**
 * Server-side rendering of the `core/post-featured-image` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-featured-image` block on the server.
 *
 * @since 5.8.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the featured image for the current post.
 */
function render_block_core_post_featured_image( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}
	$post_ID = $block->context['postId'];

	$is_link = isset( $attributes['isLink'] ) && $attributes['isLink'];
	$size_slug = isset( $attributes['sizeSlug'] ) ? $attributes['sizeSlug'] : 'post-thumbnail';

	$featured_image_id = get_post_thumbnail_id( $post_ID );
	
	if ( isset( $attributes['useFirstImageFromPost'] ) && $attributes['useFirstImageFromPost'] && ! $featured_image_id ) {
		$content_post = get_post( $post_ID );
		$post_content = $content_post->post_content;
		$processor = new WP_HTML_Tag_Processor( $post_content );

		if ( $processor->next_tag( 'img' ) ) {
			$tag_html = new WP_HTML_Tag_Processor( '<img>' );
			$tag_html->next_tag();
			foreach ( $processor->get_attribute_names_with_prefix( '' ) as $name ) {
				$tag_html->set_attribute( $name, $processor->get_attribute( $name ) );
			}
			$first_image = $tag_html->get_updated_html();
			
			if ( $first_image && ! empty( $content ) ) {
				$p = new WP_HTML_Tag_Processor( $content );
				if ( $p->next_tag( 'img' ) ) {
					$src = $processor->get_attribute( 'src' );
					$alt = $processor->get_attribute( 'alt' ) ?: get_the_title( $post_ID );
					
					$p->set_attribute( 'src', $src );
					$p->set_attribute( 'alt', $alt );
					
					if ( $is_link ) {
						$updated_content = $p->get_updated_html();
						$link_processor = new WP_HTML_Tag_Processor( $updated_content );
						if ( $link_processor->next_tag( 'a' ) ) {
							$link_processor->set_attribute( 'href', get_the_permalink( $post_ID ) );
						}
						return $link_processor->get_updated_html();
					}
					
					return $p->get_updated_html();
				}
			}
		}
	}

	if ( ! $featured_image_id ) {
		return '';
	}

	if ( empty( $content ) ) {
		return render_block_core_post_featured_image_fallback( $attributes, $block );
	}

	$p = new WP_HTML_Tag_Processor( $content );

	if ( $p->next_tag( 'img' ) ) {
		$image_url = wp_get_attachment_image_url( $featured_image_id, $size_slug );
		$image_alt = get_post_meta( $featured_image_id, '_wp_attachment_image_alt', true );
		
		if ( ! $image_alt ) {
			$image_alt = get_the_title( $post_ID );
		}

		$p->set_attribute( 'src', $image_url );
		$p->set_attribute( 'alt', $image_alt );
		$p->add_class( "wp-image-{$featured_image_id}" );
	}

	// Handle link functionality - seek back to beginning after setting img attributes
	$updated_html = $p->get_updated_html();
	$link_processor = new WP_HTML_Tag_Processor( $updated_html );
	
	if ( $is_link && $link_processor->next_tag( 'a' ) ) {
		$link_processor->set_attribute( 'href', get_the_permalink( $post_ID ) );
		return $link_processor->get_updated_html();
	}

	return $p->get_updated_html();
}

/**
 * Fallback render function when no saved content exists.
 *
 * @param array    $attributes Block attributes.
 * @param WP_Block $block      Block instance.
 * @return string Returns the featured image HTML.
 */
function render_block_core_post_featured_image_fallback( $attributes, $block ) {
	$post_ID = $block->context['postId'];
	$is_link = isset( $attributes['isLink'] ) && $attributes['isLink'];
	$size_slug = isset( $attributes['sizeSlug'] ) ? $attributes['sizeSlug'] : 'post-thumbnail';
	$attr = get_block_core_post_featured_image_border_attributes( $attributes );
	$overlay_markup = get_block_core_post_featured_image_overlay_element_markup( $attributes );
	$caption = isset( $attributes['caption'] ) ? $attributes['caption'] : '';
	
	if ( $is_link ) {
		$title = get_the_title( $post_ID );
		if ( $title ) {
			$attr['alt'] = trim( strip_tags( $title ) );
		} else {
			$attr['alt'] = sprintf(
				__( 'Untitled post %d' ),
				$post_ID
			);
		}
	}

	$extra_styles = '';

	if ( ! empty( $attributes['aspectRatio'] ) ) {
		$extra_styles .= 'width:100%;height:100%;';
	} elseif ( ! empty( $attributes['height'] ) ) {
		$extra_styles .= "height:{$attributes['height']};";
	}

	if ( ! empty( $attributes['scale'] ) ) {
		$extra_styles .= "object-fit:{$attributes['scale']};";
	}
	if ( ! empty( $attributes['style']['shadow'] ) ) {
		$shadow_styles = wp_style_engine_get_styles( array( 'shadow' => $attributes['style']['shadow'] ) );

		if ( ! empty( $shadow_styles['css'] ) ) {
			$extra_styles .= $shadow_styles['css'];
		}
	}

	if ( ! empty( $extra_styles ) ) {
		$attr['style'] = empty( $attr['style'] ) ? $extra_styles : $attr['style'] . $extra_styles;
	}

	$featured_image = get_the_post_thumbnail( $post_ID, $size_slug, $attr );

	if ( ! $featured_image ) {
		return '';
	}

	if ( $is_link ) {
		$link_target = isset( $attributes['linkTarget'] ) ? $attributes['linkTarget'] : '_self';
		$rel = ! empty( $attributes['rel'] ) ? 'rel="' . esc_attr( $attributes['rel'] ) . '"' : '';
		$height = ! empty( $attributes['height'] ) ? 'style="' . esc_attr( safecss_filter_attr( 'height:' . $attributes['height'] ) ) . '"' : '';
		$featured_image = sprintf(
			'<a href="%1$s" target="%2$s" %3$s %4$s>%5$s%6$s</a>',
			get_the_permalink( $post_ID ),
			esc_attr( $link_target ),
			$rel,
			$height,
			$featured_image,
			$overlay_markup
		);
	} else {
		$featured_image = $featured_image . $overlay_markup;
	}

	$caption_markup = '';
	if ( ! empty( $caption ) ) {
		$caption_markup = '<figcaption class="wp-element-caption">' . wp_kses_post( $caption ) . '</figcaption>';
	}

	$aspect_ratio = ! empty( $attributes['aspectRatio'] )
		? esc_attr( safecss_filter_attr( 'aspect-ratio:' . $attributes['aspectRatio'] ) ) . ';'
		: '';
	$width = ! empty( $attributes['width'] )
		? esc_attr( safecss_filter_attr( 'width:' . $attributes['width'] ) ) . ';'
		: '';
	$height = ! empty( $attributes['height'] )
		? esc_attr( safecss_filter_attr( 'height:' . $attributes['height'] ) ) . ';'
		: '';
	if ( ! $height && ! $width && ! $aspect_ratio ) {
		$wrapper_attributes = get_block_wrapper_attributes();
	} else {
		$wrapper_attributes = get_block_wrapper_attributes( array( 'style' => $aspect_ratio . $width . $height ) );
	}
	return "<figure {$wrapper_attributes}>{$featured_image}{$caption_markup}</figure>";
}

/**
 * Generate markup for the HTML element that will be used for the overlay.
 *
 * @since 6.1.0
 *
 * @param array $attributes Block attributes.
 *
 * @return string HTML markup in string format.
 */
function get_block_core_post_featured_image_overlay_element_markup( $attributes ) {
	$has_dim_background = isset( $attributes['dimRatio'] ) && $attributes['dimRatio'];
	$has_gradient = isset( $attributes['gradient'] ) && $attributes['gradient'];
	$has_custom_gradient = isset( $attributes['customGradient'] ) && $attributes['customGradient'];
	$has_solid_overlay = isset( $attributes['overlayColor'] ) && $attributes['overlayColor'];
	$has_custom_overlay = isset( $attributes['customOverlayColor'] ) && $attributes['customOverlayColor'];
	$class_names = array( 'wp-block-post-featured-image__overlay' );
	$styles = array();

	if ( ! $has_dim_background ) {
		return '';
	}

	$border_attributes = get_block_core_post_featured_image_border_attributes( $attributes );

	if ( ! empty( $border_attributes['class'] ) ) {
		$class_names[] = $border_attributes['class'];
	}

	if ( ! empty( $border_attributes['style'] ) ) {
		$styles[] = $border_attributes['style'];
	}

	if ( $has_dim_background ) {
		$class_names[] = 'has-background-dim';
		$class_names[] = "has-background-dim-{$attributes['dimRatio']}";
	}

	if ( $has_solid_overlay ) {
		$class_names[] = "has-{$attributes['overlayColor']}-background-color";
	}

	if ( $has_gradient || $has_custom_gradient ) {
		$class_names[] = 'has-background-gradient';
	}

	if ( $has_gradient ) {
		$class_names[] = "has-{$attributes['gradient']}-gradient-background";
	}

	if ( $has_custom_gradient ) {
		$styles[] = sprintf( 'background-image: %s;', $attributes['customGradient'] );
	}

	if ( $has_custom_overlay ) {
		$styles[] = sprintf( 'background-color: %s;', $attributes['customOverlayColor'] );
	}

	return sprintf(
		'<span class="%s" style="%s" aria-hidden="true"></span>',
		esc_attr( implode( ' ', $class_names ) ),
		esc_attr( safecss_filter_attr( implode( ' ', $styles ) ) )
	);
}

/**
 * Generates class names and styles to apply the border support styles for
 * the Post Featured Image block.
 *
 * @since 6.1.0
 *
 * @param array $attributes The block attributes.
 * @return array The border-related classnames and styles for the block.
 */
function get_block_core_post_featured_image_border_attributes( $attributes ) {
	$border_styles = array();
	$sides = array( 'top', 'right', 'bottom', 'left' );

	if ( isset( $attributes['style']['border']['radius'] ) ) {
		$border_styles['radius'] = $attributes['style']['border']['radius'];
	}

	if ( isset( $attributes['style']['border']['style'] ) ) {
		$border_styles['style'] = $attributes['style']['border']['style'];
	}

	if ( isset( $attributes['style']['border']['width'] ) ) {
		$border_styles['width'] = $attributes['style']['border']['width'];
	}

	$preset_color = array_key_exists( 'borderColor', $attributes ) ? "var:preset|color|{$attributes['borderColor']}" : null;
	$custom_color = $attributes['style']['border']['color'] ?? null;
	$border_styles['color'] = $preset_color ? $preset_color : $custom_color;

	foreach ( $sides as $side ) {
		$border = $attributes['style']['border'][ $side ] ?? null;
		$border_styles[ $side ] = array(
			'color' => isset( $border['color'] ) ? $border['color'] : null,
			'style' => isset( $border['style'] ) ? $border['style'] : null,
			'width' => isset( $border['width'] ) ? $border['width'] : null,
		);
	}

	$styles = wp_style_engine_get_styles( array( 'border' => $border_styles ) );
	$attributes = array();
	if ( ! empty( $styles['classnames'] ) ) {
		$attributes['class'] = $styles['classnames'];
	}
	if ( ! empty( $styles['css'] ) ) {
		$attributes['style'] = $styles['css'];
	}
	return $attributes;
}

/**
 * Registers the `core/post-featured-image` block on the server.
 *
 * @since 5.8.0
 */
function register_block_core_post_featured_image() {
	register_block_type_from_metadata(
		__DIR__ . '/post-featured-image',
		array(
			'render_callback' => 'render_block_core_post_featured_image',
		)
	);
}
add_action( 'init', 'register_block_core_post_featured_image' );
