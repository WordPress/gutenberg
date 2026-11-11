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
 * Keeps `innerBlocks` out of the attributes the editor offers to bind on the
 * Group and Column blocks: the editor doesn't render inner blocks bindings yet.
 *
 * @param array $settings The block editor settings.
 * @return array The block editor settings.
 */
function gutenberg_block_bindings_remove_inner_blocks_from_editor( $settings ) {
	if ( ! isset( $settings['__experimentalBlockBindingsSupportedAttributes'] ) || ! is_array( $settings['__experimentalBlockBindingsSupportedAttributes'] ) ) {
		return $settings;
	}
	foreach ( array( 'core/group', 'core/column' ) as $block_type ) {
		if ( ! isset( $settings['__experimentalBlockBindingsSupportedAttributes'][ $block_type ] ) ) {
			continue;
		}
		$attributes = array_values( array_diff( (array) $settings['__experimentalBlockBindingsSupportedAttributes'][ $block_type ], array( 'innerBlocks' ) ) );
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
 * Markup supplies them when the first block delimiter the block parser finds,
 * after any whitespace, opens a block. Any other value, like the plain text of
 * a field, leaves the block with its own inner blocks.
 *
 * @param mixed $value The value of the source.
 * @return bool Whether the value supplies inner blocks.
 */
function gutenberg_block_bindings_is_inner_blocks_value( $value ) {
	if ( '' === $value ) {
		return true;
	}
	if ( ! is_string( $value ) ) {
		return false;
	}

	$processor = new WP_Block_Processor( $value );
	while ( $processor->next_token() ) {
		if ( $processor->is_html() && ! $processor->is_non_whitespace_html() ) {
			continue;
		}
		return ! $processor->is_html() && $processor->opens_block();
	}
	return false;
}

/**
 * Returns what a block asks its block bindings source for `innerBlocks`: the
 * source, the arguments of the binding, the context the source uses, and the
 * attributes of the block.
 *
 * Two blocks with the same request get the same inner blocks from the source,
 * whatever the order of its keys.
 *
 * @param string   $source_name    The name of the source.
 * @param array    $source_args    The arguments of the binding.
 * @param WP_Block $block_instance The block instance.
 * @return array The request.
 */
function gutenberg_block_bindings_get_inner_blocks_request( $source_name, $source_args, $block_instance ) {
	$source  = get_block_bindings_source( $source_name );
	$context = array();
	foreach ( $source ? (array) $source->uses_context : array() as $context_name ) {
		if ( array_key_exists( $context_name, $block_instance->context ) ) {
			$context[ $context_name ] = $block_instance->context[ $context_name ];
		}
	}
	$request = array( $source_name, $source_args, $context, $block_instance->attributes );
	wp_recursive_ksort( $request );
	return $request;
}

/**
 * Returns whether the inner blocks a source supplied for the given request are
 * rendering.
 *
 * @global array[] $gutenberg_block_bindings_rendering_inner_blocks The blocks whose supplied inner blocks are rendering, with their requests.
 *
 * @param array $request The request, as `gutenberg_block_bindings_get_inner_blocks_request()` returns it.
 * @return bool Whether supplied inner blocks for the request are rendering.
 */
function gutenberg_block_bindings_is_rendering_inner_blocks_request( $request ) {
	global $gutenberg_block_bindings_rendering_inner_blocks;
	foreach ( (array) $gutenberg_block_bindings_rendering_inner_blocks as $rendering ) {
		if ( $rendering['request'] === $request ) {
			return true;
		}
	}
	return false;
}

/**
 * Stops tracking a block whose supplied inner blocks were rendering, once the
 * block itself has rendered.
 *
 * The blocks still rendering inside it, if any, stopped with it, so they are
 * forgotten along with it.
 *
 * @global array[] $gutenberg_block_bindings_rendering_inner_blocks The blocks whose supplied inner blocks are rendering, with their requests.
 *
 * @param string   $block_content The rendered block.
 * @param array    $parsed_block  The parsed block.
 * @param WP_Block $instance      The block instance.
 * @return string The rendered block.
 */
function gutenberg_block_bindings_finish_rendering_supplied_inner_blocks( $block_content, $parsed_block, $instance ) {
	global $gutenberg_block_bindings_rendering_inner_blocks;
	foreach ( (array) $gutenberg_block_bindings_rendering_inner_blocks as $index => $rendering ) {
		if ( $rendering['host'] === $instance ) {
			$gutenberg_block_bindings_rendering_inner_blocks = array_slice( $gutenberg_block_bindings_rendering_inner_blocks, 0, $index );
			break;
		}
	}
	return $block_content;
}
add_filter( 'render_block', 'gutenberg_block_bindings_finish_rendering_supplied_inner_blocks', 10, 3 );

/**
 * Stops tracking the blocks whose supplied inner blocks were rendering when the
 * blocks themselves stopped rendering with an exception.
 *
 * A block that doesn't finish rendering never reaches the `render_block`
 * filter. If something catches the exception and goes on rendering, the block
 * would otherwise count as rendering for the rest of the request. A block is
 * rendering while its `WP_Block::render()` call is on the call stack.
 *
 * @global array[] $gutenberg_block_bindings_rendering_inner_blocks The blocks whose supplied inner blocks are rendering, with their requests.
 */
function gutenberg_block_bindings_forget_hosts_that_stopped_rendering() {
	global $gutenberg_block_bindings_rendering_inner_blocks;
	if ( empty( $gutenberg_block_bindings_rendering_inner_blocks ) ) {
		return;
	}

	$rendering_blocks = array();
	foreach ( debug_backtrace( DEBUG_BACKTRACE_PROVIDE_OBJECT | DEBUG_BACKTRACE_IGNORE_ARGS ) as $frame ) {
		if ( isset( $frame['object'] ) && $frame['object'] instanceof WP_Block && 'render' === $frame['function'] ) {
			$rendering_blocks[] = $frame['object'];
		}
	}
	foreach ( $gutenberg_block_bindings_rendering_inner_blocks as $index => $rendering ) {
		if ( ! in_array( $rendering['host'], $rendering_blocks, true ) ) {
			$gutenberg_block_bindings_rendering_inner_blocks = array_slice( $gutenberg_block_bindings_rendering_inner_blocks, 0, $index );
			return;
		}
	}
}

/**
 * Parses the inner blocks a block bindings source supplies.
 *
 * The markup never went through the filters that sanitize post content on
 * save, and the user who supplied it may not be allowed unfiltered HTML, so by
 * default it is sanitized as on save, attributes of its blocks included. Its
 * embeds are expanded as the embeds of the content were, before its blocks
 * render.
 *
 * @global WP_Embed $wp_embed WordPress Embed object.
 *
 * @param string   $markup         The serialized blocks.
 * @param string   $source_name    The name of the source.
 * @param array    $source_args    The arguments of the binding.
 * @param WP_Block $block_instance The block instance.
 * @return array[] The parsed blocks.
 */
function gutenberg_block_bindings_parse_inner_blocks( $markup, $source_name, $source_args, $block_instance ) {
	global $wp_embed;

	/**
	 * Filters whether the inner blocks a block bindings source supplies are
	 * sanitized before they render.
	 *
	 * By default the markup is sanitized as the post content of a user without
	 * the `unfiltered_html` capability, since the user who supplied it is
	 * unknown: `wp_kses_post()` removes the HTML that user may not publish, in
	 * the attributes of the blocks included. A source whose markup comes from
	 * trusted code, not from users, may keep it as supplied. Custom CSS is
	 * removed from the blocks either way.
	 *
	 * Sanitizing keeps the block delimiters that `serialize_blocks()` writes,
	 * which escapes the characters `wp_kses_post()` rewrites inside comments.
	 *
	 * @since 7.3.0
	 *
	 * @param bool     $sanitize       Whether to sanitize the markup. Default true.
	 * @param string   $source_name    The name of the source.
	 * @param array    $source_args    The arguments of the binding.
	 * @param WP_Block $block_instance The block whose inner blocks the source supplies.
	 */
	if ( apply_filters( 'block_bindings_sanitize_inner_blocks', true, $source_name, $source_args, $block_instance ) ) {
		$markup = wp_kses_post( $markup );
	}
	if ( $wp_embed instanceof WP_Embed ) {
		$markup = $wp_embed->run_shortcode( $markup );
		$markup = $wp_embed->autoembed( $markup );
	}

	return gutenberg_block_bindings_prepare_inner_blocks( parse_blocks( $markup ) );
}

/**
 * Prepares the blocks a source supplies, and their inner blocks, to render.
 *
 * Removes their custom CSS, which only users who can edit CSS may add:
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
 * Splits the HTML of the element that wraps a block's content before the
 * element's closing tag.
 *
 * The wrapper is the last element of the HTML. When all it holds is the inner
 * container of a Group block saved before WordPress 5.8, the split happens
 * before the closing tag of the container, where the block's own inner blocks
 * would be.
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

	$tokens = array();
	while ( $processor->next_token() ) {
		$is_opener = '#tag' === $processor->get_token_type() && ! $processor->is_tag_closer();
		$tokens[]  = array(
			'html'               => $processor->serialize_token(),
			'depth'              => $processor->get_current_depth(),
			'is_opener'          => $is_opener,
			'is_closer'          => '#tag' === $processor->get_token_type() && $processor->is_tag_closer(),
			'is_inner_container' => $is_opener && $processor->has_class( 'wp-block-group__inner-container' ),
			'is_whitespace'      => '#text' === $processor->get_token_type() && '' === trim( $processor->get_modifiable_text() ),
		);
	}
	if ( null !== $processor->get_last_error() || $processor->paused_at_incomplete_token() ) {
		return null;
	}

	$closer_index = gutenberg_block_bindings_find_wrapper_closer( $tokens );
	if ( null === $closer_index ) {
		return null;
	}
	$before = implode( '', array_column( array_slice( $tokens, 0, $closer_index ), 'html' ) );
	$after  = implode( '', array_column( array_slice( $tokens, $closer_index ), 'html' ) );
	return array( $before, $after );
}

/**
 * Finds the closing tag of the wrapper element among the tokens of a block's
 * content: the last element of the content, or the legacy inner container of
 * a Group block when it is all that element holds.
 *
 * @param array[] $tokens The tokens, each with its HTML, its depth, and whether it opens an element, closes one, opens a legacy inner container, or is whitespace.
 * @return int|null The index of the closing tag, or null if no element wraps the content.
 */
function gutenberg_block_bindings_find_wrapper_closer( $tokens ) {
	$wrapper_depth = null;
	foreach ( $tokens as $token ) {
		if ( $token['is_opener'] ) {
			$wrapper_depth = $token['depth'];
			break;
		}
	}
	if ( null === $wrapper_depth ) {
		return null;
	}

	$closer_index = null;
	foreach ( $tokens as $index => $token ) {
		if ( $token['is_closer'] && $token['depth'] === $wrapper_depth - 1 ) {
			$closer_index = $index;
		}
	}
	if ( null === $closer_index ) {
		return null;
	}

	$opener_index = $closer_index;
	while ( ! $tokens[ $opener_index ]['is_opener'] || $tokens[ $opener_index ]['depth'] !== $wrapper_depth ) {
		--$opener_index;
	}

	$inner_container_closer_index = gutenberg_block_bindings_find_sole_inner_container_closer( $tokens, $opener_index, $closer_index, $wrapper_depth );
	return $inner_container_closer_index ?? $closer_index;
}

/**
 * Finds the closing tag of the legacy inner container of a Group block, when
 * the container is all that the wrapper element holds, whitespace aside.
 *
 * @param array[] $tokens        The tokens of the block's content.
 * @param int     $opener_index  The index of the wrapper's opening tag.
 * @param int     $closer_index  The index of the wrapper's closing tag.
 * @param int     $wrapper_depth The depth of the wrapper's opening tag.
 * @return int|null The index of the container's closing tag, or null if the wrapper holds anything else.
 */
function gutenberg_block_bindings_find_sole_inner_container_closer( $tokens, $opener_index, $closer_index, $wrapper_depth ) {
	$index = $opener_index + 1;
	while ( $index < $closer_index && $tokens[ $index ]['is_whitespace'] ) {
		++$index;
	}
	if ( $index >= $closer_index || ! $tokens[ $index ]['is_inner_container'] ) {
		return null;
	}

	while ( $index < $closer_index && ! ( $tokens[ $index ]['is_closer'] && $tokens[ $index ]['depth'] === $wrapper_depth ) ) {
		++$index;
	}
	$inner_container_closer_index = $index;
	for ( ++$index; $index < $closer_index; ++$index ) {
		if ( ! $tokens[ $index ]['is_whitespace'] ) {
			return null;
		}
	}
	return $inner_container_closer_index < $closer_index ? $inner_container_closer_index : null;
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
 * Not while the inner blocks the source supplied for the same request render:
 * the block then keeps its own inner blocks. This way sources whose values
 * bind each other's, directly or through content that loads as it renders,
 * like the menu of a Navigation block, can't render forever. Bindings that ask
 * a source something else still resolve, inside supplied inner blocks too.
 *
 * Only so many of them, though: whoever writes a value writes the arguments
 * of the bindings inside it, and a value whose bindings ask for it again with
 * other arguments would otherwise render once for every order they can nest
 * in. Past the limit, a block inside supplied inner blocks keeps its own.
 *
 * @global array[] $gutenberg_block_bindings_rendering_inner_blocks    The blocks whose supplied inner blocks are rendering, with their requests.
 * @global int     $gutenberg_block_bindings_nested_inner_blocks_count The number of blocks that got inner blocks from a source inside the ones supplied to the outermost block rendering.
 *
 * @param mixed    $value          The value of the source.
 * @param string   $source_name    The name of the source.
 * @param array    $source_args    The arguments of the binding.
 * @param WP_Block $block_instance The block instance.
 * @param string   $attribute_name The name of the bound attribute.
 * @return mixed The value, or null for `innerBlocks`.
 */
function gutenberg_block_bindings_replace_inner_blocks( $value, $source_name, $source_args, $block_instance, $attribute_name ) {
	global $gutenberg_block_bindings_rendering_inner_blocks, $gutenberg_block_bindings_nested_inner_blocks_count;

	if ( 'innerBlocks' !== $attribute_name ) {
		return $value;
	}

	$own_binding_source = $block_instance->parsed_block['attrs']['metadata']['bindings']['innerBlocks']['source'] ?? null;
	if ( $own_binding_source !== $source_name || ! gutenberg_block_bindings_is_inner_blocks_value( $value ) ) {
		return null;
	}

	gutenberg_block_bindings_forget_hosts_that_stopped_rendering();
	$request = gutenberg_block_bindings_get_inner_blocks_request( $source_name, $source_args, $block_instance );
	if ( gutenberg_block_bindings_is_rendering_inner_blocks_request( $request ) ) {
		return null;
	}

	$is_nested = ! empty( $gutenberg_block_bindings_rendering_inner_blocks );
	if ( $is_nested ) {
		/**
		 * Filters how many blocks may get inner blocks from a source inside
		 * the inner blocks a source supplied to one block.
		 *
		 * The limit covers every level of nesting below that block. It keeps a
		 * value from rendering without bound through bindings that ask for it
		 * again with other arguments or context.
		 *
		 * @since 7.3.0
		 *
		 * @param int $limit The number of blocks. Default 100.
		 */
		$limit = (int) apply_filters( 'block_bindings_nested_inner_blocks_limit', 100 );
		if ( (int) $gutenberg_block_bindings_nested_inner_blocks_count >= $limit ) {
			return null;
		}
	}

	$blocks        = gutenberg_block_bindings_parse_inner_blocks( $value, $source_name, $source_args, $block_instance );
	$inner_content = gutenberg_block_bindings_get_inner_content( $block_instance->parsed_block['innerContent'] ?? null, count( $blocks ) );
	if ( null === $inner_content ) {
		return null;
	}

	$block_instance->parsed_block['innerBlocks']  = $blocks;
	$block_instance->parsed_block['innerContent'] = $inner_content;
	$block_instance->parsed_block['innerHTML']    = implode( '', array_filter( $inner_content, 'is_string' ) );
	$block_instance->inner_blocks                 = new WP_Block_List( array() );
	$block_instance->inner_content                = $inner_content;
	$block_instance->inner_html                   = $block_instance->parsed_block['innerHTML'];
	$block_instance->refresh_parsed_block_dependents();

	$gutenberg_block_bindings_nested_inner_blocks_count = $is_nested ? (int) $gutenberg_block_bindings_nested_inner_blocks_count + 1 : 0;
	$gutenberg_block_bindings_rendering_inner_blocks[]  = array(
		'host'    => $block_instance,
		'request' => $request,
	);

	return null;
}
add_filter( 'block_bindings_source_value', 'gutenberg_block_bindings_replace_inner_blocks', 10, 5 );
