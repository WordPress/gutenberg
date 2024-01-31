<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Shim for the `variation_callback` block type argument.
 *
 * @param array $args The block type arguments.
 * @return array The updated block type arguments.
 */
function gutenberg_register_block_type_args_shim( $args ) {
	if ( isset( $args['variation_callback'] ) && is_callable( $args['variation_callback'] ) ) {
		$args['variations'] = call_user_func( $args['variation_callback'] );
		unset( $args['variation_callback'] );
	}
	return $args;
}

if ( ! method_exists( 'WP_Block_Type', 'get_variations' ) ) {
	add_filter( 'register_block_type_args', 'gutenberg_register_block_type_args_shim' );
}


/**
 * Registers the metadata block attribute for all block types.
 *
 * @param array $args Array of arguments for registering a block type.
 * @return array $args
 */
function gutenberg_register_metadata_attribute( $args ) {
	// Setup attributes if needed.
	if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
		$args['attributes'] = array();
	}

	if ( ! array_key_exists( 'metadata', $args['attributes'] ) ) {
		$args['attributes']['metadata'] = array(
			'type' => 'object',
		);
	}

	return $args;
}
add_filter( 'register_block_type_args', 'gutenberg_register_metadata_attribute' );

/**
 * Replaces the HTML content of a block based on the provided source value.
 *
 * @param string $block_content Block Content.
 * @param string $block_name The name of the block to process.
 * @param string $block_attr The attribute of the block we want to process.
 * @param string $source_value The value used to replace the HTML.
 * @return string The modified block content.
 */
function gutenberg_block_bindings_replace_html( $block_content, $block_name, $block_attr, $source_value ) {
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
	if ( null === $block_type ) {
		return;
	}

	// Depending on the attribute source, the processing will be different.
	switch ( $block_type->attributes[ $block_attr ]['source'] ) {
		case 'html':
		case 'rich-text':
			$block_reader = new WP_HTML_Tag_Processor( $block_content );

			// TODO: Support for CSS selectors whenever they are ready in the HTML API.
			// In the meantime, support comma-separated selectors by exploding them into an array.
			$selectors = explode( ',', $block_type->attributes[ $block_attr ]['selector'] );
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
					'tag_name' => $block_type->attributes[ $block_attr ]['selector'],
				)
			) ) {
				return $block_content;
			}
			$amended_content->set_attribute( $block_type->attributes[ $block_attr ]['attribute'], esc_attr( $source_value ) );
			return $amended_content->get_updated_html();
		break;

		default:
			return $block_content;
		break;
	}
	return;
}

	/**
	 * Process the block bindings attribute.
	 *
	 * @param string   $block_content Block Content.
	 * @param array    $block Block attributes.
	 * @param WP_Block $block_instance The block instance.
	 */
function gutenberg_process_block_bindings( $block_content, $block, $block_instance ) {
	// Allowed blocks that support block bindings.
	// TODO: Look for a mechanism to opt-in for this. Maybe adding a property to block attributes?
	$allowed_blocks = array(
		'core/paragraph' => array( 'content' ),
		'core/heading'   => array( 'content' ),
		'core/image'     => array( 'url', 'title', 'alt' ),
		'core/button'    => array( 'url', 'text' ),
	);

	// If the block doesn't have the bindings property or isn't one of the allowed block types, return.
	if ( ! isset( $block['attrs']['metadata']['bindings'] ) || ! isset( $allowed_blocks[ $block_instance->name ] ) ) {
		return $block_content;
	}

	/*
	 * Assuming the following format for the bindings property of the "metadata" attribute:
	 *
	 * "bindings": {
	 *   "title": {
	 *     "source": "core/post-meta",
	 *     "args": { "key": "text_custom_field" }
	 *   },
	 *   "url": {
	 *     "source": "core/post-meta",
	 *     "args": { "key": "url_custom_field" }
	 *   }
	 * }
	 */

	$block_bindings_sources = get_all_registered_block_bindings_sources();
	$modified_block_content = $block_content;
	foreach ( $block['attrs']['metadata']['bindings'] as $binding_attribute => $binding_source ) {
		// If the attribute is not in the list, process next attribute.
		if ( ! in_array( $binding_attribute, $allowed_blocks[ $block_instance->name ], true ) ) {
			continue;
		}
		// If no source is provided, or that source is not registered, process next attribute.
		if ( ! isset( $binding_source['source'] ) || ! is_string( $binding_source['source'] ) || ! isset( $block_bindings_sources[ $binding_source['source'] ] ) ) {
			continue;
		}

		$source_callback = $block_bindings_sources[ $binding_source['source'] ]['get_value_callback'];
		// Get the value based on the source.
		if ( ! isset( $binding_source['args'] ) ) {
			$source_args = array();
		} else {
			$source_args = $binding_source['args'];
		}
		$source_value = $source_callback( $source_args, $block_instance, $binding_attribute );
		// If the value is null, process next attribute.
		if ( is_null( $source_value ) ) {
			continue;
		}

		// Process the HTML based on the block and the attribute.
		$modified_block_content = gutenberg_block_bindings_replace_html( $modified_block_content, $block_instance->name, $binding_attribute, $source_value );
	}
	return $modified_block_content;
}

add_filter( 'render_block', 'gutenberg_process_block_bindings', 20, 3 );
