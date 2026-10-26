<?php
/**
 * Inner blocks bindings: a block bindings source supplies the inner blocks of a
 * Group or Column block, through `metadata.bindings.innerBlocks`.
 *
 * The value is serialized block markup, which replaces the inner blocks of the
 * block. An empty string leaves it without inner blocks. Without a value, the
 * block keeps its own inner blocks.
 *
 * @package gutenberg
 */

/**
 * Adds `innerBlocks` to the attributes that block bindings support on the Group
 * and Column blocks, so that Core resolves its binding.
 *
 * @param string[]|mixed $supported_attributes The attributes supported by block bindings.
 * @param string         $block_type           The block type name.
 * @return string[]|mixed The supported attributes.
 */
function gutenberg_block_bindings_add_inner_blocks_support( $supported_attributes, $block_type ) {
	if ( is_array( $supported_attributes ) && in_array( $block_type, array( 'core/group', 'core/column' ), true ) ) {
		$supported_attributes[] = 'innerBlocks';
	}
	return $supported_attributes;
}
add_filter( 'block_bindings_supported_attributes', 'gutenberg_block_bindings_add_inner_blocks_support', 10, 2 );

/**
 * Returns whether a value supplies inner blocks: block markup, or an empty
 * string for no inner blocks. Anything else, like the plain text of a field,
 * leaves the block with its own inner blocks.
 *
 * @param mixed $value The value of the source.
 * @return bool Whether the value supplies inner blocks.
 */
function gutenberg_block_bindings_is_inner_blocks_value( $value ) {
	return '' === $value || (
		is_string( $value ) &&
		'<!-- wp:' === substr( $value, strspn( $value, " \t\n\f\r" ), 8 )
	);
}

/**
 * Removes, from the blocks a source supplies and their inner blocks, the
 * bindings to that source and every `innerBlocks` binding.
 *
 * The blocks a source supplies are its value as a whole, so none of them is
 * bound to it on its own. And none of them gets its inner blocks from a
 * source, so that two sources whose values bind each other's can't render
 * forever.
 *
 * @param array[] $blocks      The parsed blocks.
 * @param string  $source_name The name of the source.
 * @return array[] The parsed blocks.
 */
function gutenberg_block_bindings_remove_source( $blocks, $source_name ) {
	foreach ( $blocks as &$block ) {
		$bindings = $block['attrs']['metadata']['bindings'] ?? null;
		if ( is_array( $bindings ) ) {
			foreach ( $bindings as $name => $binding ) {
				if ( 'innerBlocks' === $name || ( isset( $binding['source'] ) && $binding['source'] === $source_name ) ) {
					unset( $block['attrs']['metadata']['bindings'][ $name ] );
				}
			}
			// Drop what's left empty, as the editor does.
			if ( empty( $block['attrs']['metadata']['bindings'] ) ) {
				unset( $block['attrs']['metadata']['bindings'] );
			}
			if ( empty( $block['attrs']['metadata'] ) ) {
				unset( $block['attrs']['metadata'] );
			}
		}
		$block['innerBlocks'] = gutenberg_block_bindings_remove_source( $block['innerBlocks'], $source_name );
	}
	return $blocks;
}

/**
 * Replaces the inner blocks of a block with the ones its source supplies,
 * before the block renders them.
 *
 * Runs on the value that `WP_Block::process_block_bindings()` resolves for
 * `innerBlocks`, and returns null so that it never becomes an attribute.
 *
 * @global WP_Embed $wp_embed WordPress Embed object.
 *
 * @param mixed    $value          The value of the source.
 * @param string   $source_name    The name of the source.
 * @param array    $source_args    The arguments of the binding.
 * @param WP_Block $block_instance The block instance.
 * @param string   $attribute_name The name of the bound attribute.
 * @return mixed The value, or null for `innerBlocks`.
 */
function gutenberg_block_bindings_replace_inner_blocks( $value, $source_name, $source_args, $block_instance, $attribute_name ) {
	global $wp_embed;

	if ( 'innerBlocks' !== $attribute_name ) {
		return $value;
	}

	// `__default` bindings don't bind inner blocks: only an explicit binding does.
	$binding = $block_instance->parsed_block['attrs']['metadata']['bindings']['innerBlocks'] ?? null;
	if ( ! gutenberg_block_bindings_is_inner_blocks_value( $value ) || ! isset( $binding['source'] ) || $binding['source'] !== $source_name ) {
		return null;
	}

	// The markup skips the filters that sanitize post content when it's saved,
	// and the user who supplied it may not be allowed unfiltered HTML. Like on
	// save, this also sanitizes the attributes of the blocks, through the
	// `pre_kses` filter.
	$markup = wp_kses_post( $value );
	if ( $wp_embed instanceof WP_Embed ) {
		$markup = $wp_embed->autoembed( $wp_embed->run_shortcode( $markup ) );
	}
	$blocks = gutenberg_block_bindings_remove_source( parse_blocks( $markup ), $source_name );

	// Group and Column wrap their inner blocks in one element: they go before its closer.
	$html   = implode( '', array_filter( $block_instance->parsed_block['innerContent'], 'is_string' ) );
	$offset = strrpos( $html, '</' );
	if ( false === $offset ) {
		return null;
	}
	$inner_content = array_merge(
		array( substr( $html, 0, $offset ) ),
		array_fill( 0, count( $blocks ), null ),
		array( substr( $html, $offset ) )
	);

	$block_instance->parsed_block['innerBlocks']  = $blocks;
	$block_instance->parsed_block['innerContent'] = $inner_content;
	$block_instance->parsed_block['innerHTML']    = $html;
	$block_instance->refresh_parsed_block_dependents();
	// The refresh keeps the previous inner blocks when there are none.
	if ( empty( $blocks ) ) {
		$block_instance->inner_blocks = array();
	}

	return null;
}
add_filter( 'block_bindings_source_value', 'gutenberg_block_bindings_replace_inner_blocks', 10, 5 );
