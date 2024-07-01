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

// Only process block bindings if they are not processed in core.
if ( ! class_exists( 'WP_Block_Bindings_Registry' ) ) {
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
						 * Replace the inner text of an HTML with the passed content.
						 *
						 * THIS IS A TEMPORARY SOLUTION IN CORE NOT TO BE EMULATED.
						 * IT IS A TEMPORARY SOLUTION THAT JUST WORKS FOR THIS SPECIFIC
						 * USE CASE UNTIL THE HTML PROCESSOR PROVIDES ITS OWN METHOD.
						 *
						 * @param string $new_content New text to insert in the HTML element.
						 * @return bool Whether the inner text was properly replaced.
						 */
						public function gutenberg_set_inner_text( $new_content ) {
							return;
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
							$opener_tag_bookmark = $this->bookmarks['_opener_tag'];
							$closer_tag_bookmark = $this->bookmarks['_closer_tag'];

							// Appends the new content.
							$after_opener_tag        = $opener_tag_bookmark->start + $opener_tag_bookmark->length;
							$inner_content_length    = $closer_tag_bookmark->start - $after_opener_tag;
							$this->lexical_updates[] = new WP_HTML_Text_Replacement( $after_opener_tag, $inner_content_length, $new_content );
							return true;
						}
					};
					if ( $block_reader->next_tag( 'figcaption' ) ) {
						$block_reader->gutenberg_set_inner_text( wp_kses_post( $source_value ) );
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
	 * Replace the block attributes and the HTML with the values from block bindings.
	 * These filters are temporary for backward-compatibility. It is handled properly without filters in core.
	 *
	 */
	add_filter(
		'render_block_data',
		/**
		 * Filter to modify the block attributes with a placeholder value for each attribute that has a block binding.
		 *
		 * @param array    $parsed_block  The full block, including name and attributes.
		 */
		function ( $parsed_block ) {
			if ( ! gutenberg_is_valid_block_for_block_bindings( $parsed_block ) ) {
				return $parsed_block;
			}

			foreach ( $parsed_block['attrs']['metadata']['bindings'] as $attribute_name => $block_binding ) {
				if ( ! gutenberg_is_valid_block_binding( $parsed_block, $attribute_name, $block_binding ) ) {
					continue;
				}
				// Adds a placeholder value that will get replaced by the replace_html in the render_block filter.
				$parsed_block['attrs'][ $attribute_name ] = 'placeholder';
			}
			return $parsed_block;
		},
		20,
		1
	);

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

/**
 * Enable the viewStyle block API for core versions < 6.5
 *
 */
if ( ! property_exists( 'WP_Block_Type', 'view_style_handles' ) ) {
	/**
	 * Registers viewStyle assets on block type registration (=same moment core would do it).
	 *
	 * @param array $settings Array of determined settings for registering a block type.
	 * @param array $metadata Metadata provided for registering a block type.
	 * @return array The block type settings
	 */
	function gutenberg_filter_block_type_metadata_settings_register_view_styles( $settings, $metadata ) {
		if ( empty( $metadata['viewStyle'] ) ) {
			return $settings;
		}
		$styles           = $metadata['viewStyle'];
		$processed_styles = array();
		if ( is_array( $styles ) ) {
			for ( $index = 0; $index < count( $styles ); $index++ ) {
				$result = gutenberg_register_block_view_style_handle(
					$metadata,
					$index
				);
				if ( $result ) {
					$processed_styles[] = $result;
				}
			}
		} else {
			$result = gutenberg_register_block_view_style_handle(
				$metadata
			);
			if ( $result ) {
				$processed_styles[] = $result;
			}
		}

		if ( ! empty( $processed_styles ) ) {
			$settings['view_style_handles'] = $processed_styles;
		}
		return $settings;
	}

	add_filter( 'block_type_metadata_settings', 'gutenberg_filter_block_type_metadata_settings_register_view_styles', 10, 2 );

	/**
	 * Enqueue view styles associated with the block.
	 *
	 * @param string   $block_content The block content.
	 * @param array    $block         The full block, including name and attributes.
	 * @param WP_Block $instance      The block instance.
	 */
	function gutenberg_filter_render_block_enqueue_view_styles( $block_content, $parsed_block, $block_instance ) {
		$block_type = $block_instance->block_type;

		if ( ! empty( $block_type->view_style_handles ) ) {
			foreach ( $block_type->view_style_handles as $view_style_handle ) {
				wp_enqueue_style( $view_style_handle );
			}
		}

		return $block_content;
	}

	add_filter( 'render_block', 'gutenberg_filter_render_block_enqueue_view_styles', 10, 3 );


	/**
	 * Registers a REST field for block types to provide view styles.
	 *
	 * Adds the `view_style_handles` field to block type objects in the REST API, which
	 * lists the style handles associated with the block's viewStyle key.
	 */
	function gutenberg_register_view_style_rest_field() {
		register_rest_field(
			'block-type',
			'view_style_handles',
			array(
				'get_callback' => function ( $item ) {
					$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $item['name'] );
					if ( isset( $block_type->view_style_handles ) ) {
						return $block_type->view_style_handles;
					}
					return array();
				},
			)
		);
	}

	add_action( 'rest_api_init', 'gutenberg_register_view_style_rest_field' );

	/**
	 * A compat version of `register_block_style_handle()` to use the viewStyle handle.
	 * Required for core versions < 6.5, since a custom version of generate_block_asset_handle has to be used
	 * that supports the viewStyle property and correctly creates the handle
	 *
	 * @param array  $metadata   Block metadata.
	 * @param int    $index      Optional. Index of the style to register when multiple items passed.
	 *                           Default 0.
	 * @return string|false Style handle provided directly or created through
	 *                      style's registration, or false on failure.
	 */
	function gutenberg_register_block_view_style_handle( $metadata, $index = 0 ) {
		$style_handle = $metadata['viewStyle'];
		if ( is_array( $style_handle ) ) {
			if ( empty( $style_handle[ $index ] ) ) {
				return false;
			}
			$style_handle = $style_handle[ $index ];
		}
		$style_handle_name = gutenberg_generate_view_style_block_asset_handle( $metadata['name'], $index );
		// If the style handle is already registered, skip re-registering.
		if ( wp_style_is( $style_handle_name, 'registered' ) ) {
			return $style_handle_name;
		}
		static $wpinc_path_norm = '';
		if ( ! $wpinc_path_norm ) {
			$wpinc_path_norm = wp_normalize_path( realpath( ABSPATH . WPINC ) );
		}
		$is_core_block = isset( $metadata['file'] ) && str_starts_with( $metadata['file'], $wpinc_path_norm );
		// Skip registering individual styles for each core block when a bundled version provided.
		if ( $is_core_block && ! wp_should_load_separate_core_block_assets() ) {
			return false;
		}
		$style_path      = remove_block_asset_path_prefix( $style_handle );
		$is_style_handle = $style_handle === $style_path;
		// Allow only passing style handles for core blocks.
		if ( $is_core_block && ! $is_style_handle ) {
			return false;
		}
		// Return the style handle unless it's the first item for every core block that requires special treatment.
		if ( $is_style_handle && ! ( $is_core_block && 0 === $index ) ) {
			return $style_handle;
		}
		// Check whether styles should have a ".min" suffix or not.
		$suffix = SCRIPT_DEBUG ? '' : '.min';
		if ( $is_core_block ) {
			$style_path = "view{$suffix}.css"; // Use view.css for viewStyle of core blocks
		}
		$style_path_norm = wp_normalize_path( realpath( dirname( $metadata['file'] ) . '/' . $style_path ) );
		$style_uri       = get_block_asset_url( $style_path_norm );
		$version         = ! $is_core_block && isset( $metadata['version'] ) ? $metadata['version'] : false;
		$result          = wp_register_style(
			$style_handle_name,
			$style_uri,
			array(),
			$version
		);
		if ( ! $result ) {
			return false;
		}
		if ( $style_uri ) {
			wp_style_add_data( $style_handle_name, 'path', $style_path_norm );
			if ( $is_core_block ) {
				$rtl_file = str_replace( "{$suffix}.css", "-rtl{$suffix}.css", $style_path_norm );
			} else {
				$rtl_file = str_replace( '.css', '-rtl.css', $style_path_norm );
			}
			if ( is_rtl() && file_exists( $rtl_file ) ) {
				wp_style_add_data( $style_handle_name, 'rtl', 'replace' );
				wp_style_add_data( $style_handle_name, 'suffix', $suffix );
				wp_style_add_data( $style_handle_name, 'path', $rtl_file );
			}
		}
		return $style_handle_name;
	}

	/**
	 * A compat version of `generate_block_asset_handle()` to use the viewStyle asset handle.
	 *
	 * @param string $block_name Name of the block.
	 * @param string $field_name Name of the metadata field.
	 * @param int    $index      Optional. Index of the asset when multiple items passed.
	 *                           Default 0.
	 * @return string Generated asset name for the block's field.
	 */
	function gutenberg_generate_view_style_block_asset_handle( $block_name, $index = 0 ) {
		if ( str_starts_with( $block_name, 'core/' ) ) {
			$asset_handle  = str_replace( 'core/', 'wp-block-', $block_name );
			$asset_handle .= '-view';
			if ( $index > 0 ) {
				$asset_handle .= '-' . ( $index + 1 );
			}
			return $asset_handle;
		}

		$asset_handle = str_replace( '/', '-', $block_name ) . '-view-style';
		if ( $index > 0 ) {
			$asset_handle .= '-' . ( $index + 1 );
		}
		return $asset_handle;
	}
}
