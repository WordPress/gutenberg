<?php
/**
 * Server-side rendering of the `core/pattern` block.
 *
 * @package WordPress
 */

/**
 *  Registers the `core/pattern` block on the server.
 *
 * @return void
 */
function register_block_core_pattern_template() {
	register_block_type_from_metadata(
		__DIR__ . '/pattern-template',
		array(
			'render_callback' => 'render_block_core_pattern_template',
		)
	);
}

/**
 * Replaces token blocks with the matching placeholder block.
 *
 * @param WP_Block_List $content_block      The content inner blocks.
 * @param array         $placeholder_blocks The block's content.
 *
 * @return WP_Block_List The compiled block list.
 */
function block_core_pattern_template_replace_content_tokens_with_placeholder_blocks( $content_block, $placeholder_blocks ) {
	$content_blocks              = $content_block->inner_blocks;
	static $placeholder_position = 0;

	// If there are no blocks, there's nothing to do.
	if ( 0 === count( $content_blocks ) ) {
		return $content_blocks;
	}

	foreach ( $content_blocks as $index => $inner_block ) {
		// Recurse and update any inner blocks of this block first.
		if ( count( $inner_block->inner_blocks ) ) {
			block_core_pattern_template_replace_content_tokens_with_placeholder_blocks( $inner_block, $placeholder_blocks );
		}

		// If this is a token, replace it with the placeholder that's in this position.
		if ( 'core/pattern-template-token' === $inner_block->name ) {
			if ( isset( $placeholder_blocks[ $placeholder_position ] ) ) {
				// TODO - it might be better to create a new inner blocks list instead of overwriting the existing one.
				$content_blocks[ $index ] = $placeholder_blocks[ $placeholder_position ];
				$placeholder_position     = $placeholder_position + 1;
			}
		}
	}
}

/**
 * Renders the `core/pattern` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    The block's content.
 * @param WP_Block $block      The WP_Block object.
 *
 * @return string Returns the output of the pattern template.
 */
function render_block_core_pattern_template( $attributes, $content, $block ) {
	$inner_blocks = $block->inner_blocks;

	$content_block       = null;
	$placeholders_blocks = array();

	foreach ( $inner_blocks as $inner_block ) {
		if ( 'core/pattern-template-content' === $inner_block->name ) {
			$content_block = $inner_block;
		} else {
			array_push( $placeholders_blocks, $inner_block );
		}
	}

	block_core_pattern_template_replace_content_tokens_with_placeholder_blocks( $content_block, $placeholders_blocks );

	$compiled_content = '';

	foreach ( $content_block->inner_blocks as $inner_block ) {
		$compiled_content .= $inner_block->render();
	}

	return $compiled_content;
}

add_action( 'init', 'register_block_core_pattern_template' );
