<?php
/**
 * Experimental structural block bindings.
 *
 * @package gutenberg
 */

/**
 * Enables the Gutenberg-only editor implementation of structural bindings.
 *
 * @since 7.2.0
 *
 * @param array $settings Block editor settings.
 * @return array Block editor settings.
 */
function gutenberg_block_bindings_inner_blocks_editor_setting( $settings ) {
	$settings['blockBindingsInnerBlocks'] = true;
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_block_bindings_inner_blocks_editor_setting' );

/**
 * Gets a usable structural binding descriptor.
 *
 * The experiment accepts any registered source on a block with one ordinary
 * InnerBlocks area. `core/html` has a separate multi-area editor component and
 * is not such a host.
 *
 * @since 7.2.0
 *
 * @param array $parsed_block Parsed block.
 * @return array|null Binding descriptor, or null.
 */
function gutenberg_block_bindings_get_inner_blocks_binding( $parsed_block ) {
	if ( 'core/html' === ( $parsed_block['blockName'] ?? null ) ) {
		return null;
	}

	$binding = $parsed_block['attrs']['metadata']['bindings']['innerBlocks'] ?? null;
	if ( ! is_array( $binding ) || ! isset( $binding['source'] ) || ! is_string( $binding['source'] ) || '' === $binding['source'] ) {
		return null;
	}

	return $binding;
}

/**
 * Replaces the existing InnerBlocks placeholders while retaining host markup.
 *
 * The parser records ordinary InnerBlocks locations as `null` entries in
 * `innerContent`. An initially-empty static host has no such location, so this
 * first experiment leaves it unchanged rather than inferring a location from
 * arbitrary HTML.
 *
 * @since 7.2.0
 *
 * @param array $inner_content Existing static markup and block placeholders.
 * @param int   $block_count   Number of replacement blocks.
 * @return array|null Rebuilt inner content, or null if this host has no slot.
 */
function gutenberg_block_bindings_rebuild_inner_content( $inner_content, $block_count ) {
	if ( ! is_array( $inner_content ) ) {
		return null;
	}

	$first_placeholder = array_search( null, $inner_content, true );
	if ( false === $first_placeholder ) {
		return null;
	}

	$last_placeholder = $first_placeholder;
	foreach ( $inner_content as $index => $content ) {
		if ( null === $content ) {
			$last_placeholder = $index;
		}
	}

	return array_merge(
		array_slice( $inner_content, 0, $first_placeholder ),
		array_fill( 0, $block_count, null ),
		array_slice( $inner_content, $last_placeholder + 1 )
	);
}

/**
 * Reads the full context inherited by a nested block instance.
 *
 * `WP_Block::$available_context` includes values provided by ancestors even
 * when the bound host does not list them in `uses_context` itself.
 *
 * @since 7.2.0
 *
 * @param WP_Block $block_instance Bound child block instance.
 * @param WP_Block $parent_block   Parent block instance.
 * @return array Context visible to the binding source.
 */
function gutenberg_block_bindings_get_inner_blocks_context( $block_instance, $parent_block ) {
	if ( ! property_exists( WP_Block::class, 'available_context' ) ) {
		return is_array( $parent_block->context ) ? $parent_block->context : array();
	}

	static $read_available_context = null;

	if ( null === $read_available_context ) {
		$read_available_context = Closure::bind(
			static function ( $block ) {
				return $block->available_context;
			},
			null,
			WP_Block::class
		);
	}

	$context = $read_available_context( $block_instance );
	return is_array( $context )
		? $context
		: ( is_array( $parent_block->context ) ? $parent_block->context : array() );
}

/**
 * Finds the constructed child matching filtered parsed data.
 *
 * @since 7.2.0
 *
 * @param array    $source_block Unfiltered parsed block.
 * @param WP_Block $parent_block Parent block instance.
 * @return WP_Block|null Matching child instance.
 */
function gutenberg_block_bindings_get_inner_blocks_instance( $source_block, $parent_block ) {
	foreach ( $parent_block->inner_blocks as $inner_block ) {
		if ( $inner_block instanceof WP_Block && $inner_block->parsed_block === $source_block ) {
			return $inner_block;
		}
	}

	return null;
}

/**
 * Resolves a serialized structural binding value.
 *
 * Strings replace fallback children; `null`, `undefined`, and all non-string
 * values preserve the host's own serialized children. An empty string is a
 * deliberate empty value.
 *
 * @since 7.2.0
 *
 * @param array    $parsed_block Parsed bound block.
 * @param array    $context      Context inherited by the host.
 * @return array Parsed block, substituted only when resolution is usable.
 */
function gutenberg_block_bindings_resolve_inner_blocks( $parsed_block, $context ) {
	$binding = gutenberg_block_bindings_get_inner_blocks_binding( $parsed_block );
	if ( null === $binding ) {
		return $parsed_block;
	}

	$source = get_block_bindings_source( $binding['source'] );
	if ( null === $source ) {
		return $parsed_block;
	}

	$source_args    = isset( $binding['args'] ) && is_array( $binding['args'] ) ? $binding['args'] : array();
	$block_instance = new WP_Block( $parsed_block, $context );
	foreach ( $source->uses_context ?? array() as $context_name ) {
		if ( array_key_exists( $context_name, $context ) ) {
			$block_instance->context[ $context_name ] = $context[ $context_name ];
		}
	}

	$value = $source->get_value( $source_args, $block_instance, 'innerBlocks' );
	if ( ! is_string( $value ) ) {
		return $parsed_block;
	}

	$inner_blocks  = '' === $value ? array() : parse_blocks( $value );
	$inner_content = gutenberg_block_bindings_rebuild_inner_content(
		$parsed_block['innerContent'] ?? null,
		count( $inner_blocks )
	);
	if ( null === $inner_content ) {
		return $parsed_block;
	}

	$parsed_block['innerBlocks']  = $inner_blocks;
	$parsed_block['innerContent'] = $inner_content;
	$parsed_block['innerHTML']    = implode( '', array_filter( $inner_content, 'is_string' ) );

	return $parsed_block;
}

/**
 * Resolves a nested structural binding before the child renders.
 *
 * @since 7.2.0
 *
 * @param array         $parsed_block Filtered parsed block.
 * @param array         $source_block Original parsed block.
 * @param WP_Block|null $parent_block Parent block instance.
 * @return array Filtered parsed block.
 */
function gutenberg_block_bindings_replace_inner_blocks( $parsed_block, $source_block, $parent_block ) {
	if ( ! $parent_block instanceof WP_Block || null === gutenberg_block_bindings_get_inner_blocks_binding( $parsed_block ) ) {
		return $parsed_block;
	}

	$block_instance = gutenberg_block_bindings_get_inner_blocks_instance( $source_block, $parent_block );
	if ( ! $block_instance instanceof WP_Block ) {
		return $parsed_block;
	}

	return gutenberg_block_bindings_resolve_inner_blocks(
		$parsed_block,
		gutenberg_block_bindings_get_inner_blocks_context( $block_instance, $parent_block )
	);
}
add_filter( 'render_block_data', 'gutenberg_block_bindings_replace_inner_blocks', 10, 3 );

/**
 * Renders a top-level bound block after reproducing `render_block()`'s tail.
 *
 * A plugin cannot place structural resolution inside `WP_Block`, so the
 * top-level path runs the same data and context filters once before creating
 * the final instance. This moves into Core if the experiment is adopted.
 *
 * @since 7.2.0
 *
 * @param string|null   $pre_render   Pre-rendered content.
 * @param array         $parsed_block Parsed block.
 * @param WP_Block|null $parent_block Parent block instance.
 * @return string|null Rendered content, or the existing pre-render value.
 */
function gutenberg_block_bindings_render_top_level_bound_block( $pre_render, $parsed_block, $parent_block ) {
	if ( null !== $pre_render || null !== $parent_block || null === gutenberg_block_bindings_get_inner_blocks_binding( $parsed_block ) ) {
		return $pre_render;
	}

	global $post;
	$source_block = $parsed_block;
	$parsed_block = apply_filters( 'render_block_data', $parsed_block, $source_block, null );
	$context      = array();
	if ( $post instanceof WP_Post ) {
		$context['postId']   = $post->ID;
		$context['postType'] = $post->post_type;
	}
	$context = apply_filters( 'render_block_context', $context, $parsed_block, null );
	$context = is_array( $context ) ? $context : array();

	return ( new WP_Block( gutenberg_block_bindings_resolve_inner_blocks( $parsed_block, $context ), $context ) )->render();
}
add_filter( 'pre_render_block', 'gutenberg_block_bindings_render_top_level_bound_block', PHP_INT_MAX, 3 );
