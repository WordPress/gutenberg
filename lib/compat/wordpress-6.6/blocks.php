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
	 * Depending on the block attribute name, replace its value in the HTML based on the value provided.
	 *
	 * @param string $block_content  Block Content.
	 * @param string $block_name     The name of the block to process.
	 * @param string $attribute_name The attribute name to replace.
	 * @param mixed  $source_value   The value used to replace in the HTML.
	 * @return string The modified block content.
	 */
	function gutenberg_block_bindings_replace_html( $block_content, $block_name, string $attribute_name, $source_value ) {
		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
		if ( ! isset( $block_type->attributes[ $attribute_name ]['source'] ) ) {
			return $block_content;
		}

		// Depending on the attribute source, the processing will be different.
		switch ( $block_type->attributes[ $attribute_name ]['source'] ) {
			case 'html':
			case 'rich-text':
				if ( 'core/image' === $block_name && 'caption' === $attribute_name ) {
					// Create private anonymous class until the HTML API provides `set_inner_html` method.
					$block_reader = new class($block_content) extends WP_HTML_Tag_Processor{
						/**
						 * THESE METHODS ARE A TEMPORARY SOLUTION IN CORE NOT TO BE EMULATED.
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

				$block_reader = new WP_HTML_Tag_Processor( $block_content );

				// TODO: Support for CSS selectors whenever they are ready in the HTML API.
				// In the meantime, support comma-separated selectors by exploding them into an array.
				$selectors = explode( ',', $block_type->attributes[ $attribute_name ]['selector'] );
				// Add a bookmark to the first tag to be able to iterate over the selectors.
				$block_reader->next_tag();
				$block_reader->set_bookmark( 'iterate-selectors' );

				// TODO: This shouldn't be needed when the `set_inner_html` function is ready.
				// Store the parent tag and its attributes to be able to restore them later in the button.
				// The button block has a wrapper while the paragraph and heading blocks don't.
				if ( 'core/button' === $block_name ) {
					$button_wrapper                 = $block_reader->get_tag();
					$button_wrapper_attribute_names = $block_reader->get_attribute_names_with_prefix( '' );
					$button_wrapper_attrs           = array();
					foreach ( $button_wrapper_attribute_names as $name ) {
						$button_wrapper_attrs[ $name ] = $block_reader->get_attribute( $name );
					}
				}

				foreach ( $selectors as $selector ) {
					// If the parent tag, or any of its children, matches the selector, replace the HTML.
					if ( strcasecmp( $block_reader->get_tag( $selector ), $selector ) === 0 || $block_reader->next_tag(
						array(
							'tag_name' => $selector,
						)
					) ) {
						$block_reader->release_bookmark( 'iterate-selectors' );

						// TODO: Use `set_inner_html` method whenever it's ready in the HTML API.
						// Until then, it is hardcoded for the paragraph, heading, and button blocks.
						// Store the tag and its attributes to be able to restore them later.
						$selector_attribute_names = $block_reader->get_attribute_names_with_prefix( '' );
						$selector_attrs           = array();
						foreach ( $selector_attribute_names as $name ) {
							$selector_attrs[ $name ] = $block_reader->get_attribute( $name );
						}
						$selector_markup = "<$selector>" . wp_kses_post( $source_value ) . "</$selector>";
						$amended_content = new WP_HTML_Tag_Processor( $selector_markup );
						$amended_content->next_tag();
						foreach ( $selector_attrs as $attribute_key => $attribute_value ) {
							$amended_content->set_attribute( $attribute_key, $attribute_value );
						}
						if ( 'core/paragraph' === $block_name || 'core/heading' === $block_name ) {
							return $amended_content->get_updated_html();
						}
						if ( 'core/button' === $block_name ) {
							$button_markup  = "<$button_wrapper>{$amended_content->get_updated_html()}</$button_wrapper>";
							$amended_button = new WP_HTML_Tag_Processor( $button_markup );
							$amended_button->next_tag();
							foreach ( $button_wrapper_attrs as $attribute_key => $attribute_value ) {
								$amended_button->set_attribute( $attribute_key, $attribute_value );
							}
							return $amended_button->get_updated_html();
						}
					} else {
						$block_reader->seek( 'iterate-selectors' );
					}
				}
				$block_reader->release_bookmark( 'iterate-selectors' );
				return $block_content;

			case 'attribute':
				$amended_content = new WP_HTML_Tag_Processor( $block_content );
				if ( ! $amended_content->next_tag(
					array(
						// TODO: build the query from CSS selector.
						'tag_name' => $block_type->attributes[ $attribute_name ]['selector'],
					)
				) ) {
					return $block_content;
				}
				$amended_content->set_attribute( $block_type->attributes[ $attribute_name ]['attribute'], $source_value );
				return $amended_content->get_updated_html();

			default:
				return $block_content;
		}
	}

	/**
	 * Check if the parsed block is supported by block bindings and it includes the bindings attribute.
	 *
	 * @param array $parsed_block  The full block, including name and attributes.
	 */
	function gutenberg_is_valid_block_for_block_bindings( $parsed_block ) {
		$supported_blocks = array(
			'core/paragraph',
			'core/heading',
			'core/image',
			'core/button',
		);

		// Check if the block is supported.
		if (
		! in_array( $parsed_block['blockName'], $supported_blocks, true ) ||
		empty( $parsed_block['attrs']['metadata']['bindings'] ) ||
		! is_array( $parsed_block['attrs']['metadata']['bindings'] )
		) {
			return false;
		}

		return true;
	}

	/**
	 * Check if the binding created is valid.
	 *
	 * @param array  $parsed_block   The full block, including name and attributes.
	 * @param string $attribute_name The attribute name being processed.
	 * @param array  $block_binding  The block binding configuration.
	 */
	function gutenberg_is_valid_block_binding( $parsed_block, $attribute_name, $block_binding ) {
		// Check if it is a valid block.
		if ( ! gutenberg_is_valid_block_for_block_bindings( $parsed_block ) ) {
			return false;
		}

		$supported_block_attrs = array(
			'core/paragraph' => array( 'content' ),
			'core/heading'   => array( 'content' ),
			'core/image'     => array( 'id', 'url', 'title', 'alt', 'caption' ),
			'core/button'    => array( 'url', 'text', 'linkTarget', 'rel' ),
		);

		// Check if the attribute is not in the supported list.
		if ( ! in_array( $attribute_name, $supported_block_attrs[ $parsed_block['blockName'] ], true ) ) {
			return false;
		}
		// Check if no source is provided, or that source is not registered.
		if ( ! isset( $block_binding['source'] ) || ! is_string( $block_binding['source'] ) || null === get_block_bindings_source( $block_binding['source'] ) ) {
			return false;
		}

		return true;
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
		if ( ! gutenberg_is_valid_block_for_block_bindings( $parsed_block ) ) {
			return $block_content;
		}
		$modified_block_content = $block_content;
		foreach ( $parsed_block['attrs']['metadata']['bindings'] as $attribute_name => $block_binding ) {
			if ( ! gutenberg_is_valid_block_binding( $parsed_block, $attribute_name, $block_binding ) ) {
				continue;
			}

			$block_binding_source = get_block_bindings_source( $block_binding['source'] );
			$source_args          = ! empty( $block_binding['args'] ) && is_array( $block_binding['args'] ) ? $block_binding['args'] : array();
			$source_value         = $block_binding_source->get_value( $source_args, $block_instance, $attribute_name );

			// If the value is not null, process the HTML based on the block and the attribute.
			if ( ! is_null( $source_value ) ) {
				$modified_block_content = gutenberg_block_bindings_replace_html( $modified_block_content, $block_instance->name, $attribute_name, $source_value );
			}
		}

		return $modified_block_content;
	}

	add_filter( 'render_block', 'gutenberg_process_block_bindings', 20, 3 );
}
