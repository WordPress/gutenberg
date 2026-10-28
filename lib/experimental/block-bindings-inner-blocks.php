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
 * Prepares the blocks a source supplies, and their inner blocks, to render.
 *
 * Removes their `innerBlocks` bindings: none of them gets its inner blocks from
 * a source, so that two sources whose values bind each other's can't render
 * forever.
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
			// Drop what's left empty, as the editor does.
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
 * Returns where the inner blocks go in the markup of a block that has none.
 *
 * Group and Column wrap them in one element, so they go before its closer, or
 * before the closer of the inner container of a legacy Group.
 *
 * @param string $html The markup of the block.
 * @return int|null The byte offset, or null if there's no element to put them in.
 */
function gutenberg_block_bindings_get_inner_blocks_offset( $html ) {
	// Exposes the byte offset of a tag, which the HTML API doesn't do publicly.
	// The redeclaration-guard sniff can't tell the method from a global function.
	// phpcs:disable Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration
	$processor = new class( $html ) extends WP_HTML_Tag_Processor {
		/**
		 * Returns the byte offset where the current tag starts.
		 *
		 * @return int The byte offset.
		 */
		public function get_tag_start(): int {
			$this->set_bookmark( 'here' );
			return $this->bookmarks['here']->start;
		}
	};
	// phpcs:enable Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration

	if ( ! $processor->next_tag() ) {
		return null;
	}
	$processor->set_bookmark( 'wrapper' );

	// As in `wp_restore_group_inner_container()`, the inner container comes first
	// in the wrapper, after any whitespace.
	while ( $processor->next_token() ) {
		if ( '#text' !== $processor->get_token_type() || '' !== trim( $processor->get_modifiable_text(), " \t\n\f\r" ) ) {
			break;
		}
	}
	if ( 'DIV' !== $processor->get_tag() || $processor->is_tag_closer() || ! $processor->has_class( 'wp-block-group__inner-container' ) ) {
		$processor->seek( 'wrapper' );
	}

	// Finds the matching closer as `WP_Interactivity_API_Directives_Processor`
	// does: counting only tags with the same name, as other tags may omit theirs.
	$query = array(
		'tag_name'    => $processor->get_tag(),
		'tag_closers' => 'visit',
	);
	$depth = 0;
	while ( $processor->next_tag( $query ) ) {
		if ( ! $processor->is_tag_closer() ) {
			++$depth;
		} elseif ( $depth > 0 ) {
			--$depth;
		} else {
			return $processor->get_tag_start();
		}
	}
	return null;
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
	$blocks = gutenberg_block_bindings_prepare_inner_blocks( parse_blocks( $markup ) );

	// The blocks go where the block's own inner blocks were.
	$inner_content = $block_instance->parsed_block['innerContent'] ?? array();
	if ( ! is_array( $inner_content ) ) {
		return null;
	}
	$slots = array_keys( $inner_content, null, true );
	if ( $slots ) {
		$opener = implode( '', array_slice( $inner_content, 0, $slots[0] ) );
		$closer = implode( '', array_slice( $inner_content, end( $slots ) + 1 ) );
	} else {
		$html   = implode( '', $inner_content );
		$offset = gutenberg_block_bindings_get_inner_blocks_offset( $html );
		if ( null === $offset ) {
			return null;
		}
		$opener = substr( $html, 0, $offset );
		$closer = substr( $html, $offset );
	}

	$block_instance->parsed_block['innerBlocks']  = $blocks;
	$block_instance->parsed_block['innerContent'] = array_merge( array( $opener ), array_fill( 0, count( $blocks ), null ), array( $closer ) );
	$block_instance->parsed_block['innerHTML']    = $opener . $closer;
	$block_instance->refresh_parsed_block_dependents();
	// The refresh keeps the previous inner blocks when there are none.
	if ( empty( $blocks ) ) {
		$block_instance->inner_blocks = array();
	}

	return null;
}
add_filter( 'block_bindings_source_value', 'gutenberg_block_bindings_replace_inner_blocks', 10, 5 );
