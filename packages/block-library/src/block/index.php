<?php
/**
 * Server-side rendering of the `core/block` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/block` block on server.
 *
 * @param array  $attributes    The block attributes.
 * @param string $block_content The block content.
 *
 * @return string Rendered HTML of the referenced block.
 */
function render_block_core_block( $attributes, $block_content ) {
	static $seen_refs = array();

	if ( empty( $attributes['ref'] ) ) {
		return '';
	}

	$reusable_block = get_post( $attributes['ref'] );
	if ( ! $reusable_block || 'wp_block' !== $reusable_block->post_type ) {
		return '';
	}

	if ( isset( $seen_refs[ $attributes['ref'] ] ) ) {
		// WP_DEBUG_DISPLAY must only be honored when WP_DEBUG. This precedent
		// is set in `wp_debug_mode()`.
		$is_debug = WP_DEBUG && WP_DEBUG_DISPLAY;

		return $is_debug ?
			// translators: Visible only in the front end, this warning takes the place of a faulty block.
			__( '[block rendering halted]' ) :
			'';
	}

	if ( 'publish' !== $reusable_block->post_status || ! empty( $reusable_block->post_password ) ) {
		return '';
	}

	$seen_refs[ $attributes['ref'] ] = true;

	// We need to determine the widest alignment of inner blocks so it can be
	// applied to the pattern's wrapper.
	$widest_alignment  = null;
	$filter_alignments = static function( $parsed_block, $source_block, $parent_block ) use ( &$widest_alignment ) {
		// If this isn't a top level block in the pattern or we have already
		// determined that we have a full aligned block, skip it.
		if ( isset( $parent_block ) || 'full' === $widest_alignment ) {
			return $parsed_block;
		}

		$alignment       = _wp_array_get( $parsed_block, array( 'attrs', 'align' ), null );
		$full_alignments = array( 'full', 'left', 'right' );

		if ( in_array( $alignment, $full_alignments, true ) ) {
			$widest_alignment = 'full';
			return $parsed_block;
		}

		if ( 'wide' === $alignment ) {
			$widest_alignment = $alignment;
		}

		return $parsed_block;
	};

	// Only need to add the render_block_data filter when the pattern has saved
	// a wrapper element in its block content.
	if ( $block_content ) {
		add_filter( 'render_block_data', $filter_alignments, 10, 3 );
	}

	// Handle embeds for reusable blocks.
	global $wp_embed;

	$content = $wp_embed->run_shortcode( $reusable_block->post_content );
	$content = $wp_embed->autoembed( $content );
	$content = do_blocks( $content );

	unset( $seen_refs[ $attributes['ref'] ] );

	// Older block versions used only the post's content without incorporating
	// the editor's wrapper. Newer versions added a wrapper through saved
	// markup, so utilize it to return only the post's content when appropriate.
	if ( ! $block_content ) {
		return $content;
	}

	remove_filter( 'render_block_data', $filter_alignments, 10 );

	$processor = new WP_HTML_Tag_Processor( $block_content );
	$processor->next_tag();

	// Apply the alignment class to the original block content so its all
	// copied across to the result with other classes etc.
	if ( null !== $widest_alignment ) {
		$processor->add_class( 'align' . $widest_alignment );
	}

	$tag_name = $processor->get_tag();
	$markup   = "<$tag_name>$content</$tag_name>";

	$merged_content = new WP_HTML_Tag_Processor( $markup );
	$merged_content->next_tag();

	// Get all the attributes from the original block content and add them to
	// the new markup.
	$names = $processor->get_attribute_names_with_prefix( '' );
	foreach ( $names as $name ) {
		$merged_content->set_attribute( $name, $processor->get_attribute( $name ) );
	}

	return $merged_content->get_updated_html();
}

/**
 * Registers the `core/block` block.
 */
function register_block_core_block() {
	register_block_type_from_metadata(
		__DIR__ . '/block',
		array(
			'render_callback' => 'render_block_core_block',
		)
	);
}
add_action( 'init', 'register_block_core_block' );

/**
 * Filter to short circuit rendering of old deprecated pattern blocks which
 * haven't any saved content and need to skip any application of block supports.
 *
 * @param string|null $pre_render The pre-rendered content. Default null.
 * @param array       $block      The block being rendered.
 *
 * @return string|null;
 */
function block_core_block_pre_render( $pre_render, $block ) {
	if ( 'core/block' !== $block['blockName'] ) {
		return null;
	}

	$attributes = _wp_array_get( $block, array( 'attrs' ), array() );
	$inner_html = _wp_array_get( $block, array( 'innerHTML' ), null );

	// Pattern's without wrappers will not have saved inner HTML and need to
	// avoid layout supports applied via render_block.
	if ( $inner_html ) {
		return null;
	}

	return render_block_core_block( $attributes, $inner_html );
}

add_filter( 'pre_render_block', 'block_core_block_pre_render', 10, 2 );
