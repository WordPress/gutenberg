<?php
/**
 * Add the tax_meta source to the block bindings API.
 *
 * @package gutenberg
 */

if ( function_exists( 'register_block_bindings_source' ) ) {
	$term_meta_source_callback = function ( $source_attrs ) {
		// Use the postId attribute if available, otherwise get it from the context.
		if ( isset( $source_attrs['termId'] ) ) {
			$term_id = $source_attrs['termId'];
		} else {
			// I tried using $block_instance->context['postId'] but it wasn't available in the image block.
			$term_id = get_queried_object_id();
		}

		return get_metadata( 'term', $term_id, $source_attrs['value'] )[0];
	};
	register_block_bindings_source(
		'tax_meta',
		array(
			'label' => __( 'Taxonomy Meta', 'gutenberg' ),
			'apply' => $term_meta_source_callback,
		)
	);
}
