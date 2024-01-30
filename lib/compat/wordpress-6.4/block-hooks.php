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
		'allowed_blocks'   => 'allowedBlocks',
	);
	// Add `block_hooks` to the list of fields to pick.
	$fields_to_pick['block_hooks'] = 'blockHooks';

	$exposed_settings = array_intersect_key( $settings, $fields_to_pick );

	// TODO: Make work for blocks registered via direct call to gutenberg_add_hooked_block().
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( array( $inserted_block_name => $exposed_settings ) ) . ');'
	);

	return $settings;
}

/**
 * Register a hooked block for automatic insertion into a given block hook.
 *
 * A block hook is specified by a block type and a relative position. The hooked block
 * will be automatically inserted in the given position next to the "anchor" block
 * whenever the latter is encountered. This applies both to the frontend and to the markup
 * returned by the templates and patterns REST API endpoints.
 *
 * This is currently done by filtering parsed blocks as obtained from a block template,
 * template part, or pattern, and injecting the hooked block where applicable.
 *
 * @todo In the long run, we'd likely want some sort of registry for hooked blocks.
 *
 * @param string $hooked_block  The name of the block to insert.
 * @param string $position      The desired position of the hooked block, relative to its anchor block.
 *                              Can be 'before', 'after', 'first_child', or 'last_child'.
 * @param string $anchor_block  The name of the block to insert the hooked block next to.
 * @return void
 */
function gutenberg_add_hooked_block( $hooked_block, $position, $anchor_block ) {
		$hooked_block_array = array(
			'blockName'    => $hooked_block,
			'attrs'        => array(),
			'innerHTML'    => '',
			'innerContent' => array(),
			'innerBlocks'  => array(),
		);

		$inserter = gutenberg_insert_hooked_block( $hooked_block_array, $position, $anchor_block );
		add_filter( 'gutenberg_serialize_block', $inserter, 10, 1 );

		/*
		 * The block-types REST API controller uses objects of the `WP_Block_Type` class, which are
		 * in turn created upon block type registration. However, that class does not contain
		 * a `block_hooks` property (and is not easily extensible), so we have to use a different
		 * mechanism to communicate to the controller which hooked blocks have been registered for
		 * automatic insertion. We're doing so here (i.e. upon block registration), by adding a filter to
		 * the controller's response.
		 */
		$controller_extender = gutenberg_add_block_hooks_field_to_block_type_controller( $hooked_block, $position, $anchor_block );
		add_filter( 'rest_prepare_block_type', $controller_extender, 10, 2 );
}

/**
 * Return a function that auto-inserts a block next to a given "anchor" block.
 *
 * This is a helper function used in the implementation of block hooks.
 * It is not meant for public use.
 *
 * The auto-inserted block can be inserted before or after the anchor block,
 * or as the first or last child of the anchor block.
 *
 * Note that the returned function mutates the automatically inserted block's
 * designated parent block by inserting into the parent's `innerBlocks` array,
 * and by updating the parent's `innerContent` array accordingly.
 *
 * @param array  $inserted_block    The block to insert.
 * @param string $relative_position The position relative to the given block.
 *                                  Can be 'before', 'after', 'first_child', or 'last_child'.
 * @param string $anchor_block_type The automatically inserted block will be inserted next to instances of this block type.
 * @return callable A function that accepts a block's content and returns the content with the inserted block.
 */
