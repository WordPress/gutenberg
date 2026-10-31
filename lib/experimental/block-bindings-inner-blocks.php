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
 * Keeps `innerBlocks` out of the attributes the editor offers to bind: the
 * editor doesn't render inner blocks bindings yet.
 *
 * @param array $settings The block editor settings.
 * @return array The block editor settings.
 */
function gutenberg_block_bindings_remove_inner_blocks_from_editor( $settings ) {
	if ( ! isset( $settings['__experimentalBlockBindingsSupportedAttributes'] ) || ! is_array( $settings['__experimentalBlockBindingsSupportedAttributes'] ) ) {
		return $settings;
	}
	foreach ( $settings['__experimentalBlockBindingsSupportedAttributes'] as $block_type => $attributes ) {
		$attributes = array_values( array_diff( (array) $attributes, array( 'innerBlocks' ) ) );
		if ( $attributes ) {
			$settings['__experimentalBlockBindingsSupportedAttributes'][ $block_type ] = $attributes;
		} else {
			unset( $settings['__experimentalBlockBindingsSupportedAttributes'][ $block_type ] );
		}
	}
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_block_bindings_remove_inner_blocks_from_editor' );

/**
 * Determines whether the value of a block bindings source supplies inner
 * blocks.
 *
 * Serialized block markup supplies them, and an empty string supplies none.
 * Any other value, like the plain text of a field, leaves the block with its
 * own inner blocks.
 *
 * @param mixed $value The value of the source.
 * @return bool Whether the value supplies inner blocks.
 */
function gutenberg_block_bindings_is_inner_blocks_value( $value ) {
	return '' === $value || ( is_string( $value ) && str_starts_with( ltrim( $value, " \t\n\f\r" ), '<!-- wp:' ) );
}

/**
 * Parses the inner blocks a block bindings source supplies.
 *
 * The markup never went through the filters that sanitize post content on
 * save, and the user who supplied it may not be allowed unfiltered HTML, so it
 * is sanitized as on save, attributes of its blocks included. Its embeds are
 * expanded as the embeds of the content were, before its blocks render.
 *
 * @global WP_Embed $wp_embed WordPress Embed object.
 *
 * @param string $markup The serialized blocks.
 * @return array[] The parsed blocks.
 */
function gutenberg_block_bindings_parse_inner_blocks( $markup ) {
	global $wp_embed;

	$markup = wp_kses_post( $markup );
	if ( $wp_embed instanceof WP_Embed ) {
		$markup = $wp_embed->run_shortcode( $markup );
		$markup = $wp_embed->autoembed( $markup );
	}

	return gutenberg_block_bindings_prepare_inner_blocks( parse_blocks( $markup ) );
}

/**
 * Prepares the blocks a source supplies, and their inner blocks, to render.
 *
 * Removes their `innerBlocks` bindings: none of them gets its inner blocks from
 * a source, so that two sources whose values bind each other's can't render
 * forever. Removes the bindings and metadata this leaves empty, as the editor
 * does.
 *
 * Also removes their custom CSS, which only users who can edit CSS may add:
 * whoever supplied the value is unknown.
 *
 * @param array[] $blocks The parsed blocks.
 * @return array[] The parsed blocks.
 */
function gutenberg_block_bindings_prepare_inner_blocks( $blocks ) {
	foreach ( $blocks as &$block ) {
		if ( isset( $block['attrs']['style'] ) ) {
			$block['attrs']['style'] = gutenberg_strip_custom_css_from_style_array( $block['attrs']['style'] );
			if ( empty( $block['attrs']['style'] ) ) {
				unset( $block['attrs']['style'] );
			}
		}

		if ( isset( $block['attrs']['metadata']['bindings']['innerBlocks'] ) ) {
			unset( $block['attrs']['metadata']['bindings']['innerBlocks'] );
			if ( empty( $block['attrs']['metadata']['bindings'] ) ) {
				unset( $block['attrs']['metadata']['bindings'] );
			}
			if ( empty( $block['attrs']['metadata'] ) ) {
				unset( $block['attrs']['metadata'] );
			}
		}
		$block['innerBlocks'] = gutenberg_block_bindings_prepare_inner_blocks( $block['innerBlocks'] );
	}
	return $blocks;
}

/**
 * Returns the inner content of a block with slots for the given number of
 * inner blocks.
 *
 * The slots replace the block's own inner blocks and the HTML between them. A
 * block without inner blocks gets them before the closing tag of the element
 * that wraps its content.
 *
 * @param array $inner_content The inner content of the block.
 * @param int   $count         The number of inner blocks.
 * @return array|null The inner content, or null if there's no element to put
 *                    the inner blocks in.
 */
function gutenberg_block_bindings_get_inner_content( $inner_content, $count ) {
	if ( ! is_array( $inner_content ) ) {
		return null;
	}

	$slots     = array_fill( 0, $count, null );
	$own_slots = array_keys( $inner_content, null, true );
	if ( $own_slots ) {
		$before_first_slot = array_slice( $inner_content, 0, $own_slots[0] );
		$after_last_slot   = array_slice( $inner_content, end( $own_slots ) + 1 );
		return array_merge( $before_first_slot, $slots, $after_last_slot );
	}

	$wrapper_parts = gutenberg_block_bindings_split_at_wrapper_closer( implode( '', $inner_content ) );
	if ( null === $wrapper_parts ) {
		return null;
	}
	return array_merge( array( $wrapper_parts[0] ), $slots, array( $wrapper_parts[1] ) );
}

/**
 * Splits the HTML of an element that wraps a block's content before the
 * element's closing tag.
 *
 * @param string $html The HTML of the wrapper element.
 * @return string[]|null The HTML before the closing tag and the HTML from it,
 *                       or null if the HTML has no wrapper element to split.
 */
function gutenberg_block_bindings_split_at_wrapper_closer( $html ) {
	$processor = WP_HTML_Processor::create_fragment( $html );
	if ( null === $processor ) {
		return null;
	}

	$before                = '';
	$after                 = '';
	$depth_outside_wrapper = null;
	$is_at_wrapper_closer  = false;
	while ( $processor->next_token() ) {
		if ( null === $depth_outside_wrapper && '#tag' === $processor->get_token_type() && ! $processor->is_tag_closer() ) {
			$depth_outside_wrapper = $processor->get_current_depth() - 1;
		} elseif ( $processor->is_tag_closer() && $processor->get_current_depth() === $depth_outside_wrapper ) {
			$is_at_wrapper_closer = true;
		}

		if ( $is_at_wrapper_closer ) {
			$after .= $processor->serialize_token();
		} else {
			$before .= $processor->serialize_token();
		}
	}

	if ( ! $is_at_wrapper_closer || null !== $processor->get_last_error() || $processor->paused_at_incomplete_token() ) {
		return null;
	}
	return array( $before, $after );
}

/**
 * Replaces the inner blocks of a block with the ones its source supplies,
 * before the block renders them.
 *
 * Runs on the value that `WP_Block::process_block_bindings()` resolves for
 * `innerBlocks`, and returns null so that it never becomes an attribute. Only
 * a binding in the block's own metadata replaces them, not the one the
 * `__default` binding expands to.
 *
 * @param mixed    $value          The value of the source.
 * @param string   $source_name    The name of the source.
 * @param array    $source_args    The arguments of the binding.
 * @param WP_Block $block_instance The block instance.
 * @param string   $attribute_name The name of the bound attribute.
 * @return mixed The value, or null for `innerBlocks`.
 */
function gutenberg_block_bindings_replace_inner_blocks( $value, $source_name, $source_args, $block_instance, $attribute_name ) {
	if ( 'innerBlocks' !== $attribute_name ) {
		return $value;
	}

	$own_binding_source = $block_instance->parsed_block['attrs']['metadata']['bindings']['innerBlocks']['source'] ?? null;
	if ( $own_binding_source !== $source_name || ! gutenberg_block_bindings_is_inner_blocks_value( $value ) ) {
		return null;
	}

	$blocks        = gutenberg_block_bindings_parse_inner_blocks( $value );
	$inner_content = gutenberg_block_bindings_get_inner_content( $block_instance->parsed_block['innerContent'] ?? null, count( $blocks ) );
	if ( null === $inner_content ) {
		return null;
	}

	$block_instance->parsed_block['innerBlocks']  = $blocks;
	$block_instance->parsed_block['innerContent'] = $inner_content;
	$block_instance->parsed_block['innerHTML']    = implode( '', array_filter( $inner_content, 'is_string' ) );
	$block_instance->inner_blocks                 = new WP_Block_List( array() );
	$block_instance->refresh_parsed_block_dependents();

	return null;
}
add_filter( 'block_bindings_source_value', 'gutenberg_block_bindings_replace_inner_blocks', 10, 5 );
