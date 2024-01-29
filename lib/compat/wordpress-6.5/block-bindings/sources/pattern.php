<?php
/**
 * Add the metadata source to the block bindings API.
 *
 * @package gutenberg
 */
if ( ! function_exists( 'gutenberg_register_block_bindings_pattern_overrides_source' ) && ! function_exists( 'gutenberg_block_bindings_pattern_overrides_callback' ) ) {
	function gutenberg_block_bindings_pattern_overrides_callback( $source_attrs ) {
		if ( ! isset( $source_attrs['key'] ) ) {
			return null;
		}

		// Use the postId attribute if available
		if ( isset( $source_attrs['postId'] ) ) {
			$post_id = $source_attrs['postId'];
		} else {
			// I tried using $block_instance->context['postId'] but it wasn't available in the image block.
			$post_id = get_the_ID();
		}

		return get_post_meta( $post_id, $source_attrs['key'], true );
	}

	function gutenberg_register_block_bindings_pattern_overrides_source() {
		wp_block_bindings_register_source(
			'core/post-meta',
			array(
				'label' => __( 'Post Meta' ),
				'apply' => 'gutenberg_block_bindings_pattern_overrides_callback',
			)
		);
	}
}

add_action( 'init', 'gutenberg_register_block_bindings_pattern_overrides_source' );
