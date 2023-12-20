<?php
/**
 * Add the post_meta source to the block bindings API.
 *
 * @package gutenberg
 */

if ( function_exists( 'register_block_bindings_source' ) ) {
	$post_meta_source_callback = function ( $source_attrs, $block_content, $block, $block_instance ) {
		// Use the postId attribute if available, otherwise use the context.
		if ( isset( $source_attrs['postId'] ) ) {
			$post_id = $source_attrs['postId'];
		} else {
			// I tried using $block_instance->context['postId'] but it wasn't available in the image block.
			$post_id = get_the_ID();
		}

		return get_post_meta( $post_id, $source_attrs['value'], true );
	};
	register_block_bindings_source(
		'post_meta',
		array(
			'label' => __( 'Post Meta', 'gutenberg' ),
			'apply' => $post_meta_source_callback,
		)
	);
}
