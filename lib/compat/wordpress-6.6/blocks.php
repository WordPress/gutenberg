<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Replace the `__default` block bindings attribute with the full list of supported
 * attribute names for pattern overrides.
 *
 * @param array $parsed_block The full block, including name and attributes.
 *
 * @return string The parsed block with default binding replace.
 */
function gutenberg_replace_pattern_override_default_binding( $parsed_block ) {
	$supported_block_attrs = array(
		'core/paragraph' => array( 'content' ),
		'core/heading'   => array( 'content' ),
		'core/image'     => array( 'id', 'url', 'title', 'alt', 'caption' ),
		'core/button'    => array( 'url', 'text', 'linkTarget', 'rel' ),
	);

	$bindings = $parsed_block['attrs']['metadata']['bindings'] ?? array();
	if (
		isset( $bindings['__default']['source'] ) &&
		'core/pattern-overrides' === $bindings['__default']['source']
	) {
		$updated_bindings = array();

		// Build an binding array of all supported attributes.
		// Note that this also omits the `__default` attribute from the
		// resulting array.
		foreach ( $supported_block_attrs[ $parsed_block['blockName'] ] as $attribute_name ) {
			// Retain any non-pattern override bindings that might be present.
			$updated_bindings[ $attribute_name ] = isset( $bindings[ $attribute_name ] )
				? $bindings[ $attribute_name ]
				: array( 'source' => 'core/pattern-overrides' );
		}
		$parsed_block['attrs']['metadata']['bindings'] = $updated_bindings;
	}

	return $parsed_block;
}

add_filter( 'render_block_data', 'gutenberg_replace_pattern_override_default_binding', 10, 1 );