function gutenberg_insert_hooked_block( $inserted_block, $relative_position, $anchor_block_type ) {
	return function ( $block ) use ( $inserted_block, $relative_position, $anchor_block_type ) {
		if ( $anchor_block_type === $block['blockName'] ) {
			if ( 'first_child' === $relative_position ) {
				array_unshift( $block['innerBlocks'], $inserted_block );
				// Since WP_Block::render() iterates over `inner_content` (rather than `inner_blocks`)
				// when rendering blocks, we also need to prepend a value (`null`, to mark a block
				// location) to that array after HTML content for the inner blocks wrapper.
				$chunk_index = 0;
				for ( $index = $chunk_index; $index < count( $block['innerContent'] ); $index++ ) {
					if ( is_null( $block['innerContent'][ $index ] ) ) {
						$chunk_index = $index;
						break;
					}
				}
				array_splice( $block['innerContent'], $chunk_index, 0, array( null ) );
			} elseif ( 'last_child' === $relative_position ) {
				array_push( $block['innerBlocks'], $inserted_block );
				// Since WP_Block::render() iterates over `inner_content` (rather than `inner_blocks`)
				// when rendering blocks, we also need to correctly append a value (`null`, to mark a block
				// location) to that array before the remaining HTML content for the inner blocks wrapper.
				$chunk_index = count( $block['innerContent'] );
				for ( $index = count( $block['innerContent'] ); $index > 0; $index-- ) {
					if ( is_null( $block['innerContent'][ $index - 1 ] ) ) {
						$chunk_index = $index;
						break;
					}
				}
				array_splice( $block['innerContent'], $chunk_index, 0, array( null ) );
			}
			return $block;
		}

		$anchor_block_index = array_search( $anchor_block_type, array_column( $block['innerBlocks'], 'blockName' ), true );
		if ( false !== $anchor_block_index && ( 'after' === $relative_position || 'before' === $relative_position ) ) {
			if ( 'after' === $relative_position ) {
				++$anchor_block_index;
			}
			array_splice( $block['innerBlocks'], $anchor_block_index, 0, array( $inserted_block ) );

			// Find matching `innerContent` chunk index.
			$chunk_index = 0;
			while ( $anchor_block_index > 0 ) {
				if ( ! is_string( $block['innerContent'][ $chunk_index ] ) ) {
					--$anchor_block_index;
				}
				++$chunk_index;
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
 * Add block hooks information to a block type's controller.
 *
 * @param array  $inserted_block_type The type of block to insert.
 * @param string $position            The position relative to the anchor block.
 *                                    Can be 'before', 'after', 'first_child', or 'last_child'.
 * @param string $anchor_block_type   The hooked block will be inserted next to instances of this block type.
 * @return callable A filter for the `rest_prepare_block_type` hook that adds a `block_hooks` field to the network response.
 */
function gutenberg_add_block_hooks_field_to_block_type_controller( $inserted_block_type, $position, $anchor_block_type ) {
	return function ( $response, $block_type ) use ( $inserted_block_type, $position, $anchor_block_type ) {
		if ( $block_type->name !== $inserted_block_type ) {
			return $response;
		}

		$data = $response->get_data();
		if ( ! isset( $data['block_hooks'] ) ) {
			$data['block_hooks'] = array();
		}
		$data['block_hooks'][ $anchor_block_type ] = $position;
		$response->set_data( $data );
		return $response;
	};
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
	foreach ( $query_result as $index => $block_template ) {
		if ( 'custom' === $block_template->source ) {
			continue;
		}
		$query_result[ $index ] = gutenberg_parse_and_serialize_blocks( $block_template );
	}

	return $query_result;
}

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
	if ( empty( $block_template->content ) ) {
		return $block_template;
	}

	$before_block_visitor = null; // Prior to WP 6.4, the `theme` attribute was injected in Core's _build_block_template_result_from_file.
	$after_block_visitor  = null;
	$hooked_blocks        = get_hooked_blocks();

	if ( ! empty( $hooked_blocks ) || has_filter( 'hooked_block_types' ) ) {
		$before_block_visitor = make_before_block_visitor( $hooked_blocks, $block_template );
		$after_block_visitor  = make_after_block_visitor( $hooked_blocks, $block_template );
	}
	$blocks                  = parse_blocks( $block_template->content );
	$block_template->content = traverse_and_serialize_blocks( $blocks, $before_block_visitor, $after_block_visitor );

	return $block_template;
}

/**
 * Register the `block_hooks` field for the block-types REST API controller.
 *
 * @return void
 */
function gutenberg_register_block_hooks_rest_field() {
	register_rest_field(
		'block-type',
		'block_hooks',
		array(
			'schema' => array(
				'description'       => __( 'This block is automatically inserted near any occurence of the block types used as keys of this map, into a relative position given by the corresponding value.', 'gutenberg' ),
				'type'              => 'object',
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

// Install the polyfill for Block Hooks only if it isn't already handled in WordPress core.
if ( version_compare( get_bloginfo( 'version' ), '6.4', '<' ) ) {
	add_filter( 'block_type_metadata_settings', 'gutenberg_add_hooked_blocks', 10, 2 );
	add_filter( 'get_block_templates', 'gutenberg_parse_and_serialize_block_templates', 10, 1 );
	add_filter( 'get_block_file_template', 'gutenberg_parse_and_serialize_blocks', 10, 1 );
	add_action( 'rest_api_init', 'gutenberg_register_block_hooks_rest_field' );
}

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

if ( ! function_exists( 'get_hooked_blocks' ) ) {
	/**
	 * Retrieves block types hooked into the given block, grouped by anchor block type and the relative position.
	 *
	 * @since 6.4.0
	 *
	 * @return array[] Array of block types grouped by anchor block type and the relative position.
	 */
	function get_hooked_blocks() {
		$block_types   = WP_Block_Type_Registry::get_instance()->get_all_registered();
		$hooked_blocks = array();
		foreach ( $block_types as $block_type ) {
			if ( ! ( $block_type instanceof WP_Block_Type ) || ! is_array( $block_type->block_hooks ) ) {
				continue;
			}
			foreach ( $block_type->block_hooks as $anchor_block_type => $relative_position ) {
				if ( ! isset( $hooked_blocks[ $anchor_block_type ] ) ) {
					$hooked_blocks[ $anchor_block_type ] = array();
				}
				if ( ! isset( $hooked_blocks[ $anchor_block_type ][ $relative_position ] ) ) {
					$hooked_blocks[ $anchor_block_type ][ $relative_position ] = array();
				}
				$hooked_blocks[ $anchor_block_type ][ $relative_position ][] = $block_type->name;
			}
		}

		return $hooked_blocks;
	}
}

if ( ! function_exists( 'make_before_block_visitor' ) ) {
	/**
	 * Returns a function that injects hooked blocks before a given block.
	 *
	 * The returned function can be used as `$pre_callback` argument to `traverse_and_serialize_block(s)`,
	 * where it will inject the `theme` attribute into all Template Part blocks, and prepend the markup for
	 * any blocks hooked `before` the given block and as its parent's `first_child`, respectively.
	 *
	 * This function is meant for internal use only.
	 *
	 * @since 6.4.0
	 * @access private
	 *
	 * @param array                   $hooked_blocks An array of blocks hooked to another given block.
	 * @param WP_Block_Template|array $context       A block template, template part, or pattern that the blocks belong to.
	 * @return callable A function that returns the serialized markup for the given block,
	 *                  including the markup for any hooked blocks before it.
	 */
	function make_before_block_visitor( $hooked_blocks, $context ) {
		/**
		 * Injects hooked blocks before the given block, injects the `theme` attribute into Template Part blocks, and returns the serialized markup.
		 *
		 * If the current block is a Template Part block, inject the `theme` attribute.
		 * Furthermore, prepend the markup for any blocks hooked `before` the given block and as its parent's
		 * `first_child`, respectively, to the serialized markup for the given block.
		 *
		 * @param array $block        The block to inject the theme attribute into, and hooked blocks before. Passed by reference.
		 * @param array $parent_block The parent block of the given block. Passed by reference. Default null.
		 * @param array $prev         The previous sibling block of the given block. Default null.
		 * @return string The serialized markup for the given block, with the markup for any hooked blocks prepended to it.
		 */
		return function ( &$block, &$parent_block = null, $prev = null ) use ( $hooked_blocks, $context ) {
			// No `theme` injection into Template Part blocks: Prior to WP 6.4, this was done by Core's _build_block_template_result_from_file.

			$markup = '';

			if ( $parent_block && ! $prev ) {
				// Candidate for first-child insertion.
				$relative_position  = 'first_child';
				$anchor_block_type  = $parent_block['blockName'];
				$hooked_block_types = isset( $hooked_blocks[ $anchor_block_type ][ $relative_position ] )
					? $hooked_blocks[ $anchor_block_type ][ $relative_position ]
					: array();

				/**
				 * Filters the list of hooked block types for a given anchor block type and relative position.
				 *
				 * @since 6.4.0
				 *
				 * @param string[]                $hooked_block_types  The list of hooked block types.
				 * @param string                  $relative_position   The relative position of the hooked blocks.
				 *                                                     Can be one of 'before', 'after', 'first_child', or 'last_child'.
				 * @param string                  $anchor_block_type   The anchor block type.
				 * @param WP_Block_Template|array $context             The block template, template part, or pattern that the anchor block belongs to.
				 */
				$hooked_block_types = apply_filters( 'hooked_block_types', $hooked_block_types, $relative_position, $anchor_block_type, $context );
				foreach ( $hooked_block_types as $hooked_block_type ) {
					$markup .= get_comment_delimited_block_content( $hooked_block_type, array(), '' );
				}
			}

			$relative_position  = 'before';
			$anchor_block_type  = $block['blockName'];
			$hooked_block_types = isset( $hooked_blocks[ $anchor_block_type ][ $relative_position ] )
				? $hooked_blocks[ $anchor_block_type ][ $relative_position ]
				: array();

			/** This filter is documented in wp-includes/blocks.php */
			$hooked_block_types = apply_filters( 'hooked_block_types', $hooked_block_types, $relative_position, $anchor_block_type, $context );
			foreach ( $hooked_block_types as $hooked_block_type ) {
				$markup .= get_comment_delimited_block_content( $hooked_block_type, array(), '' );
			}

			return $markup;
		};
	}
}

if ( ! function_exists( 'make_after_block_visitor' ) ) {
	/**
	 * Returns a function that injects the hooked blocks after a given block.
	 *
	 * The returned function can be used as `$post_callback` argument to `traverse_and_serialize_block(s)`,
	 * where it will append the markup for any blocks hooked `after` the given block and as its parent's
	 * `last_child`, respectively.
	 *
	 * This function is meant for internal use only.
	 *
	 * @since 6.4.0
	 * @access private
	 *
	 * @param array                   $hooked_blocks An array of blocks hooked to another block.
	 * @param WP_Block_Template|array $context       A block template, template part, or pattern that the blocks belong to.
	 * @return callable A function that returns the serialized markup for the given block,
	 *                  including the markup for any hooked blocks after it.
	 */
	function make_after_block_visitor( $hooked_blocks, $context ) {
		/**
		 * Injects hooked blocks after the given block, and returns the serialized markup.
		 *
		 * Append the markup for any blocks hooked `after` the given block and as its parent's
		 * `last_child`, respectively, to the serialized markup for the given block.
		 *
		 * @param array $block        The block to inject the hooked blocks after. Passed by reference.
		 * @param array $parent_block The parent block of the given block. Passed by reference. Default null.
		 * @param array $next         The next sibling block of the given block. Default null.
		 * @return string The serialized markup for the given block, with the markup for any hooked blocks appended to it.
		 */
		return function ( &$block, &$parent_block = null, $next = null ) use ( $hooked_blocks, $context ) {
			$markup = '';

			$relative_position  = 'after';
			$anchor_block_type  = $block['blockName'];
			$hooked_block_types = isset( $hooked_blocks[ $anchor_block_type ][ $relative_position ] )
					? $hooked_blocks[ $anchor_block_type ][ $relative_position ]
					: array();

			/** This filter is documented in wp-includes/blocks.php */
			$hooked_block_types = apply_filters( 'hooked_block_types', $hooked_block_types, $relative_position, $anchor_block_type, $context );
			foreach ( $hooked_block_types as $hooked_block_type ) {
				$markup .= get_comment_delimited_block_content( $hooked_block_type, array(), '' );
			}

			if ( $parent_block && ! $next ) {
				// Candidate for last-child insertion.
				$relative_position  = 'last_child';
				$anchor_block_type  = $parent_block['blockName'];
				$hooked_block_types = isset( $hooked_blocks[ $anchor_block_type ][ $relative_position ] )
					? $hooked_blocks[ $anchor_block_type ][ $relative_position ]
					: array();

				/** This filter is documented in wp-includes/blocks.php */
				$hooked_block_types = apply_filters( 'hooked_block_types', $hooked_block_types, $relative_position, $anchor_block_type, $context );
				foreach ( $hooked_block_types as $hooked_block_type ) {
					$markup .= get_comment_delimited_block_content( $hooked_block_type, array(), '' );
				}
			}

			return $markup;
		};
	}
}

if ( ! function_exists( 'traverse_and_serialize_block' ) ) {
	/**
	 * Traverses a parsed block tree and applies callbacks before and after serializing it.
	 *
	 * Recursively traverses the block and its inner blocks and applies the two callbacks provided as
	 * arguments, the first one before serializing the block, and the second one after serializing it.
	 * If either callback returns a string value, it will be prepended and appended to the serialized
	 * block markup, respectively.
	 *
	 * The callbacks will receive a reference to the current block as their first argument, so that they
	 * can also modify it, and the current block's parent block as second argument. Finally, the
	 * `$pre_callback` receives the previous block, whereas the `$post_callback` receives
	 * the next block as third argument.
	 *
	 * Serialized blocks are returned including comment delimiters, and with all attributes serialized.
	 *
	 * This function should be used when there is a need to modify the saved block, or to inject markup
	 * into the return value. Prefer `serialize_block` when preparing a block to be saved to post content.
	 *
	 * This function is meant for internal use only.
	 *
	 * @since 6.4.0
	 * @access private
	 *
	 * @see serialize_block()
	 *
	 * @param array    $block         A representative array of a single parsed block object. See WP_Block_Parser_Block.
	 * @param callable $pre_callback  Callback to run on each block in the tree before it is traversed and serialized.
	 *                                It is called with the following arguments: &$block, $parent_block, $previous_block.
	 *                                Its string return value will be prepended to the serialized block markup.
	 * @param callable $post_callback Callback to run on each block in the tree after it is traversed and serialized.
	 *                                It is called with the following arguments: &$block, $parent_block, $next_block.
	 *                                Its string return value will be appended to the serialized block markup.
	 * @return string Serialized block markup.
	 */
	function traverse_and_serialize_block( $block, $pre_callback = null, $post_callback = null ) {
		$block_content = '';
		$block_index   = 0;

		foreach ( $block['innerContent'] as $chunk ) {
			if ( is_string( $chunk ) ) {
				$block_content .= $chunk;
			} else {
				$inner_block = $block['innerBlocks'][ $block_index ];

				if ( is_callable( $pre_callback ) ) {
					$prev = 0 === $block_index
						? null
						: $block['innerBlocks'][ $block_index - 1 ];

					$block_content .= call_user_func_array(
						$pre_callback,
						array( &$inner_block, &$block, $prev )
					);
				}

				if ( is_callable( $post_callback ) ) {
					$next = count( $block['innerBlocks'] ) - 1 === $block_index
						? null
						: $block['innerBlocks'][ $block_index + 1 ];

					$post_markup = call_user_func_array(
						$post_callback,
						array( &$inner_block, &$block, $next )
					);
				}

				$block_content .= traverse_and_serialize_block( $inner_block, $pre_callback, $post_callback );
				$block_content .= isset( $post_markup ) ? $post_markup : '';

				++$block_index;
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
}

if ( ! function_exists( 'traverse_and_serialize_blocks' ) ) {
	/**
	 * Given an array of parsed block trees, applies callbacks before and after serializing them and
	 * returns their concatenated output.
	 *
	 * Recursively traverses the blocks and their inner blocks and applies the two callbacks provided as
	 * arguments, the first one before serializing a block, and the second one after serializing.
	 * If either callback returns a string value, it will be prepended and appended to the serialized
	 * block markup, respectively.
	 *
	 * The callbacks will receive a reference to the current block as their first argument, so that they
	 * can also modify it, and the current block's parent block as second argument. Finally, the
	 * `$pre_callback` receives the previous block, whereas the `$post_callback` receives
	 * the next block as third argument.
	 *
	 * Serialized blocks are returned including comment delimiters, and with all attributes serialized.
	 *
	 * This function should be used when there is a need to modify the saved blocks, or to inject markup
	 * into the return value. Prefer `serialize_blocks` when preparing blocks to be saved to post content.
	 *
	 * This function is meant for internal use only.
	 *
	 * @since 6.4.0
	 * @access private
	 *
	 * @see serialize_blocks()
	 *
	 * @param array[]  $blocks        An array of parsed blocks. See WP_Block_Parser_Block.
	 * @param callable $pre_callback  Callback to run on each block in the tree before it is traversed and serialized.
	 *                                It is called with the following arguments: &$block, $parent_block, $previous_block.
	 *                                Its string return value will be prepended to the serialized block markup.
	 * @param callable $post_callback Callback to run on each block in the tree after it is traversed and serialized.
	 *                                It is called with the following arguments: &$block, $parent_block, $next_block.
	 *                                Its string return value will be appended to the serialized block markup.
	 * @return string Serialized block markup.
	 */
	function traverse_and_serialize_blocks( $blocks, $pre_callback = null, $post_callback = null ) {
		$result       = '';
		$parent_block = null; // At the top level, there is no parent block to pass to the callbacks; yet the callbacks expect a reference.

		foreach ( $blocks as $index => $block ) {
			if ( is_callable( $pre_callback ) ) {
				$prev = 0 === $index
					? null
					: $blocks[ $index - 1 ];

				$result .= call_user_func_array(
					$pre_callback,
					array( &$block, &$parent_block, $prev )
				);
			}

			if ( is_callable( $post_callback ) ) {
				$next = count( $blocks ) - 1 === $index
					? null
					: $blocks[ $index + 1 ];

				$post_markup = call_user_func_array(
					$post_callback,
					array( &$block, &$parent_block, $next )
				);
			}

			$result .= traverse_and_serialize_block( $block, $pre_callback, $post_callback );
			$result .= isset( $post_markup ) ? $post_markup : '';
		}

		return $result;
	}
}
