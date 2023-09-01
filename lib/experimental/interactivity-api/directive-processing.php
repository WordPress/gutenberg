<?php
/**
 * Functions and hooks to process the server side rendering of the Interactivity
 * API directives.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Process directives in each block.
 *
 * @param string $block_content The block content.
 * @param array  $block         The full block.
 *
 * @return string Filtered block content.
 */
function gutenberg_interactivity_process_directives_in_root_blocks( $block_content, $block ) {
	// Don't process inner blocks or root blocks that don't contain directives.
	if ( ! WP_Directive_Processor::is_root_block( $block ) || strpos( $block_content, 'data-wp-' ) === false ) {
		return $block_content;
	}

	// TODO: Add some directive/components registration mechanism.
	$directives = array(
		'data-wp-bind'    => 'gutenberg_interactivity_process_wp_bind',
		'data-wp-context' => 'gutenberg_interactivity_process_wp_context',
		'data-wp-class'   => 'gutenberg_interactivity_process_wp_class',
		'data-wp-style'   => 'gutenberg_interactivity_process_wp_style',
		'data-wp-text'    => 'gutenberg_interactivity_process_wp_text',
	);

	$tags = new WP_Directive_Processor( $block_content );
	$tags = gutenberg_interactivity_process_directives( $tags, 'data-wp-', $directives );
	return $tags->get_updated_html();
}
add_filter( 'render_block', 'gutenberg_interactivity_process_directives_in_root_blocks', 10, 2 );

/**
 * Mark the inner blocks with a temporary property so we can discard them later,
 * and process only the root blocks.
 *
 * @param array $parsed_block The parsed block.
 * @param array $source_block The source block.
 * @param array $parent_block The parent block.
 *
 * @return array The parsed block.
 */
function gutenberg_interactivity_mark_inner_blocks( $parsed_block, $source_block, $parent_block ) {
	if ( ! isset( $parent_block ) ) {
		WP_Directive_Processor::add_root_block( $parsed_block );
	}
	return $parsed_block;
}
add_filter( 'render_block_data', 'gutenberg_interactivity_mark_inner_blocks', 10, 3 );

/**
 * Process directives.
 *
 * @param WP_Directive_Processor $tags An instance of the WP_Directive_Processor.
 * @param string                 $prefix Attribute prefix.
 * @param string[]               $directives Directives.
 *
 * @return WP_Directive_Processor The modified instance of the
 * WP_Directive_Processor.
 */
function gutenberg_interactivity_process_directives( $tags, $prefix, $directives ) {
	$context   = new WP_Directive_Context;
	$tag_stack = array();

	while ( $tags->next_tag( array( 'tag_closers' => 'visit' ) ) ) {
		$tag_name = $tags->get_tag();

		// Is this a tag that closes the latest opening tag?
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
				list( $type ) = WP_Directive_Processor::parse_attribute_name( $name );
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
				! WP_Directive_Processor::is_html_void_element( $tags->get_tag() ) &&
				( 0 !== count( $attributes ) || 0 !== count( $tag_stack ) )
			) {
				$tag_stack[] = array( $tag_name, $attributes );
			}
		}

		foreach ( $attributes as $attribute ) {
			call_user_func( $directives[ $attribute ], $tags, $context );
		}
	}

	return $tags;
}

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
