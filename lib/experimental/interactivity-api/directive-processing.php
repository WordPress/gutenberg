<?php
/**
 * Functions and hooks to process the server side rendering of the Interactivity
 * API directives.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */
function gutenberg_interactivity_process_directives( $p ) {
	$prefix     = 'data-wp-';
	$context    = new WP_Directive_Context();
	$tag_stack  = array();
	$directives = array(
		'data-wp-bind'    => 'gutenberg_interactivity_process_wp_bind',
		'data-wp-context' => 'gutenberg_interactivity_process_wp_context',
		'data-wp-class'   => 'gutenberg_interactivity_process_wp_class',
		'data-wp-style'   => 'gutenberg_interactivity_process_wp_style',
		'data-wp-text'    => 'gutenberg_interactivity_process_wp_text',
	);

	while ( $p->next_tag( array( 'tag_closers' => 'visit' ) ) ) {
		$tag_name = $p->get_tag();

		// Is this a tag that closes the latest opening tag?
		if ( $p->is_tag_closer() ) {
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
			foreach ( $p->get_attribute_names_with_prefix( $prefix ) as $name ) {
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
				! WP_Directive_Processor::is_html_void_element( $p->get_tag() ) &&
				( 0 !== count( $attributes ) || 0 !== count( $tag_stack ) )
			) {
				$tag_stack[] = array( $tag_name, $attributes );
			}
		}

		foreach ( $attributes as $attribute ) {
			call_user_func( $directives[ $attribute ], $p, $context );
		}
	}

	return $p;
}

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

global $children_of_interactive_block;
$children_of_interactive_block = array();

// Store references to all children of interactive blocks.
add_filter(
	'render_block_data',
	function ( $parsed_block, $source_block, $parent_block ) {
		global $children_of_interactive_block;
		if (
			isset( $parent_block ) &&
			isset( $parent_block->block_type->supports['interactivity'] ) &&
			$parent_block->block_type->supports['interactivity']
		) {
			$children_of_interactive_block[] = &$source_block;
		}
		return $parsed_block;
	},
	100,
	3
);

add_filter(
	'render_block',
	function ( $block_content, $block, $block_instance ) {
		global $children_of_interactive_block;

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
		} elseif ( in_array( $block, $children_of_interactive_block, true ) ) {
			// Mark children of interactive blocks that are not interactive themselves
			// to so we can skip them later.
			return get_comment_delimited_block_content(
				'core/non-interactivity-wrapper',
				array(),
				$block_content
			);
		}

		return $block_content;
	},
	10,
	3
);

global $do_block_calls;
$do_block_calls = 0;

add_filter(
	'do_blocks_pre_render',
	function ( $blocks ) {
		global $do_block_calls;
		$do_block_calls += 1;
		return $blocks;
	}
);

add_filter(
	'do_blocks_post_render',
	function ( $content ) {
		global $do_block_calls;
		$do_block_calls -= 1;

		if ( 0 === $do_block_calls ) {
			$parsed_blocks     = parse_blocks( $content );
			$processed_content = '';
			$p                 = WP_HTML_Processor::createFragment( '' );

			foreach ( $parsed_blocks as $parsed_block ) {
				if ( 'core/interactivity-wrapper' === $parsed_block['blockName'] ) {
					$processed_content .= gutenberg_process_interactive_block( $parsed_block, $p );
				} elseif ( 'core/non-interactivity-wrapper' === $parsed_block['blockName'] ) {
					$processed_content .= gutenberg_process_non_interactive_block( $parsed_block, $p );
				}
			}

			if ( null === $p->get_last_error() ) {
				$content = $processed_content;
			}
		}

		return $content;
	}
);

function gutenberg_process_interactive_block( $interactive_block, $p ) {
	$block_index = 0;
	$content     = '';

	foreach ( $interactive_block['innerContent'] as $inner_content ) {
		if ( is_string( $inner_content ) ) {
			// This content belongs to an interactive block and therefore can contain
			// directives.
			$p->extend_input( $inner_content );
			while ( $p->next_tag() ) {
				// Process the directives.
				gutenberg_interactivity_process_directives( $p );
			}
			// Return only the last extended html.
			$content .= $p->get_last_extended_html();
		} else {
			// This is an inner block. It may be an interactive block or a
			// non-interactive block.
			$inner_block  = $interactive_block['innerBlock'][ $block_index ];
			$block_index += 1;

			if ( 'core/interactivity-wrapper' === $inner_block['blockName'] ) {
				$content .= gutenberg_process_interactive_block( $inner_block, $p );
			} elseif ( 'core/non-interactivity-wrapper' === $inner_block['blockName'] ) {
				$content .= gutenberg_process_non_interactive_block( $inner_block, $p );
			}
		}
	}
	return $content;
}

function gutenberg_process_non_interactive_block( $non_interactive_block, $p ) {
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
			$inner_block  = $non_interactive_block['innerBlock'][ $block_index ];
			$block_index += 1;

			if ( 'core/interactivity-wrapper' === $inner_block['blockName'] ) {
				$content .= gutenberg_process_interactive_block( $inner_block, $p );
			} elseif ( 'core/non-interactivity-wrapper' === $inner_block['blockName'] ) {
				$content .= gutenberg_process_non_interactive_block( $inner_block, $p );
			}
		}
	}
	return $content;
}
