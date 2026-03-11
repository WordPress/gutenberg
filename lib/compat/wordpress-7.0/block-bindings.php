<?php
/**
 * Block Bindings: Support for generically setting rich-text block attributes.
 *
 * @since 7.0
 * @package gutenberg
 * @subpackage Block Bindings
 */

// The following filter can be removed once the minimum required WordPress version is 7.0 or newer.
add_filter(
	'block_bindings_supported_attributes_core/cover',
	function ( $attributes ) {
		$attributes[] = 'id';
		$attributes[] = 'url';
		return $attributes;
	},
	10
);

function gutenberg_replace_cover_block_img_src( $attribute, $attribute_name, $block_name ) {
	if ( 'core/cover' === $block_name && 'url' === $attribute_name ) {
		$attribute['source']    = 'attribute';
		$attribute['selector']  = 'img';
		$attribute['attribute'] = 'src';
	}
	return $attribute;
}
add_filter( 'block_bindings_attribute_replaced_in_markup', 'gutenberg_replace_cover_block_img_src', 10, 3 );

// Remove WP 6.9 Block Bindings compat layer.
remove_filter( 'render_block', 'gutenberg_block_bindings_render_block', 10 );
/**
 * Callback function for the render_block filter.
 *
 * Identical to the 6.9 compat layer version, with one addition:
 * The `block_bindings_attribute_replaced_in_markup` allows specifying attributes that should be
 * replaced in the block markup.
 *
 * @since 7.0.0
 *
 * @param string   $block_content The block content.
 * @param array    $block         The full block, including name and attributes.
 * @param WP_Block $instance      The block instance.
 */
function gutenberg_block_bindings_render_block_7_0( $block_content, $block, $instance ) {
	static $inside_block_bindings_render = false;
	if ( $inside_block_bindings_render ) {
		return $block_content;
	}

	// Process the block bindings and get attributes updated with the values from the sources.
	$computed_attributes = gutenberg_process_block_bindings( $instance );
	if ( empty( $computed_attributes ) ) {
		return $block_content;
	}

	/*
	 * Merge the computed attributes with the original attributes.
	 *
	 * Note that this is not a recursive merge, meaning that nested attributes --
	 * such as block bindings metadata -- will be completely replaced.
	 * This is desirable. At this point, Core has already processed any block
	 * bindings that it supports. What remains to be processed are only the attributes
	 * for which support was added later (through the `block_bindings_supported_attributes`
	 * filter). To do so, we'll run `$instance->render()` once more
	 * so the block can update its content based on those attributes.
	 */
	$instance->attributes = array_merge( $instance->attributes, $computed_attributes );

	/*
	 * If we're dealing with the Button block, we remove the bindings metadata
	 * in order to avoid having it reprocessed, which would lead to Core
	 * capitalizing the wrapper tag (e.g. <DIV>).
	 */
	if ( 'core/button' === $instance->name ) {
		unset( $instance->parsed_block['attrs']['metadata']['bindings'] );
	}

	/**
	 * This filter (`gutenberg_block_bindings_render_block`) is called from `WP_Block::render()`.
	 * To avoid infinite recursion, we set a flag that this filter checks when invoked which tells
	 * it to exit early.
	 */
	$inside_block_bindings_render = true;
	$block_content                = $instance->render();
	$inside_block_bindings_render = false;

	$block_type = $instance->block_type;

	if ( ! empty( $computed_attributes ) && ! empty( $block_content ) ) {
		foreach ( $computed_attributes as $attribute_name => $source_value ) {
			$attribute                                 = $block_type->attributes[ $attribute_name ];
			$attribute                                 = apply_filters( 'block_bindings_attribute_replaced_in_markup', $attribute, $attribute_name, $instance->name );
			$block_type->attributes[ $attribute_name ] = $attribute;

			$block_content = gutenberg_replace_html( $block_content, $attribute_name, $source_value, $block_type );
		}
	}

	return $block_content;
}
add_filter( 'render_block', 'gutenberg_block_bindings_render_block_7_0', 10, 3 );
