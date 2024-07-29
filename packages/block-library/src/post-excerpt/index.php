<?php
/**
 * Server-side rendering of the `core/post-excerpt` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-excerpt` block on the server.
 *
 * @since 5.8.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post excerpt for the current post wrapped inside "p" tags.
 */
function render_block_core_post_excerpt( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	// Generate a border string based on border attributes.
	$border_attributes = isset( $attributes['style']['border'] ) ? $attributes['style']['border'] : null;
	if ( isset( $border_attributes ) && ! empty( $border_attributes ) ) {
		$border_array = array();
		foreach ( $border_attributes as $border_attributes_key => $border_attributes_value ) {

			$border_array[] = 'border-' . $border_attributes_key . ': ' . $border_attributes_value;
		}
	}
	if ( isset( $attributes['borderColor'] ) && ! empty( $attributes['borderColor'] ) ) {
		$border_array[] = 'border-color: ' . $attributes['borderColor'];
	}
	if ( isset( $border_array ) && ! empty( $border_array ) ) {
		$border_string = implode( ';', $border_array );
	}
	$border_classes = block_core_post_excerpt_get_border_color_classes( $attributes );

	// Generate a readmoreColors string based on readmoreColors attributes.
	$read_more_colors = isset( $attributes['readMoreColors'] ) ? $attributes['readMoreColors'] : null;

	// Generate a style string based on readmoreColors and border_string.
	$style_string  = '';
	$padding_class = '';

	if ( isset( $read_more_colors ) ) {
		$bg_color   = isset( $read_more_colors['bgColor'] ) ? $read_more_colors['bgColor'] : '';
		$text_color = isset( $read_more_colors['textColor'] ) ? $read_more_colors['textColor'] : '';

		// Construct the CSS for background and text colors.
		if ( $bg_color || $text_color ) {
			$style_string .= '';
			if ( $bg_color ) {
				$style_string .= 'background-color:' . esc_attr( $bg_color ) . ';';
			}
			if ( $text_color ) {
				$style_string .= 'color:' . esc_attr( $text_color ) . ';';
			}
		}
	}

	// Add the $border_string to the style string if it exists.
	if ( isset( $border_string ) && ! empty( $border_string ) ) {
		$style_string .= esc_attr( $border_string );
		if ( strpos( $border_string, 'border-width: 0px;' ) === false ) {
			$padding_class = 'wp-block-post-excerpt__more-link--padding';
		}
	}

	/*
	* The purpose of the excerpt length setting is to limit the length of both
	* automatically generated and user-created excerpts.
	* Because the excerpt_length filter only applies to auto generated excerpts,
	* wp_trim_words is used instead.
	*/
	$excerpt_length = $attributes['excerptLength'];
	$excerpt        = get_the_excerpt( $block->context['postId'] );
	if ( isset( $excerpt_length ) ) {
		$excerpt = wp_trim_words( $excerpt, $excerpt_length );
	}

	$more_text           = ! empty( $attributes['moreText'] ) ? '<a class="wp-block-post-excerpt__more-link ' . esc_attr( $border_classes ) . ' ' . esc_attr( $padding_class ) . '" style="' . esc_attr( $style_string ) . '" href="' . esc_url( get_the_permalink( $block->context['postId'] ) ) . '" >' . wp_kses_post( $attributes['moreText'] ) . '</a>' : '';
	$filter_excerpt_more = static function ( $more ) use ( $more_text ) {
		return empty( $more_text ) ? $more : '';
	};
	/**
	 * Some themes might use `excerpt_more` filter to handle the
	 * `more` link displayed after a trimmed excerpt. Since the
	 * block has a `more text` attribute we have to check and
	 * override if needed the return value from this filter.
	 * So if the block's attribute is not empty override the
	 * `excerpt_more` filter and return nothing. This will
	 * result in showing only one `read more` link at a time.
	 */
	add_filter( 'excerpt_more', $filter_excerpt_more );
	$classes = array();
	if ( isset( $attributes['textAlign'] ) ) {
		$classes[] = 'has-text-align-' . $attributes['textAlign'];
	}
	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classes[] = 'has-link-color';
	}
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classes ) ) );

	$content               = '<p class="wp-block-post-excerpt__excerpt">' . $excerpt;
	$show_more_on_new_line = ! isset( $attributes['showMoreOnNewLine'] ) || $attributes['showMoreOnNewLine'];
	if ( $show_more_on_new_line && ! empty( $more_text ) ) {
		$content .= '</p><p class="wp-block-post-excerpt__more-text">' . $more_text . '</p>';
	} else {
		$content .= " $more_text</p>";
	}
	remove_filter( 'excerpt_more', $filter_excerpt_more );
	return sprintf( '<div %1$s>%2$s</div>', $wrapper_attributes, $content );
}

/**
 * Registers the `core/post-excerpt` block on the server.
 *
 * @since 5.8.0
 */
function register_block_core_post_excerpt() {
	register_block_type_from_metadata(
		__DIR__ . '/post-excerpt',
		array(
			'render_callback' => 'render_block_core_post_excerpt',
		)
	);
}
add_action( 'init', 'register_block_core_post_excerpt' );

/**
 * If themes or plugins filter the excerpt_length, we need to
 * override the filter in the editor, otherwise
 * the excerpt length block setting has no effect.
 * Returns 100 because 100 is the max length in the setting.
 */
if ( is_admin() ||
	defined( 'REST_REQUEST' ) && REST_REQUEST ) {
	add_filter(
		'excerpt_length',
		static function () {
			return 100;
		},
		PHP_INT_MAX
	);
}

/**
 * Returns border color classnames depending on whether there are named or custom border colors.
 *
 * @param array $attributes The block attributes.
 *
 * @return string The border color classnames to be applied to the block elements.
 */
function block_core_post_excerpt_get_border_color_classes( $attributes ) {
	$border_color_classes    = array();
	$has_custom_border_color = ! empty( $attributes['style']['border']['color'] );
	$has_named_border_color  = ! empty( $attributes['borderColor'] );

	if ( $has_custom_border_color || $has_named_border_color ) {
		$border_color_classes[] = 'has-border-color';
	}

	if ( $has_named_border_color ) {
		$border_color_classes[] = sprintf( 'has-%s-border-color', esc_attr( $attributes['borderColor'] ) );
	}

	return implode( ' ', $border_color_classes );
}
