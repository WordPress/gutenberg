<?php
/**
 * Add the tax_meta source to the block bindings API.
 *
 * @package gutenberg
 */

if ( function_exists( 'register_block_bindings_source' ) ) {
	$term_meta_source_callback = function ( $source_attrs ) {
		return get_metadata( 'term', $source_attrs['termId'], $source_attrs['value'] );
	};
	register_block_bindings_source(
		'tax_meta',
		array(
			'label' => __( 'Taxonomy Meta', 'gutenberg' ),
			'apply' => $term_meta_source_callback,
		)
	);
}
