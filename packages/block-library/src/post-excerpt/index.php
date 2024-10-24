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

	/**
	 * Some themes might use `excerpt_more` filter to handle the
	 * `more` link displayed after a trimmed excerpt. Since the
	 * block has a `more text` attribute we have to check and
	 * override if needed the return value from this filter.
	 * So if the block's attribute is not empty override the
	 * `excerpt_more` filter and return nothing. This will
	 * result in showing only one `read more` link at a time.
	 */
	$more_text           = ! empty( $attributes['moreText'] ) ? '<a class="wp-block-post-excerpt__more-link" href="' . esc_url( get_the_permalink( $block->context['postId'] ) ) . '">' . wp_kses_post( $attributes['moreText'] ) . '</a>' : '';
	$filter_excerpt_more = static function ( $more ) use ( $more_text ) {
		// If the block has user input more text, return nothing as this is appended later.
		$has_block_more_text = ! empty( $more_text );
		if ( $has_block_more_text ) {
			return '';
		}
		// If the default core more text is in use, replace it with the new block editor-y more text.
		$default_more = ' ' . '[&hellip;]';
		if ( $more === $default_more ) {
			return '&hellip;';
		}
		// Otherwise, return the custom filtered more text.
		return $more;
	};

	// Hook into the excerpt_length filter to apply the `excerptLength` attribute.
	// The `excerptLength` attribute has a default value of 55, so will always be set,
	// so there's no need to fallback to the filtered excerpt_length value.
	$excerpt_length        = $attributes['excerptLength'];
	$filter_excerpt_length = static function () use ( $excerpt_length ) {
		return $excerpt_length;
	};

	add_filter( 'excerpt_more', $filter_excerpt_more );
	add_filter(
		'excerpt_length',
		$filter_excerpt_length
	);

	$excerpt = get_the_excerpt( $block->context['postId'] );

	remove_filter( 'excerpt_more', $filter_excerpt_more );
	remove_filter( 'excerpt_length', $filter_excerpt_length );

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
