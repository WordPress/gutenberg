<?php
/**
 * Server-side rendering of the `core/image` block.
 *
 * @package gutenberg
 */

/**
 * Adds a data-id attribute to the core Image block when nested in a Gallery block.
 *
 * @param  WP_Post $post The WP post.
 * @return string        Returns the post content with the data-id attribute added to gallery images.
 */
function get_block_core_image_post_content( $post ) {
	if ( is_admin() ) {
		return;
	}
	if ( has_blocks( $post->post_content ) ) {
		$content = $post->post_content;
		$blocks  = parse_blocks( $content );
		foreach ( $blocks as $block ) {
			if ( 'core/gallery' === $block['blockName'] && ! empty( $block['innerBlocks'] ) ) {
				foreach ( $block['innerBlocks'] as $inner_block ) {
					if ( 'core/image' === $inner_block['blockName'] ) {
						if ( isset( $inner_block['attrs']['id'] ) ) {
							$image_id          = esc_attr( $inner_block['attrs']['id'] );
							$data_id_attribute = 'data-id="' . $image_id . '"';
							$class_string      = 'class="wp-image-' . $image_id . '"';
							$content           = str_replace( $class_string, $data_id_attribute . ' ' . $class_string, $content );
						}
					}
				}
			}
		}
	}
	$post->post_content = $content;
}

add_action( 'the_post', 'get_block_core_image_post_content', 10, 1 );
