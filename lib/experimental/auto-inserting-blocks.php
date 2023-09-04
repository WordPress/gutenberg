<?php
/**
 * Auto-inserting blocks.
 *
 * @package gutenberg
 */

/**
 * Return a function that auto-inserts a block next to a given "anchor" block.
 *
 * The auto-inserted block can be inserted before or after the anchor block,
 * or as the first or last child of the anchor block.
 *
 * Note that the returned function mutates the auto-inserted block's designated
 * parent block by inserting into the parent's `innerBlocks` array, and by
 * updating the parent's `innerContent` array accordingly.
 *
 * @param array  $inserted_block    The block to insert.
 * @param string $relative_position The position relative to the given block.
 *                                  Can be 'before', 'after', 'first_child', or 'last_child'.
 * @param string $anchor_block_type The auto-inserted block will be inserted next to instances of this block type.
 * @return callable A function that accepts a block's content and returns the content with the inserted block.
 */
function gutenberg_auto_insert_block( $inserted_block, $relative_position, $anchor_block_type ) {
	return function( $block ) use ( $inserted_block, $relative_position, $anchor_block_type ) {
		if ( $anchor_block_type === $block['blockName'] ) {
			if ( 'first_child' === $relative_position ) {
				array_unshift( $block['innerBlocks'], $inserted_block );
				// Since WP_Block::render() iterates over `inner_content` (rather than `inner_blocks`)
				// when rendering blocks, we also need to prepend a value (`null`, to mark a block
				// location) to that array.
				array_unshift( $block['innerContent'], null );
			} elseif ( 'last_child' === $relative_position ) {
				array_push( $block['innerBlocks'], $inserted_block );
				// Since WP_Block::render() iterates over `inner_content` (rather than `inner_blocks`)
				// when rendering blocks, we also need to prepend a value (`null`, to mark a block
				// location) to that array.
				array_push( $block['innerContent'], null );
			}
			return $block;
		}

		$anchor_block_index = array_search( $anchor_block_type, array_column( $block['innerBlocks'], 'blockName' ), true );
		if ( false !== $anchor_block_index && ( 'after' === $relative_position || 'before' === $relative_position ) ) {
			if ( 'after' === $relative_position ) {
				$anchor_block_index++;
			}
			array_splice( $block['innerBlocks'], $anchor_block_index, 0, array( $inserted_block ) );

			// Find matching `innerContent` chunk index.
			$chunk_index = 0;
			while ( $anchor_block_index > 0 ) {
				if ( ! is_string( $block['innerContent'][ $chunk_index ] ) ) {
					$anchor_block_index--;
				}
				$chunk_index++;
			}
			// Since WP_Block::render() iterates over `inner_content` (rather than `inner_blocks`)
			// when rendering blocks, we also need to insert a value (`null`, to mark a block
			// location) into that array.
			array_splice( $block['innerContent'], $chunk_index, 0, array( null ) );
		}
		return $block;
	};
}

/**
 * Add auto-insertion information to a block type's controller.
 *
 * @param array  $inserted_block_type The type of block to insert.
 * @param string $position            The position relative to the anchor block.
 *                                    Can be 'before', 'after', 'first_child', or 'last_child'.
 * @param string $anchor_block_type   The auto-inserted block will be inserted next to instances of this block type.
 * @return callable A filter for the `rest_prepare_block_type` hook that adds an `auto_insert` field to the network response.
 */
function gutenberg_add_auto_insert_field_to_block_type_controller( $inserted_block_type, $position, $anchor_block_type ) {
	return function( $response, $block_type ) use ( $inserted_block_type, $position, $anchor_block_type ) {
		if ( $block_type->name !== $inserted_block_type ) {
			return $response;
		}

		$data = $response->get_data();
		if ( ! isset( $data['auto_insert'] ) ) {
			$data['auto_insert'] = array();
		}
		$data['auto_insert'][ $anchor_block_type ] = $position;
		$response->set_data( $data );
		return $response;
	};
}