// Only process block bindings if they are not processed in core.
if ( ! is_wp_version_compatible( '6.6' ) ) {
	/**
	 * Replace the caption value in the HTML based on the binding value.
	 *
	 * @param string $block_content  Block Content.
	 * @param string $block_name     The name of the block to process.
	 * @param string $attribute_name The attribute name to replace.
	 * @param mixed  $source_value   The value used to replace in the HTML.
	 * @return string The modified block content.
	 */
	function gutenberg_block_bindings_replace_caption( $block_content, $block_name, string $attribute_name, $source_value ) {
		// Create private anonymous class until the HTML API provides `set_inner_html` method.
		$block_reader = new class($block_content) extends WP_HTML_Tag_Processor{
			/**
			 * THESE METHODS ARE A TEMPORARY SOLUTION NOT TO BE EMULATED.
			 * IT IS A TEMPORARY SOLUTION THAT JUST WORKS FOR THIS SPECIFIC
			 * USE CASE UNTIL THE HTML PROCESSOR PROVIDES ITS OWN METHOD.
			 */

			/**
			 * Replace the inner text of an HTML with the passed content.
			 *
			 * @param string $new_content New text to insert in the HTML element.
			 * @return bool Whether the inner text was properly replaced.
			 */
			public function gutenberg_set_inner_text( $new_content ) {
				/*
				 * THIS IS A STOP-GAP MEASURE NOT TO BE EMULATED.
				 *
				 * Check that the processor is paused on an opener tag.
				 *
				 */
				if (
					WP_HTML_Tag_Processor::STATE_MATCHED_TAG !== $this->parser_state ||
					$this->is_tag_closer()
				) {
					return false;
				}

				// Set position of the opener tag.
				$this->set_bookmark( 'opener_tag' );

				/*
				 * This is a best-effort guess to visit the closer tag and check it exists.
				 * In the future, this code should rely on the HTML Processor for this kind of operation.
				 */
				$tag_name = $this->get_tag();
				if ( ! $this->next_tag(
					array(
						'tag_name'    => $tag_name,
						'tag_closers' => 'visit',
					)
				) || ! $this->is_tag_closer() ) {
					return false;
				}

				// Set position of the closer tag.
				$this->set_bookmark( 'closer_tag' );

				// Get opener and closer tag bookmarks.
				$opener_tag_bookmark = $this->bookmarks['opener_tag'];
				$closer_tag_bookmark = $this->bookmarks['closer_tag'];

				// Appends the new content.
				$after_opener_tag = $opener_tag_bookmark->start + $opener_tag_bookmark->length;
				/*
				 * There was a bug in the HTML Processor token length fixed after 6.5.
				 * This check is needed to add compatibility for that.
				 * Related issue: https://github.com/WordPress/wordpress-develop/pull/6625
				 */
				if ( '>' === $this->html[ $after_opener_tag ] ) {
					++$after_opener_tag;
				}
				$inner_content_length    = $closer_tag_bookmark->start - $after_opener_tag;
				$this->lexical_updates[] = new WP_HTML_Text_Replacement( $after_opener_tag, $inner_content_length, $new_content );
				return true;
			}

			/**
			 * Add a new HTML element after the current tag.
			 *
			 * @param string $new_element New HTML element to append after the current tag.
			 */
			public function gutenberg_append_element_after_tag( $new_element ) {
				$tag_name = $this->get_tag();
				$this->set_bookmark( 'current_tag' );
				// Visit the closing tag if exists.
				if ( ! $this->next_tag(
					array(
						'tag_name'    => $tag_name,
						'tag_closers' => 'visit',
					)
				) || ! $this->is_tag_closer() ) {
					$this->seek( 'current_tag' );
					$this->release_bookmark( 'current_tag' );
				}

				// Get position of the closer tag.
				$this->set_bookmark( 'closer_tag' );
				$closer_tag_bookmark = $this->bookmarks['closer_tag'];
				$after_closer_tag    = $closer_tag_bookmark->start + $closer_tag_bookmark->length;
				/*
				 * There was a bug in the HTML Processor token length fixed after 6.5.
				 * This check is needed to add compatibility for that.
				 * Related issue: https://github.com/WordPress/wordpress-develop/pull/6625
				 */
				if ( '>' === $this->html[ $after_closer_tag ] ) {
					++$after_closer_tag;
				}

				// Append the new element.
				$this->lexical_updates[] = new WP_HTML_Text_Replacement( $after_closer_tag, 0, $new_element );
				$this->release_bookmark( 'closer_tag' );
			}

			/**
			 * Remove the current tag element.
			 *
			 * @return bool Whether the element was properly removed.
			 */
			public function gutenberg_remove_current_tag_element() {
				// Get position of the opener tag.
				$this->set_bookmark( 'opener_tag' );
				$opener_tag_bookmark = $this->bookmarks['opener_tag'];

				// Visit the closing tag.
				$tag_name = $this->get_tag();
				if ( ! $this->next_tag(
					array(
						'tag_name'    => $tag_name,
						'tag_closers' => 'visit',
					)
				) || ! $this->is_tag_closer() ) {
					$this->release_bookmark( 'opener_tag' );
					return false;
				}

				// Get position of the closer tag.
				$this->set_bookmark( 'closer_tag' );
				$closer_tag_bookmark = $this->bookmarks['closer_tag'];

				// Remove the current tag.
				$after_closer_tag = $closer_tag_bookmark->start + $closer_tag_bookmark->length;
				/*
				 * There was a bug in the HTML Processor token length fixed after 6.5.
				 * This check is needed to add compatibility for that.
				 * Related issue: https://github.com/WordPress/wordpress-develop/pull/6625
				 */
				if ( '>' === $this->html[ $after_closer_tag ] ) {
					++$after_closer_tag;
				}
				$current_tag_length      = $after_closer_tag - $opener_tag_bookmark->start;
				$this->lexical_updates[] = new WP_HTML_Text_Replacement( $opener_tag_bookmark->start, $current_tag_length, '' );
				$this->release_bookmark( 'opener_tag' );
				$this->release_bookmark( 'closer_tag' );
				return true;
			}
		};

		/*
		 * For backward compatibility, the logic from the image render needs to be replicated.
		 * This is because the block attributes can't be modified with the binding value with `render_block_data` filter,
		 * as it doesn't have access to the block instance.
		 */
		if ( $block_reader->next_tag( 'figure' ) ) {
			$block_reader->set_bookmark( 'figure' );
		}

					$new_value = wp_kses_post( $source_value );

		if ( $block_reader->next_tag( 'figcaption' ) ) {
			if ( empty( $new_value ) ) {
				$block_reader->gutenberg_remove_current_tag_element();
			} else {
				$block_reader->gutenberg_set_inner_text( $new_value );
			}
		} else {
			$block_reader->seek( 'figure' );
			if ( ! $block_reader->next_tag( 'a' ) ) {
				$block_reader->seek( 'figure' );
				$block_reader->next_tag( 'img' );
			}
			$block_reader->gutenberg_append_element_after_tag( '<figcaption class="wp-element-caption">' . $new_value . '</figcaption>' );
		}
					return $block_reader->get_updated_html();
	}

	/**
	 * Process the block bindings attribute.
	 *
	 * @param string   $block_content Block Content.
	 * @param array    $parsed_block  The full block, including name and attributes.
	 * @param WP_Block $block_instance The block instance.
	 * @return string  Block content with the bind applied.
	 */
	function gutenberg_process_block_bindings( $block_content, $parsed_block, $block_instance ) {
		$modified_block_content = $block_content;
		foreach ( $parsed_block['attrs']['metadata']['bindings'] as $attribute_name => $block_binding ) {
			// Only process the caption for compatibility.
			if ( 'caption' !== $attribute_name ) {
				continue;
			}

			$block_binding_source = get_block_bindings_source( $block_binding['source'] );
			$source_args          = ! empty( $block_binding['args'] ) && is_array( $block_binding['args'] ) ? $block_binding['args'] : array();
			$source_value         = $block_binding_source->get_value( $source_args, $block_instance, $attribute_name );

			// If the value is not null, process the HTML based on the block and the attribute.
			if ( ! is_null( $source_value ) ) {
				$modified_block_content = gutenberg_block_bindings_replace_caption( $modified_block_content, $block_instance->name, $attribute_name, $source_value );
			}
		}

		return $modified_block_content;
	}

	add_filter( 'render_block_core/image', 'gutenberg_process_block_bindings', 20, 3 );
}
