<?php
/**
 * Block Bindings API: WP_Block_Bindings class.
 *
 * Support for overriding content in blocks by connecting them to different sources.
 *
 * @since 17.6.0
 * @package gutenberg
 */

if ( class_exists( 'WP_Block_Bindings' ) ) {
	return;
}

/**
 * Core class used to define supported blocks, register sources, and populate HTML with content from those sources.
 */
class WP_Block_Bindings {

	/**
	 * Holds the registered block bindings sources, keyed by source identifier.
	 *
	 * @var array
	 */
	private $sources = array();

	/**
	 * Function to register a new source.
	 *
	 * @param string   $source_name The name of the source.
	 * @param string   $label The label of the source.
	 * @param callable $apply The callback executed when the source is processed during block rendering. The callable should have the following signature:
	 *                        function (object $source_attrs, object $block_instance, string $attribute_name): string
	 *                        - object $source_attrs: Object containing source ID used to look up the override value, i.e. {"value": "{ID}"}.
	 *                        - object $block_instance: The block instance.
	 *                        - string $attribute_name: The name of an attribute used to retrieve an override value from the block context.
	 *                        The callable should return a string that will be used to override the block's original value.
	 *
	 * @return void
	 */
	public function register_source( $source_name, $label, $apply ) {
		$this->sources[ $source_name ] = array(
			'label' => $label,
			'apply' => $apply,
		);
	}

	/**
	 * Depending on the block attributes, replace the proper HTML based on the value returned by the source.
	 *
	 * @param string $block_content Block Content.
	 * @param string $block_name The name of the block to process.
	 * @param string $block_attr The attribute of the block we want to process.
	 * @param string $source_value The value used to replace the HTML.
	 */
	public function replace_html( $block_content, $block_name, $block_attr, $source_value ) {
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
	 * Retrieves the list of registered block sources.
	 *
	 * @return array The array of registered sources.
	 */
	public function get_sources() {
		return $this->sources;
	}
}
