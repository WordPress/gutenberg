<?php
/**
 * Functions and hooks to process the server side rendering of the Interactivity
 * API directives.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

global $children_of_interactive_block;
$children_of_interactive_block = array();
/**
 * Mark if the block is a root block. Checks that there is already a root block
 * in order not to mark template-parts or synced patterns as root blocks, where
 * the parent is null.
 *
 * @param array $parsed_block The parsed block.
 * @param array $source_block The source block.
 * @param array $parent_block The parent block.
 *
 * @return array The parsed block.
 */
function gutenberg_interactivity_mark_root_blocks( $parsed_block, $source_block, $parent_block ) {
	if ( ! isset( $parent_block ) && ! WP_Directive_Processor::has_root_block() ) {
		WP_Directive_Processor::mark_root_block( $parsed_block );
	}

	return $parsed_block;
}
add_filter( 'render_block_data', 'gutenberg_interactivity_mark_root_blocks', 10, 3 );

/**
 * Process directives in each root block.
 *
 * @param string $block_content The block content.
 * @param array  $block         The full block.
 *
 * @return string Filtered block content.
 */
function gutenberg_process_directives_in_root_blocks( $block_content, $block ) {
	if ( WP_Directive_Processor::is_marked_as_root_block( $block ) ) {
		WP_Directive_Processor::unmark_root_block();
		$directives = array(
			'data-wp-bind'    => 'gutenberg_interactivity_process_wp_bind',
			'data-wp-context' => 'gutenberg_interactivity_process_wp_context',
			'data-wp-class'   => 'gutenberg_interactivity_process_wp_class',
			'data-wp-style'   => 'gutenberg_interactivity_process_wp_style',
			'data-wp-text'    => 'gutenberg_interactivity_process_wp_text',
		);

		$tags = new WP_Directive_Processor( $block_content );
		$tags = $tags->process_rendered_html( $tags, 'data-wp-', $directives );
		return $tags->get_updated_html();

	}

	return $block_content;
}
add_filter( 'render_block', 'gutenberg_process_directives_in_root_blocks', 10, 2 );

/**
 * Creates a stack of interactive block children.
 *
 * @param array    $parsed_block The parsed block.
 * @param array    $source_block The source block.
 * @param WP_Block $parent_block The parent block.
 */
function gutenberg_mark_interactive_block_children( $parsed_block, $source_block, $parent_block ) {
	if (
			isset( $parent_block ) &&
			isset( $parent_block->block_type->supports['interactivity'] ) &&
			$parent_block->block_type->supports['interactivity']
		) {
		WP_Directive_Processor::mark_children_of_interactive_block( $source_block );
	}
	return $parsed_block;
}
add_filter( 'render_block_data', 'gutenberg_mark_interactive_block_children', 100, 3 );

/**
 * Add a marker indicating if the block is interactive or not.
 * core/interactivity-wrapper if it is interactive.
 * core/non-interactivity-wrapper if it is not interactive.
 *
 * @param string   $block_content The block content.
 * @param array    $block The full block, including name and attributes.
 * @param WP_Block $block_instance The block instance.
 */
function gutenberg_mark_block_interactivity( $block_content, $block, $block_instance ) {
	if (
			isset( $block_instance->block_type->supports['interactivity'] ) &&
			$block_instance->block_type->supports['interactivity']
		) {
		// Mark interactive blocks so we can process them later.
		return get_comment_delimited_block_content(
			'core/interactivity-wrapper',
			array(
				'blockName' => $block['blockName'],
				// We can put extra information about the block here.
			),
			$block_content
		);
	} elseif ( WP_Directive_Processor::is_marked_as_children_of_interactive_block( $block ) ) {
		// Mark children of interactive blocks that are not interactive themselves
		// to so we can skip them later.
		WP_Directive_Processor::unmark_children_of_interactive_block();

		/**
		 * Debugging purposes only. Nested comments are not allowed.
		 * We wrap a hidden textarea to save the block content delimited
		 * by comments so we can later process it.
		 */
		return sprintf(
			'<textarea style="display:none"> %1s </textarea> %2s',
			get_comment_delimited_block_content(
				'core/non-interactivity-wrapper',
				array(
					'blockName' => $block['blockName'],
				// We can put extra information about the block here.
				),
				$block_content
			),
			$block_content
		);
	}

		return $block_content;
}

add_filter( 'render_block', 'gutenberg_mark_block_interactivity', 10, 3 );

/**
 * Resolve the reference using the store and the context from the provided path.
 *
 * @param string $path Path.
 * @param array  $context Context data.
 * @return mixed
 */
function gutenberg_interactivity_evaluate_reference( $path, array $context = array() ) {
	$store = array_merge(
		WP_Interactivity_Store::get_data(),
		array( 'context' => $context )
	);

	/*
	 * Check first if the directive path is preceded by a negator operator (!),
	 * indicating that the value obtained from the Interactivity Store (or the
	 * passed context) using the subsequent path should be negated.
	 */
	$should_negate_value = '!' === $path[0];

	$path          = $should_negate_value ? substr( $path, 1 ) : $path;
	$path_segments = explode( '.', $path );
	$current       = $store;
	foreach ( $path_segments as $p ) {
		if ( isset( $current[ $p ] ) ) {
			$current = $current[ $p ];
		} else {
			return null;
		}
	}

	/*
	 * Check if $current is an anonymous function or an arrow function, and if
	 * so, call it passing the store. Other types of callables are ignored on
	 * purpose, as arbitrary strings or arrays could be wrongly evaluated as
	 * "callables".
	 *
	 * E.g., "file" is an string and a "callable" (the "file" function exists).
	 */
	if ( $current instanceof Closure ) {
		$current = call_user_func( $current, $store );
	}

	// Return the opposite if it has a negator operator (!).
	return $should_negate_value ? ! $current : $current;
}
