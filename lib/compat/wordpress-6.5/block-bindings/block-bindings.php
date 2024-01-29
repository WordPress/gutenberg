<?php
/**
 * Block Bindings API
 *
 * Contains functions for managing block bindings in WordPress.
 *
 * @package WordPress
 * @subpackage Block Bindings
 * @since 6.5.0
 */

/**
 * Registers a new block bindings source.
 *
 * Sources are used to override block's original attributes with a value
 * coming from the source. Once a source is registered, it can be used by a
 * block by setting its `metadata.bindings` attribute to a value that refers
 * to the source.
 *
 * @since 6.5.0
 *
 * @param string   $source_name       The name of the source.
 * @param array    $source_properties {
 *     The array of arguments that are used to register a source.
 *
 *     @type string   $label              The label of the source.
 *     @type callback $get_value_callback A callback executed when the source is processed during block rendering.
 *                                        The callback should have the following signature:
 *
 *                                        `function ($source_args, $block_instance,$attribute_name): mixed`
 *                                            - @param array    $source_args    Array containing source arguments
 *                                                                              used to look up the override value,
 *                                                                              i.e. {"key": "foo"}.
 *                                            - @param WP_Block $block_instance The block instance.
 *                                            - @param string   $attribute_name The name of an attribute .
 *                                        The callback has a mixed return type; it may return a string to override
 *                                        the block's original value, null, false to remove an attribute, etc.
 * }
 * @return array|false Source when the registration was successful, or `false` on failure.
 */
if ( ! function_exists( 'register_block_bindings_source' ) ) {
	function register_block_bindings_source( $source_name, array $source_properties ) {
		return WP_Block_Bindings_Registry::get_instance()->register( $source_name, $source_properties );
	}
}

/**
 * Unregisters a block bindings source.
 *
 * @since 6.5.0
 *
 * @param string $source_name Block bindings source name including namespace.
 * @return array|false The unregistred block bindings source on success and `false` otherwise.
 */
if ( ! function_exists( 'unregister_block_bindings_source' ) ) {
	function unregister_block_bindings_source( $source_name ) {
		return WP_Block_Bindings_Registry::get_instance()->unregister( $source_name );
	}
}

/**
 * Retrieves the list of all registered block bindings sources.
 *
 * @since 6.5.0
 *
 * @return array The array of registered block bindings sources.
 */
if ( ! function_exists( 'get_all_registered_block_bindings_sources' ) ) {
	function get_all_registered_block_bindings_sources() {
		return WP_Block_Bindings_Registry::get_instance()->get_all_registered();
	}
}

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
