<?php
/**
 * Block hooks.
 *
 * @package gutenberg
 */

/**
 * Register hooked blocks for automatic insertion, based on their block.json metadata.
 *
 * @param array $settings Array of determined settings for registering a block type.
 * @param array $metadata Metadata provided for registering a block type.
 * @return array Updated settings array.
 */
function gutenberg_add_hooked_blocks( $settings, $metadata ) {
	if ( ! isset( $metadata['blockHooks'] ) ) {
		return $settings;
	}
	$block_hooks = $metadata['blockHooks'];

	/**
	 * Map the camelCased position string from block.json to the snake_cased block type position
	 * used in the hooked block registration function.
	 *
	 * @var array
	 */
	$property_mappings = array(
		'before'     => 'before',
		'after'      => 'after',
		'firstChild' => 'first_child',
		'lastChild'  => 'last_child',
	);

	$inserted_block_name = $metadata['name'];
	foreach ( $block_hooks as $anchor_block_name => $position ) {
		// Avoid infinite recursion (hooking to itself).
		if ( $inserted_block_name === $anchor_block_name ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Cannot hook block to itself.', 'gutenberg' ),
				'6.4.0'
			);
			continue;
		}

		if ( ! isset( $property_mappings[ $position ] ) ) {
			continue;
		}

		$mapped_position = $property_mappings[ $position ];

		gutenberg_add_hooked_block( $inserted_block_name, $mapped_position, $anchor_block_name );

		$settings['block_hooks'][ $anchor_block_name ] = $mapped_position;
	}

	// Copied from `get_block_editor_server_block_settings()`.
	$fields_to_pick = array(
		'api_version'      => 'apiVersion',
		'title'            => 'title',
		'description'      => 'description',
		'icon'             => 'icon',
		'attributes'       => 'attributes',
		'provides_context' => 'providesContext',
		'uses_context'     => 'usesContext',
		'selectors'        => 'selectors',
		'supports'         => 'supports',
		'category'         => 'category',
		'styles'           => 'styles',
		'textdomain'       => 'textdomain',
		'parent'           => 'parent',
		'ancestor'         => 'ancestor',
		'keywords'         => 'keywords',
		'example'          => 'example',
		'variations'       => 'variations',
	);
	// Add `block_hooks` to the list of fields to pick.
	$fields_to_pick['block_hooks'] = 'blockHooks';

	$exposed_settings = array_intersect_key( $settings, $fields_to_pick );

	// If the block has a variations callback, call it and add the variations to the block.
	if ( isset( $exposed_settings['variations'] ) && is_callable( $exposed_settings['variations'] ) ) {
		$exposed_settings['variations'] = call_user_func( $exposed_settings['variations'] );
	}

	// TODO: Make work for blocks registered via direct call to gutenberg_add_hooked_block().
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( array( $inserted_block_name => $exposed_settings ) ) . ');'
	);

	return $settings;
}