/**
 * Register blocks for auto-insertion, based on their block.json metadata.
 *
 * @param array $settings Array of determined settings for registering a block type.
 * @param array $metadata Metadata provided for registering a block type.
 * @return array Updated settings array.
 */
function gutenberg_register_auto_inserted_blocks( $settings, $metadata ) {
	if ( ! isset( $metadata['__experimentalAutoInsert'] ) ) {
		return $settings;
	}
	$auto_insert = $metadata['__experimentalAutoInsert'];

	/**
	 * Map the camelCased position string from block.json to the snake_cased block type position
	 * used in the auto-inserting block registration function.
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
	foreach ( $auto_insert as $anchor_block_name => $position ) {
		// Avoid infinite recursion (auto-inserting next to or into self).
		if ( $inserted_block_name === $anchor_block_name ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Cannot auto-insert block next to itself.', 'gutenberg' ),
				'6.4.0'
			);
			continue;
		}

		if ( ! isset( $property_mappings[ $position ] ) ) {
			continue;
		}

		$mapped_position = $property_mappings[ $position ];

		gutenberg_register_auto_inserted_block( $inserted_block_name, $mapped_position, $anchor_block_name );

		$settings['auto_insert'][ $anchor_block_name ] = $mapped_position;
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
	// Add `auto_insert` to the list of fields to pick.
	$fields_to_pick['auto_insert'] = 'autoInsert';

	$exposed_settings = array_intersect_key( $settings, $fields_to_pick );

	// TODO: Make work for blocks registered via direct call to gutenberg_register_auto_inserted_block().
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( array( $inserted_block_name => $exposed_settings ) ) . ');'
	);

	return $settings;
}
add_filter( 'block_type_metadata_settings', 'gutenberg_register_auto_inserted_blocks', 10, 2 );

/**
 * Register block for auto-insertion into the frontend and REST API.
 *
 * Register a block for auto-insertion into the frontend and into the markup
 * returned by the templates and patterns REST API endpoints.
 *
 * This is currently done by filtering parsed blocks as obtained from a block template
 * template part, or pattern and injecting the auto-inserted block where applicable.
 *
 * @todo In the long run, we'd likely want some sort of registry for auto-inserted blocks.
 *
 * @param string $inserted_block  The name of the block to insert.
 * @param string $position        The desired position of the auto-inserted block, relative to its anchor block.
 *                                Can be 'before', 'after', 'first_child', or 'last_child'.
 * @param string $anchor_block    The name of the block to insert the auto-inserted block next to.
 * @return void
 */
function gutenberg_register_auto_inserted_block( $inserted_block, $position, $anchor_block ) {
		$inserted_block_array = array(
			'blockName'    => $inserted_block,
			'attrs'        => array(),
			'innerHTML'    => '',
			'innerContent' => array(),
			'innerBlocks'  => array(),
		);

		$inserter = gutenberg_auto_insert_block( $inserted_block_array, $position, $anchor_block );
		add_filter( 'gutenberg_serialize_block', $inserter, 10, 1 );

		/*
		 * The block-types REST API controller uses objects of the `WP_Block_Type` class, which are
		 * in turn created upon block type registration. However, that class does not contain
		 * an `auto_insert` property (and is not easily extensible), so we have to use a different
		 * mechanism to communicate to the controller which blocks have been registered for
		 * auto-insertion. We're doing so here (i.e. upon block registration), by adding a filter to
		 * the controller's response.
		 */
		$controller_extender = gutenberg_add_auto_insert_field_to_block_type_controller( $inserted_block, $position, $anchor_block );
		add_filter( 'rest_prepare_block_type', $controller_extender, 10, 2 );
}

/**
 * Parse and reserialize block templates to allow running filters.
 *
 * By parsing a block template's content and then reserializing it
 * via `gutenberg_serialize_blocks()`, we are able to run filters
 * on the parsed blocks. This allows us to modify (parsed) blocks during
 * depth-first traversal already provided by the serialization process,
 * rather than having to do so in a separate pass.
 *
 * @param WP_Block_Template[] $query_result Array of found block templates.
 * @return WP_Block_Template[] Updated array of found block templates.
 */
function gutenberg_parse_and_serialize_block_templates( $query_result ) {
	foreach ( $query_result as $block_template ) {
		if ( 'custom' === $block_template->source ) {
			continue;
		}
		$blocks                  = parse_blocks( $block_template->content );
		$block_template->content = gutenberg_serialize_blocks( $blocks );
	}

	return $query_result;
}
add_filter( 'get_block_templates', 'gutenberg_parse_and_serialize_block_templates', 10, 1 );

/**
 * Filters the block template object after it has been (potentially) fetched from the theme file.
 *
 * By parsing a block template's content and then reserializing it
 * via `gutenberg_serialize_blocks()`, we are able to run filters
 * on the parsed blocks. This allows us to modify (parsed) blocks during
 * depth-first traversal already provided by the serialization process,
 * rather than having to do so in a separate pass.
 *
 * @param WP_Block_Template|null $block_template The found block template, or null if there is none.
 */
function gutenberg_parse_and_serialize_blocks( $block_template ) {

	$blocks                  = parse_blocks( $block_template->content );
	$block_template->content = gutenberg_serialize_blocks( $blocks );

	return $block_template;
}
add_filter( 'get_block_file_template', 'gutenberg_parse_and_serialize_blocks', 10, 1 );

// Helper functions.
// -----------------
// The sole purpose of the following two functions (`gutenberg_serialize_block`
// and `gutenberg_serialize_blocks`), which are otherwise copies of their unprefixed
// counterparts (`serialize_block` and `serialize_blocks`) is to apply a filter
// (also called `gutenberg_serialize_block`) as an entry point for modifications
// to the parsed blocks.

/**
 * Filterable version of `serialize_block()`.
 *
 * This function is identical to `serialize_block()`, except that it applies
 * the `gutenberg_serialize_block` filter to each block before it is serialized.
 *
 * @param array $block The block to be serialized.
 * @return string The serialized block.
 *
 * @see serialize_block()
 */
function gutenberg_serialize_block( $block ) {
	$block_content = '';

	/**
	 * Filters a parsed block before it is serialized.
	 *
	 * @param array $block The block to be serialized.
	 */
	$block = apply_filters( 'gutenberg_serialize_block', $block );

	$index = 0;
	foreach ( $block['innerContent'] as $chunk ) {
		if ( is_string( $chunk ) ) {
			$block_content .= $chunk;
		} else { // Compare to WP_Block::render().
			$inner_block    = $block['innerBlocks'][ $index++ ];
			$block_content .= gutenberg_serialize_block( $inner_block );
		}
	}

	if ( ! is_array( $block['attrs'] ) ) {
		$block['attrs'] = array();
	}

	return get_comment_delimited_block_content(
		$block['blockName'],
		$block['attrs'],
		$block_content
	);
}

/**
 * Filterable version of `serialize_blocks()`.
 *
 * This function is identical to `serialize_blocks()`, except that it applies
 * the `gutenberg_serialize_block` filter to each block before it is serialized.
 *
 * @param array $blocks The blocks to be serialized.
 * @return string[] The serialized blocks.
 *
 * @see serialize_blocks()
 */
function gutenberg_serialize_blocks( $blocks ) {
	return implode( '', array_map( 'gutenberg_serialize_block', $blocks ) );
}

/**
 * Register the `auto_insert` field for the block-types REST API controller.
 *
 * @return void
 */
function gutenberg_register_auto_insert_rest_field() {
	register_rest_field(
		'block-type',
		'auto_insert',
		array(
			'schema' => array(
				'description'       => __( 'Block types that may be automatically inserted near this block and the associated relative position where they are inserted.', 'gutenberg' ),
				'patternProperties' => array(
					'^[a-zA-Z0-9-]+/[a-zA-Z0-9-]+$' => array(
						'type' => 'string',
						'enum' => array( 'before', 'after', 'first_child', 'last_child' ),
					),
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_auto_insert_rest_field' );
