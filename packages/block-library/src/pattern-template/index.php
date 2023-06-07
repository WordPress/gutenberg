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
 * Inserts the corresponding 'value' block into the template when a token is encountered.
 *
 * @param WP_Block_List $content_block The content inner blocks.
 * @param array         $value_blocks  The value blocks to insert into the template.
 *
 * @return WP_Block_List The compiled block list.
 */
function block_core_pattern_template_insert_value_blocks_into_content( $content_block, $value_blocks, $token_position = 0 ) {
	$compiled_inner_blocks = array();

	// TODO - try turning this into a `while( $next_block )` loop.
	foreach ( $content_block->inner_blocks as $inner_block ) {
		// If this is a token, replace it with the placeholder that's in this position.
		if ( 'core/pattern-template-token' === $inner_block->name ) {
			if ( isset( $value_blocks[ $token_position ] ) ) {
				$value_block          = $value_blocks[ $token_position ];
				$result               = block_core_pattern_template_insert_value_blocks_into_content( $inner_block, $value_blocks, $token_position );
				$updated_inner_blocks = $result['blocks'];
				$token_position       = $result['token_position'];
				$updated_parsed_block = array_merge( $value_block->parsed_block, array( 'inner_blocks' => $updated_inner_blocks ) );
				$updated_block        = new WP_Block( $updated_parsed_block );
				array_push( $compiled_inner_blocks, $updated_block );
				$token_position = $token_position + 1;
			} else {
				$result               = block_core_pattern_template_insert_value_blocks_into_content( $inner_block, $value_blocks, $token_position );
				$updated_inner_blocks = $result['blocks'];
				$token_position       = $result['token_position'];
				$updated_parsed_block = array_merge( $inner_block->parsed_block, array( 'inner_blocks' => $updated_inner_blocks ) );
				$updated_block        = new WP_Block( $updated_parsed_block );
				array_push( $compiled_inner_blocks, $updated_block );
			}
		} else {
			$result               = block_core_pattern_template_insert_value_blocks_into_content( $inner_block, $value_blocks, $token_position );
			$updated_inner_blocks = $result['blocks'];
			$token_position       = $result['token_position'];
			$updated_parsed_block = array_merge( $inner_block->parsed_block, array( 'inner_blocks' => $updated_inner_blocks ) );
			$updated_block        = new WP_Block( $updated_parsed_block );
			array_push( $compiled_inner_blocks, $updated_block );
		}
	}

	return array(
		'blocks'         => $compiled_inner_blocks,
		'token_position' => $token_position,
	);
}

/**
 * Finds a 'core/pattern-template-content' in a hierarchy of blocks.
 *
 * @param WP_Block[] $blocks A hierarchy of blocks.
 *
 * @return WP_Block The 'core/pattern-template-content' block found within the block hierarchy.
 */
function block_core_pattern_template_get_template_content( $blocks ) {
	foreach ( $blocks as $block ) {
		// If a nested template is found, search its inner blocks.
		if ( 'core/pattern-template' === $block->name ) {
			return block_core_pattern_template_get_template_content( $block->inner_blocks );
		}

		// If a template content block is found at this level return it.
		if ( 'core/pattern-template-content' === $block->name ) {
			return $block;
		}
	}
}

/**
 * Produces a list of template 'value' blocks from a hierarchy of blocks.
 *
 * @param WP_Block[] $blocks A hierarchy of blocks.
 *
 * @return WP_Block[] An array of value blocks found within the block hierarchy.
 */
function block_core_pattern_template_get_template_values( $blocks ) {
	$values = array();

	// If a nested template block is found at this level recurse down and get the children values.
	foreach ( $blocks as $block ) {
		if ( 'core/pattern-template' === $block->name ) {
			$values = block_core_pattern_template_get_template_values( $block->inner_blocks );
		}
	}

	// As the recursive function unwinds, it'll set the $values for the deepest template first,
	// then override those with the values from the next level up, until finally it reaches the
	// top-level, overriding with the top-most values.
	$index = 0;
	foreach ( $blocks as $block ) {
		// If a template content block is found at this level return it.
		if ( 'core/pattern-template-content' !== $block->name && 'core/pattern-template' !== $block->name ) {
			$values[ $index ] = $block;
			$index            = $index + 1;
		}
	}

	return $values;
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

	$content_block = block_core_pattern_template_get_template_content( $inner_blocks );
	$value_blocks  = block_core_pattern_template_get_template_values( $inner_blocks );

	$result = block_core_pattern_template_insert_value_blocks_into_content( $content_block, $value_blocks );

	$compiled_content = '';
	foreach ( $result['blocks'] as $inner_block ) {
		$compiled_content .= $inner_block->render();
	}

	return $compiled_content;
}

add_action( 'init', 'register_block_core_pattern_template' );
