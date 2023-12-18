<?php
/**
 * Define the mechanism to replpace the HTML depending on the block attributes.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'block_bindings_replace_html' ) ) {
	/**
	 * Depending on the block attributes, replace the proper HTML based on the value returned by the source.
	 *
	 * @param string $block_content Block Content.
	 * @param string $block_name The name of the block to process.
	 * @param string $block_attr The attribute of the block we want to process.
	 * @param string $source_value The value used to replace the HTML.
	 */
	function block_bindings_replace_html( $block_content, $block_name, $block_attr, $source_value ) {
		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
		if ( null === $block_type ) {
			return;
		}

		// Depending on the attribute source, the processing will be different.
		// TODO: Get the type from the block attribute definition and modify/validate the value returned by the source if needed.
		switch ( $block_type->attributes[ $block_attr ]['source'] ) {
			case 'html':
			case 'rich-text':
				$p = new WP_HTML_Tag_Processor( $block_content );

				// TODO: Support for CSS selectors whenever they are ready in the HTML API.
				// In the meantime, support comma-separated selectors by exploding them into an array.
				$selectors = explode( ',', $block_type->attributes[ $block_attr ]['selector'] );
				// Add a bookmark to the first tag to be able to iterate over the selectors.
				$p->next_tag();
				$p->set_bookmark( 'iterate-selectors' );

				// TODO: This shouldn't be needed when the `set_inner_html` function is ready.
				// Store the parent tag and its attributes to be able to restore them later in the button.
				// The button block has a wrapper while the paragraph and heading blocks don't.
				if ( 'core/button' === $block_name ) {
					$parent_tag       = $p->get_tag();
					$parent_tag_names = $p->get_attribute_names_with_prefix( '' );
					$parent_tag_attrs = array();
					foreach ( $parent_tag_names as $name ) {
						$parent_tag_attrs[ $name ] = $p->get_attribute( $name );
					}
				}

				foreach ( $selectors as $selector ) {
					// If the parent tag, or any of its children, matches the selector, replace the HTML.
					if ( strcasecmp( $p->get_tag( $selector ), $selector ) === 0 || $p->next_tag(
						array(
							'tag_name' => $selector,
						)
					) ) {
						$p->release_bookmark( 'iterate-selectors' );

						// TODO: Use `set_inner_html` method whenever it's ready in the HTML API.
						// Until then, it is hardcoded for the paragraph, heading, and button blocks.
						// Store the tag and its attributes to be able to restore them later.
						$selector_tag_names = $p->get_attribute_names_with_prefix( '' );
						$selector_tag_attrs = array();
						foreach ( $selector_tag_names as $name ) {
							$selector_tag_attrs[ $name ] = $p->get_attribute( $name );
						}
						$selector_markup = "<$selector>" . esc_html( $source_value ) . "</$selector>";
						$p2              = new WP_HTML_Tag_Processor( $selector_markup );
						$p2->next_tag();
						foreach ( $selector_tag_attrs as $attribute_key => $attribute_value ) {
							$p2->set_attribute( $attribute_key, $attribute_value );
						}
						$selector_updated_html = $p2->get_updated_html();
						if ( 'core/paragraph' === $block_name || 'core/heading' === $block_name ) {
							return $selector_updated_html;
						}
						if ( 'core/button' === $block_name ) {
							$markup = "<$parent_tag>$selector_updated_html</$parent_tag>";
							$p3     = new WP_HTML_Tag_Processor( $markup );
							$p3->next_tag();
							foreach ( $parent_tag_attrs as $attribute_key => $attribute_value ) {
								$p3->set_attribute( $attribute_key, $attribute_value );
							}
							return $p3->get_updated_html();
						}
					} else {
						$p->seek( 'iterate-selectors' );
					}
				}
				$p->release_bookmark( 'iterate-selectors' );
				return $block_content;

			case 'attribute':
				$p = new WP_HTML_Tag_Processor( $block_content );
				if ( ! $p->next_tag(
					array(
						// TODO: build the query from CSS selector.
						'tag_name' => $block_type->attributes[ $block_attr ]['selector'],
					)
				) ) {
					return $block_content;
				}
				$p->set_attribute( $block_type->attributes[ $block_attr ]['attribute'], esc_attr( $source_value ) );
				return $p->get_updated_html();
				break;

			default:
				return $block_content;
				break;
		}
		return;
	}
}
