<?php
/**
 * Add the metadata source to the block bindings API.
 *
 * @package gutenberg
 */

if ( function_exists( 'register_block_bindings_source' ) ) {
	$metadata_source_callback = function ( $source_attrs, $block_content, $block, $block_instance ) {
		// Use the postId attribute if available, otherwise use the context.
		if ( isset( $source_attrs['postId'] ) ) {
			$post_id = $source_attrs['postId'];
		} else {
			// I tried using $block_instance->context['postId'] but it wasn't available in the image block.
			$post_id = get_the_ID();
		}

		// TODO: Add logic to handle other meta types.
		if ( isset( $source_attrs['metaType'] ) ) {
			$meta_type = $source_attrs['metaType'];
		} else {
			$meta_type = 'post';
		}

		// TODO: Add a filter/mechanism to limit the meta keys that can be used.
		return get_metadata( $meta_type, $post_id, $source_attrs['value'], true );
	};
	register_block_bindings_source( 'metadata', $metadata_source_callback );
}
