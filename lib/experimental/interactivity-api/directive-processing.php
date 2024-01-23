<?php
/**
 * Functions and hooks to process the Interactivity API directives in the
 * server.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Marks the block as a root block. Checks that there is already a root block in
 * order not to mark template-parts or synced patterns as root blocks, where the
 * parent is null.
 *
 * @param array $parsed_block The parsed block.
 *
 * @return array The parsed block.
 */
function gutenberg_interactivity_mark_root_interactive_blocks( $parsed_block ) {
	if ( ! WP_Directive_Processor::has_interactive_root_block() ) {
		$block_type     = WP_Block_Type_Registry::get_instance()->get_registered( $parsed_block['blockName'] );
		$is_interactive = isset( $block_type->supports['interactivity'] ) && $block_type->supports['interactivity'];
		if ( $is_interactive ) {
			WP_Directive_Processor::mark_interactive_root_block( $parsed_block );
		}
	}

	return $parsed_block;
}
add_filter( 'render_block_data', 'gutenberg_interactivity_mark_root_interactive_blocks', 10, 1 );

/**
 * Processes the directives in the root blocks.
 *
 * @param string $block_content The block content.
 * @param array  $block         The full block.
 *
 * @return string Filtered block content.
 */
function gutenberg_process_directives_in_root_blocks( $block_content, $block ) {
	if ( WP_Directive_Processor::is_marked_as_interactive_root_block( $block ) ) {
		WP_Directive_Processor::unmark_interactive_root_block();
		$context         = new WP_Directive_Context();
		$namespace_stack = array();
		return gutenberg_process_interactive_html( $block_content, $context, $namespace_stack );
	}

	return $block_content;
}
add_filter( 'render_block', 'gutenberg_process_directives_in_root_blocks', 10, 2 );

/**
 * Processes interactive HTML by applying directives to the HTML tags.
 *
 * It uses the WP_Directive_Processor class to parse the HTML and apply the
 * directives. If a tag contains a 'WP-INNER-BLOCKS' string and there are inner
 * blocks to process, the function processes these inner blocks and replaces the
 * 'WP-INNER-BLOCKS' tag in the HTML with those blocks.
 *
 * @param string $html The HTML to process.
 * @param mixed  $context The context to use when processing.
 * @param array  $inner_blocks The inner blocks to process.
 * @param array  $namespace_stack Stack of namespackes passed by reference.
 *
 * @return string The processed HTML.
 */
function gutenberg_process_interactive_html( $html, $context, &$namespace_stack = array() ) {
	static $directives = array(
		'data-wp-interactive' => 'gutenberg_interactivity_process_wp_interactive',
		'data-wp-context'     => 'gutenberg_interactivity_process_wp_context',
		'data-wp-bind'        => 'gutenberg_interactivity_process_wp_bind',
		'data-wp-class'       => 'gutenberg_interactivity_process_wp_class',
		'data-wp-style'       => 'gutenberg_interactivity_process_wp_style',
		'data-wp-text'        => 'gutenberg_interactivity_process_wp_text',
	);

	$tags      = new WP_Directive_Processor( $html );
	$prefix    = 'data-wp-';
	$tag_stack = array();
	while ( $tags->next_tag( array( 'tag_closers' => 'visit' ) ) ) {
		$tag_name = $tags->get_tag();

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
				! $tags::is_html_void_element( $tag_name ) &&
				( 0 !== count( $attributes ) || 0 !== count( $tag_stack ) )
			) {
				$tag_stack[] = array( $tag_name, $attributes );
			}
		}

		// Extract all directive names. They'll be used later on.
		$directive_names     = array_keys( $directives );
		$directive_names_rev = array_reverse( $directive_names );

		/*
		 * Sort attributes by the order they appear in the `$directives`
		 * argument, considering it as the priority order in which
		 * directives should be processed. Note that the order is reversed
		 * for tag closers.
		 */
		$sorted_attrs = array_intersect(
			$tags->is_tag_closer()
				? $directive_names_rev
				: $directive_names,
			$attributes
		);

		foreach ( $sorted_attrs as $attribute ) {
			call_user_func_array(
				$directives[ $attribute ],
				array(
					$tags,
					$context,
					end( $namespace_stack ),
					&$namespace_stack,
				)
			);
		}
	}

	return $tags->get_updated_html();
}

/**
 * Resolves the passed reference from the store and the context under the given
 * namespace.
 *
 * A reference could be either a single path or a namespace followed by a path,
 * separated by two colons, i.e, `namespace::path.to.prop`. If the reference
 * contains a namespace, that namespace overrides the one passed as argument.
 *
 * @param string $reference Reference value.
 * @param string $ns Inherited namespace.
 * @param array  $context Context data.
 * @return mixed Resolved value.
 */
function gutenberg_interactivity_evaluate_reference( $reference, $ns, array $context = array() ) {
	// Extract the namespace from the reference (if present).
	list( $ns, $path ) = WP_Directive_Processor::parse_attribute_value( $reference, $ns );

	$store = array(
		'state'   => WP_Interactivity_Initial_State::get_state( $ns ),
		'context' => $context[ $ns ] ?? array(),
	);

	/*
	 * Checks first if the directive path is preceded by a negator operator (!),
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
	 * Checks if $current is an anonymous function or an arrow function, and if
	 * so, call it passing the store. Other types of callables are ignored on
	 * purpose, as arbitrary strings or arrays could be wrongly evaluated as
	 * "callables".
	 *
	 * E.g., "file" is an string and a "callable" (the "file" function exists).
	 */
	if ( $current instanceof Closure ) {
		/*
		 * TODO: Figure out a way to implement derived state without having to
		 * pass the store as argument:
		 *
		 * $current = call_user_func( $current );
		 */
	}

	// Returns the opposite if it has a negator operator (!).
	return $should_negate_value ? ! $current : $current;
}
