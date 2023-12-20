<?php
/**
 * Add the site_data source to the block bindings API.
 *
 * @package gutenberg
 */

if ( function_exists( 'register_block_bindings_source' ) ) {
	$site_data_source_callback = function ( $source_attrs ) {
		return get_option( $source_attrs['value'] );
	};
	register_block_bindings_source(
		'site_data',
		array(
			'label' => __( 'Site Data' ),
			'apply' => $site_data_source_callback,
		)
	);
}
