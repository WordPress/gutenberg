<?php
/**
 * Server-side rendering of the `core/post-content` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-content` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post content of the current post.
 */
function render_block_core_post_content( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	if ( ! in_the_loop() ) {
		the_post();
	}

	$content = get_the_content( null, false, $block->context['postId'] );

	if ( empty( $content ) ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'entry-content' ) );

	if ( is_attachment() ) {
		if ( wp_attachment_is_image( $block->context['postId'] ) ) {
			$content = '<figure class="wp-block-image size-large">' .
			wp_get_attachment_image( $block->context['postId'], 'large' );
			if ( wp_get_attachment_caption( $block->context['postId'] ) ) {
				$content .= '<figcaption>' . wp_get_attachment_caption( $block->context['postId'] ) . '</figcaption>';
			}
			$content .= '</figure>';
			// Retrieve image attachment metadata.
			$metadata = wp_get_attachment_metadata( $block->context['postId'] );
			if ( $metadata ) {
				$content .= sprintf(
					'<div class="wp-block-attachment-details full-size-link"><span class="screen-reader-text">%1$s </span><a href="%2$s">%3$s &times; %4$s</a></div>',
					esc_html_x( 'Full size', 'Used before full size attachment link.' ),
					esc_url( wp_get_attachment_url( $block->context['postId'] ) ),
					absint( $metadata['width'] ),
					absint( $metadata['height'] )
				);
			}
		} else {
			$content = sprintf(
				'<div class="wp-block-attachment-details"><a href="%1$s">%2$s</a></div>',
				esc_url( wp_get_attachment_url( $block->context['postId'] ) ),
				get_the_title( $block->context['postId'] )
			);
		}
	} else {
		$content = apply_filters( 'the_content', str_replace( ']]>', ']]&gt;', get_the_content( null, false, $block->context['postId'] ) ) );
	}

	return (
		'<div ' . $wrapper_attributes . '>' . $content . '</div>'
	);
}

/**
 * Registers the `core/post-content` block on the server.
 */
function register_block_core_post_content() {
	register_block_type_from_metadata(
		__DIR__ . '/post-content',
		array(
			'render_callback' => 'render_block_core_post_content',
		)
	);
}
add_action( 'init', 'register_block_core_post_content' );
