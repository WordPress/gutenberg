<?php
/**
 * Auto-inserting blocks.
 *
 * @package gutenberg
 */

/**
 * Return a function that auto-inserts blocks relative to a given block.
 *
 * @param string $anchor_block      The block to insert relative to.
 * @param string $relative_position The position relative to the given block.
 * @param array  $inserted_block    The block to insert.
 * @return callable A function that accepts a block's content and returns the content with the inserted block.
 */
function gutenberg_auto_insert_block( $anchor_block, $relative_position, $inserted_block ) {
	return function( $block ) use ( $anchor_block, $relative_position, $inserted_block ) {
		if ( $anchor_block === $block['blockName'] ) {
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

		$anchor_block_index = array_search( $anchor_block, array_column( $block['innerBlocks'], 'blockName' ), true );
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

function gutenberg_register_auto_inserted_blocks( $settings, $metadata ) {
	if ( ! isset( $metadata['__experimentalAutoInsert'] ) ) {
		return $settings;
	}
	$auto_insert = $metadata['__experimentalAutoInsert'];

	$property_mappings = array(
		'before'     => 'before',
		'after'      => 'after',
		'firstChild' => 'first_child',
		'lastChild'  => 'last_child',
	);

	$inserted_block_name = $metadata['name'];
	foreach ( $auto_insert as $anchor_block_name => $position ) {
		// Avoid infinite recursion (auto-inserting into self).
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

		$inserted_block = array(
			'blockName'    => $inserted_block_name,
			'attrs'        => array(),
			'innerHTML'    => '',
			'innerContent' => array(),
			'innerBlocks'  => array(),
		);

		// TODO: In the long run, we'd likely want some sort of registry for auto-inserted blocks.

		// Auto-insert sibling and child blocks into the editor (via the templates and patterns
		// REST API endpoints), and auto-insert sibling blocks on the frontend.
		$inserter = gutenberg_auto_insert_block( $anchor_block_name, $mapped_position, $inserted_block );
		add_filter( 'gutenberg_serialize_block', $inserter, 10, 1 );

		$settings['auto_insert'][ $anchor_block_name ] = $mapped_position;
	}

	return $settings;
}
add_filter( 'block_type_metadata_settings', 'gutenberg_register_auto_inserted_blocks', 10, 2 );

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
 * @param WP_Block_Template|null $block_template The found block template, or null if there is none.
 */
function gutenberg_parse_and_serialize_blocks( $block_template ) {

	$blocks                  = parse_blocks( $block_template->content );
	$block_template->content = gutenberg_serialize_blocks( $blocks );

	return $block_template;
}
add_filter( 'get_block_file_template', 'gutenberg_parse_and_serialize_blocks', 10, 1 );

/**
 * Filterable version of `serialize_blocks()`.
 *
 * This function is identical to `serialize_blocks()`, except that it applies
 * the `gutenberg_serialize_block` filter to each block before it is serialized.
 *
 * @param array $block The block to be serialized.
 * @return string The serialized block.
 *
 * @see serialize_blocks()
 */
function gutenberg_serialize_block( $block ) {
	$block_content = '';

	/**
	 * Filters a block before it is serialized.
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

function gutenberg_serialize_blocks( $blocks ) {
	return implode( '', array_map( 'gutenberg_serialize_block', $blocks ) );
}
