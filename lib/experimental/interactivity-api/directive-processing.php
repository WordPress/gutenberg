<?php
/**
 * Functions and hooks to process the server side rendering of the Interactivity
 * API directives.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

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
		$processed_content = '';
		$parsed_blocks     = parse_blocks( $block_content );
		$context           = new WP_Directive_Context();
		foreach ( $parsed_blocks as $parsed_block ) {
			if ( 'core/interactivity-wrapper' === $parsed_block['blockName'] ) {
				$processed_content .= gutenberg_process_interactive_block( $parsed_block, $context );
			} elseif ( 'core/non-interactivity-wrapper' === $parsed_block['blockName'] ) {
				$processed_content .= gutenberg_process_non_interactive_block( $parsed_block, $context );
			} else {
				$processed_content .= $parsed_block['innerHTML'];
			}
		}
		return $processed_content;

	}

	return $block_content;
}
add_filter( 'render_block', 'gutenberg_process_directives_in_root_blocks', 20, 2 );

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
		WP_Directive_Processor::unmark_children_of_interactive_block( $block );
		// Mark children of interactive blocks that are not interactive themselves
		// to so we can skip them later.
		return get_comment_delimited_block_content(
			'core/non-interactivity-wrapper',
			array(
				'blockName' => $block['blockName'],
				// We can put extra information about the block here.
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
	$path                = $should_negate_value ? substr( $path, 1 ) : $path;
	$path_segments       = explode( '.', $path );
	$current             = $store;
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

/**
 * Traverses the HTML of an interactive block,
 * searching for Interactivity API directives and processing them.
 *
 * @param array $interactive_block The interactive block to process.
 *
 * @return string The processed HTML.
 */
function gutenberg_process_interactive_block( $interactive_block, $context ) {
	$block_index              = 0;
	$content                  = '';
	$interactive_inner_blocks = array();
	foreach ( $interactive_block['innerContent'] as $inner_content ) {
		if ( is_string( $inner_content ) ) {
			$content .= $inner_content;
		} else {
			// This is an inner block. It may be an interactive block or a
			// non-interactive block. Not sure if autoclosed custom tags are supported in HTML_Tag_Processor.
			$content                   .= '<wp-inner-blocks-' . $block_index . '></wp-inner-blocks-' . $block_index . '>';
			$interactive_inner_blocks[] = $interactive_block['innerBlocks'][ $block_index ];
			$block_index               += 1;
		}
	}
	$content = gutenberg_process_interactive_html( $content, $interactive_inner_blocks, $context );
	return $content;
}

/**
 * Traverses the HTML of a non-interactive block,
 * skipping the processing and returning the content.
 * For the inner blocks, it calls the corresponding function
 * depending on the wrapper type.
 *
 * @param array $non_interactive_block The non-interactive block to process.
 *
 * @return string The processed HTML.
 */
function gutenberg_process_non_interactive_block( $non_interactive_block, $context ) {
	$block_index = 0;
	$content     = '';
	foreach ( $non_interactive_block['innerContent'] as $inner_content ) {
		if ( is_string( $inner_content ) ) {
			// This content belongs to a non interactive block and therefore it cannot
			// contain directives. We add the HTML directly to the final output.
			$content .= $inner_content;
		} else {
			// This is an inner block. It may be an interactive block or a
			// non-interactive block.
			$inner_block  = $non_interactive_block['innerBlocks'][ $block_index ];
			$block_index += 1;

			if ( 'core/interactivity-wrapper' === $inner_block['blockName'] ) {
				$content .= gutenberg_process_interactive_block( $inner_block, $context );
			} elseif ( 'core/non-interactivity-wrapper' === $inner_block['blockName'] ) {
				$content .= gutenberg_process_non_interactive_block( $inner_block, $context );
			}
		}
	}
	return $content;
}


function gutenberg_process_interactive_html( $html, $inner_blocks, $context ) {
	$tags                   = new WP_Directive_Processor( $html );
	$prefix                 = 'data-wp-';
	$directives             = array(
		'data-wp-bind'    => 'gutenberg_interactivity_process_wp_bind',
		'data-wp-context' => 'gutenberg_interactivity_process_wp_context',
		'data-wp-class'   => 'gutenberg_interactivity_process_wp_class',
		'data-wp-style'   => 'gutenberg_interactivity_process_wp_style',
		'data-wp-text'    => 'gutenberg_interactivity_process_wp_text',
	);
	$tag_stack              = array();
	$inner_processed_blocks = array();

	while ( $tags->next_tag( array( 'tag_closers' => 'visit' ) ) ) {
		$tag_name = $tags->get_tag();
		if ( ! isset( $inner_blocks_index ) ) {
			$inner_blocks_index = 0;
		}
		if ( str_contains( $tag_name, 'WP-INNER-BLOCKS' ) && ! empty( $inner_blocks ) && ! $tags->is_tag_closer() ) {
			// Process the inner blocks.
			$inner_block_content = '';
			foreach ( $inner_blocks[ $inner_blocks_index ]['innerContent'] as $inner_content ) {
				$inner_block_content = gutenberg_process_interactive_html( $inner_content, $inner_blocks[ $inner_blocks_index ]['innerBlocks'], $context );
			}
			$inner_processed_blocks[ strtolower( $tag_name ) ] = $inner_block_content;
			$inner_blocks_index                               += 1;
		}
		if ( $tags->is_tag_closer() ) {
			if ( 0 === count( $tag_stack ) ) {
				continue;
			}
			list( $latest_opening_tag_name, $attributes ) = end( $tag_stack );
			if ( $latest_opening_tag_name === $tag_name ) {
				array_pop( $tag_stack );
				// If the matching opening tag didn't have any directives, we move on.
				if ( 0 === count( $attributes ) ) {
					continue;
				}
			}
		} else {
			$attributes = array();
			foreach ( $tags->get_attribute_names_with_prefix( $prefix ) as $name ) {
				/*
				 * Removes the part after the double hyphen before looking for
				 * the directive processor inside `$directives`, e.g., "wp-bind"
				 * from "wp-bind--src" and "wp-context" from "wp-context" etc...
				 */
				list( $type ) = $tags::parse_attribute_name( $name );
				if ( array_key_exists( $type, $directives ) ) {
					$attributes[] = $type;
				}
			}

			/*
			 * If this is an open tag, and if it either has directives, or if
			 * we're inside a tag that does, take note of this tag and its
			 * directives so we can call its directive processor once we
			 * encounter the matching closing tag.
			 */
			if (
			! $tags::is_html_void_element( $tags->get_tag() ) &&
			( 0 !== count( $attributes ) || 0 !== count( $tag_stack ) )
			) {
				$tag_stack[] = array( $tag_name, $attributes );
			}
		}

		foreach ( $attributes as $attribute ) {
			call_user_func( $directives[ $attribute ], $tags, $context );
		}
	}
	$processed_html = $tags->get_updated_html();
	if ( ! empty( $inner_processed_blocks ) ) {
		foreach ( $inner_processed_blocks as $inner_block_tag => $inner_block_content ) {
			if ( str_contains( $processed_html, $inner_block_tag ) ) {
				$processed_html = str_replace( '<' . $inner_block_tag . '></' . $inner_block_tag . '>', $inner_block_content, $processed_html );
			}
		}
	}
	return $processed_html;
}
