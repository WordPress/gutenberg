<?php
/**
 * Block Inserter Priority support.
 *
 * @package gutenberg
 */

/**
 * Captures inserterPriority from block.json metadata.
 *
 * @param array $settings Block settings.
 * @param array $metadata Block metadata from block.json.
 * @return array Modified settings.
 */
function gutenberg_block_type_metadata_inserter_priority( $settings, $metadata ) {
	if ( isset( $metadata['inserterPriority'] ) ) {
		$settings['inserter_priority'] = (int) $metadata['inserterPriority'];
	}
	return $settings;
}

add_filter( 'block_type_metadata_settings', 'gutenberg_block_type_metadata_inserter_priority', 10, 2 );

/**
 * Sends inserterPriority data to JavaScript.
 */
function gutenberg_enqueue_inserter_priority_data() {
	$registry = WP_Block_Type_Registry::get_instance();
	$data     = array();

	foreach ( $registry->get_all_registered() as $name => $block_type ) {
		if ( isset( $block_type->inserter_priority ) ) {
			$data[ $name ] = array( 'inserterPriority' => $block_type->inserter_priority );
		}
	}

	if ( ! empty( $data ) ) {
		// Inject inserterPriority data into the block editor by merging server-side metadata with client-side block definitions.
		wp_add_inline_script(
			'wp-blocks',
			'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( $data ) . ');',
			'after'
		);
	}
}
add_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_inserter_priority_data' );
